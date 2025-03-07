from decimal import Decimal
from datetime import datetime, timedelta
from django.utils.timezone import now
from django.shortcuts import get_object_or_404
from django.db.models import Sum, F
from django.db.models.functions import ExtractMonth
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from .utils import process_inventory_query
import json
import re
import logging
from collections import defaultdict
import numpy as np
import pandas as pd  # Ensure pandas is imported for handling dataframes
import requests

from .models import Product, InventoryTransaction, Order, OrderItem, StockAlert
from .serializers import (
    ProductSerializer, InventorySerializer, OrderSerializer,
    OrderItemSerializer, StockAlertSerializer, InventoryForecastSerializer
)
from .gemini_api import generate_text

logger = logging.getLogger(__name__)

# --------------------------------------------------
# Utility Functions
# --------------------------------------------------
def clean_ai_response(ai_response):
    """Removes Markdown code block formatting from AI response."""
    cleaned = re.sub(r"```json\n(.*?)\n```", r"\1", ai_response, flags=re.DOTALL).strip()
    return cleaned

def get_sales_data():
    """Fetch sales data for the last 12 months."""
    sales_data = defaultdict(int)
    one_year_ago = datetime.now() - timedelta(days=365)
    try:
        orders = (
            Order.objects.filter(order_date__gte=one_year_ago)
            .annotate(month=ExtractMonth('order_date'))
            .values('month')
            .annotate(total_sales=Sum('total_amount'))
        )
        for order in orders:
            sales_data[order['month']] = order['total_sales']
    except Exception as e:
        logger.error("Error fetching sales data: %s", e)
    return [
        {"month": datetime(2000, month, 1).strftime("%b"), "sales": float(sales_data.get(month, 0))}
        for month in range(1, 13)
    ]

LOW_STOCK_THRESHOLD = 10
def get_stock_alerts():
    """Fetch stock levels and return low-stock alerts."""
    try:
        low_stock_products = Product.objects.filter(quantity_in_stock__lt=LOW_STOCK_THRESHOLD)
        return [
            {
                "product": item.name,
                "stockLevel": item.quantity_in_stock,
                "message": f"Low stock ({item.quantity_in_stock})"
            }
            for item in low_stock_products
        ]
    except Exception as e:
        logger.error("Error fetching stock alerts: %s", e)
        return []

# --------------------------------------------------
# Product Views
# --------------------------------------------------
class ProductList(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class SingleProductList(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

# --------------------------------------------------
# Inventory Views
# --------------------------------------------------
class InventoryList(generics.ListCreateAPIView):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventorySerializer

class SingleInventoryList(generics.RetrieveUpdateDestroyAPIView):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventorySerializer

# --------------------------------------------------
# Order Views
# --------------------------------------------------
class OrderList(generics.ListCreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class SingleOrderList(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    http_method_names = ['get', 'put', 'patch', 'delete']

# --------------------------------------------------
# Order Item Views
# --------------------------------------------------
class OrderItemList(generics.ListCreateAPIView):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer

    def create(self, request, *args, **kwargs):
        try:
            order = get_object_or_404(Order, id=request.data.get('order'))
            product = get_object_or_404(Product, id=request.data.get('product'))
            quantity = int(request.data.get('quantity', 0))
            if quantity <= 0:
                return Response({'error': 'Quantity must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)
            if product.quantity_in_stock < quantity:
                return Response({'error': f'Not enough stock for {product.name}.'}, status=status.HTTP_400_BAD_REQUEST)
            product.quantity_in_stock -= quantity
            product.save()
            order_item = OrderItem.objects.create(
                order=order, product=product, quantity=quantity,
                price=product.price * Decimal(quantity)
            )
            order.update_total_amount()
            if product.quantity_in_stock < product.threshold_level:
                StockAlert.objects.get_or_create(
                    product=product, resolved=False,
                    defaults={'stock_level': product.quantity_in_stock}
                )
            return Response(OrderItemSerializer(order_item).data, status=status.HTTP_201_CREATED)
        except ValueError:
            return Response({'error': 'Invalid quantity value.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error("Error creating order item: %s", e)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SingleOrderItemList(generics.RetrieveUpdateDestroyAPIView):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer

# --------------------------------------------------
# Stock Alert Views
# --------------------------------------------------
class StockAlertList(generics.ListAPIView):
    queryset = StockAlert.objects.filter(resolved=False)
    serializer_class = StockAlertSerializer

class SingleStockAlert(generics.RetrieveUpdateDestroyAPIView):
    queryset = StockAlert.objects.all()
    serializer_class = StockAlertSerializer

# --------------------------------------------------
# AI-Powered Demand Forecasting APIs
# --------------------------------------------------
@api_view(['GET'])
@parser_classes([JSONParser])
def forecast_sales(request):
    """
    Forecast sales data for the last 30 days on a per-product basis using a simple average.
    Returns a list of forecasts with:
      - product_name
      - predicted_sales (average sales)
      - confidence_score (dummy value, adjust as needed)
    """
    try:
        start_date = now() - timedelta(days=30)
        orders = Order.objects.filter(order_date__gte=start_date)
        logger.info("Number of orders in the last 30 days: %s", orders.count())

        product_sales = {}
        for order in orders:
            # Check if 'items' exists
            order_items = getattr(order, 'items', None)
            if order_items is None:
                logger.warning("Order %s has no related 'items'. Check your related_name in the model.", order.id)
                continue

            for item in order.items.all():
                product_id = item.product.id
                product_name = item.product.name
                if product_id not in product_sales:
                    product_sales[product_id] = {"product_name": product_name, "sales": []}
                product_sales[product_id]["sales"].append(item.quantity)

        logger.info("Aggregated product sales: %s", product_sales)

        forecast_results = []
        for product_id, data in product_sales.items():
            if data["sales"]:
                avg_sales = np.mean(data["sales"])
                forecast_results.append({
                    "product_name": data["product_name"],
                    "predicted_sales": round(avg_sales, 2),
                    "confidence_score": 0.8  # Dummy confidence score
                })
        
        if forecast_results:
            logger.info("Forecast results: %s", forecast_results)
            return Response({"forecast": forecast_results}, status=status.HTTP_200_OK)
        else:
            logger.info("No sales data found for forecasting.")
            return Response({"message": "No sales data found."}, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error("Error forecasting sales: %s", e)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@parser_classes([JSONParser])
def ai_forecast_demand(request):
    """AI-powered demand forecasting using Gemini API."""
    try:
        past_60_days = now() - timedelta(days=60)
        sales_data = []
        for product in Product.objects.all():
            total_sold = OrderItem.objects.filter(
                product=product, order__order_date__gte=past_60_days
            ).aggregate(total=Sum('quantity'))['total'] or 0
            stock_level = product.quantity_in_stock
            sales_data.append({
                "product_name": product.name,
                "category": product.category or "N/A",
                "total_sales_last_60_days": total_sold,
                "current_stock": stock_level,
            })
        prompt = f"""
You are an AI-powered inventory forecasting system. Given the following sales data:
{json.dumps(sales_data, indent=2)}

Predict the demand for each product over the next 30 days.
Provide output as a JSON list with:
- "product_name"
- "predicted_sales"
- "confidence_score"
Return ONLY valid JSON with no extra commentary.
        """
        ai_response = generate_text(prompt, model_name="gemini-1.5-flash")
        logger.info("Raw AI response (demand forecast): %s", ai_response)
        cleaned_response = clean_ai_response(ai_response)
        logger.info("Cleaned AI response (demand forecast): %s", cleaned_response)
        try:
            forecast_data = json.loads(cleaned_response)
            return Response({"forecast": forecast_data}, status=status.HTTP_200_OK)
        except json.JSONDecodeError as e:
            logger.error("JSON decoding error in ai_forecast_demand: %s. Raw response: %s", e, cleaned_response)
            return Response({"error": "Failed to parse AI response as JSON. AI response was: " + cleaned_response}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        logger.error("Error in ai_forecast_demand: %s", e)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@parser_classes([JSONParser])
def ai_analytics(request):
    """AI-powered analytics using Gemini API with embedded analytics data."""
    try:
        past_30_days = now() - timedelta(days=30)
        monthly_sales = get_sales_data()
        total_sales = OrderItem.objects.filter(order__order_date__gte=past_30_days)\
                        .aggregate(total=Sum('quantity'))['total'] or 0
        total_revenue = Order.objects.filter(order_date__gte=past_30_days)\
                          .aggregate(total=Sum('total_amount'))['total'] or 0
        order_count = Order.objects.filter(order_date__gte=past_30_days).count()
        avg_order_value = float(total_revenue) / order_count if order_count > 0 else 0
        sales_by_category = (
            Product.objects
            .filter(order_items__order__order_date__gte=past_30_days)
            .annotate(total_sold=Sum('order_items__quantity'))
            .values('category', 'total_sold')
        )
        inventory_health = Product.objects.annotate(stock=F('quantity_in_stock')).values('name', 'stock')
        stock_alerts = get_stock_alerts()
        analytics_data = {
            "total_sales": float(total_sales),
            "total_revenue": float(total_revenue),
            "avg_order_value": float(avg_order_value),
            "sales_by_category": [
                {"category": item["category"], "total_sold": float(item["total_sold"] or 0)}
                for item in sales_by_category
            ],
            "inventory_health": [
                {"name": item["name"], "stock": float(item["stock"])}
                for item in inventory_health
            ],
            "monthly_sales": monthly_sales,
            "stock_alerts": stock_alerts
        }
        prompt = f"""
Please generate AI-driven insights and data visualizations for a professional analytics dashboard.
Below is the analytics data computed from our system:
{json.dumps(analytics_data, indent=2)}

Based on the above data, create a JSON response with the following structure:

1. Key Performance Indicators (KPIs):
   - totalRevenue
   - averageOrderValue
   - totalOrders
   - totalProducts
   - totalInventory
   - topCategories: A list of the top 3 selling product categories with their total sales.

2. Monthly Sales Trend (Line Chart Data):
   - An array of objects, each with 'month' (YYYY-MM) and 'totalSales'.

3. Sales by Category (Pie Chart Data):
   - An array of objects, each with 'category' and 'sales'.

4. Inventory Health (Bar Chart Data):
   - totalProductsInStock
   - lowStockItems
   - outOfStockItems

5. Recent Orders (Table Data):
   - A list of the 5 most recent orders, each with order number, customer name, total amount, and date.

6. Stock Alerts (Stock Health):
   - A list of stock alerts for items with low stock.

Return ONLY a JSON object matching the structure above with no additional commentary.
        """
        ai_response = generate_text(prompt, model_name="gemini-1.5-flash")
        cleaned_response = clean_ai_response(ai_response)
        try:
            return Response(json.loads(cleaned_response), status=status.HTTP_200_OK)
        except json.JSONDecodeError as e:
            logger.error("JSON decoding error in ai_analytics: %s", e)
            return Response({"error": "Failed to parse AI response as JSON."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        logger.error("Error in ai_analytics: %s", e)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --------------------------------------------------
# AI Chat Handler (Class-based View)
# --------------------------------------------------
class ChatbotAPIView(APIView):
    """Handles AI-powered chat for inventory insights."""
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            
            # ✅ Extract Query and Uploaded Data from Nested JSON
            contents = data.get("contents", [])
            uploaded_data = data.get("uploaded_data", None)
            
            if contents and isinstance(contents, list) and "parts" in contents[0] and isinstance(contents[0]["parts"], list):
                query = contents[0]["parts"][0].get("text", "").strip()
            else:
                return Response({"error": "Query cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)

            if not query:
                return Response({"error": "Query cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)

            # 🔹 Initialize variables for database data
            inventory = []
            sales_data = []
            best_selling = []
            slow_moving = []
            stock_trends = []
            low_stock = []
            total_revenue = 0
            has_database_data = False

            try:
                # Try to fetch database data if available
                thirty_days_ago = now() - timedelta(days=30)
                inventory = list(Product.objects.values("id", "name", "category", "price", "quantity_in_stock", "threshold_level"))
                
                if inventory:  # Only proceed if we have inventory data
                    has_database_data = True
                    # Get sales data for the last 30 days with related Order data
                    sales_data = list(OrderItem.objects.filter(order__order_date__gte=thirty_days_ago)
                                  .select_related('order')
                                  .values("product_id", "quantity", "order__order_date", "order__total_amount"))

                    # Convert Decimal fields for JSON
                    for prod in inventory:
                        prod["price"] = float(prod["price"])
                        prod["quantity_in_stock"] = int(prod["quantity_in_stock"])
                        prod["threshold_level"] = int(prod["threshold_level"])

                    for sale in sales_data:
                        sale["order__total_amount"] = float(sale["order__total_amount"])
                        sale["order__order_date"] = sale["order__order_date"].isoformat()

                    # Calculate database insights
                    total_revenue = sum(item["order__total_amount"] for item in sales_data)

                    product_sales = {}
                    for item in sales_data:
                        product_sales[item["product_id"]] = product_sales.get(item["product_id"], 0) + item["quantity"]

                    best_selling = [prod["name"] for prod in inventory if product_sales.get(prod["id"], 0) > 50]
                    slow_moving = [prod["name"] for prod in inventory if product_sales.get(prod["id"], 0) < 10]
                    stock_trends = [{"name": prod["name"], "stock": prod["quantity_in_stock"]} for prod in inventory]
                    low_stock = [prod["name"] for prod in inventory if prod["quantity_in_stock"] < prod["threshold_level"]]
            except Exception as e:
                logger.warning(f"Failed to fetch database data: {e}. Proceeding with uploaded data only.")

            # 🔹 AI Prompt
            prompt = f"""
            You are an AI assistant helping a retailer analyze inventory and sales data.

            ### User Query:
            "{query}"

            {f'''### Database Inventory Overview:
            {json.dumps(inventory)}

            ### Database Sales Data (Last 30 Days):
            {json.dumps(sales_data)}

            ### Database Insights:
            - Best-selling products: {json.dumps(best_selling)}
            - Slow-moving products: {json.dumps(slow_moving)}
            - Stock trends: {json.dumps(stock_trends)}
            - Low-stock items: {json.dumps(low_stock)}
            - Total revenue: {total_revenue}''' if has_database_data else '### Note: No database data available. Working with uploaded data only.'}

            {f'''### Uploaded Data:
            {json.dumps(uploaded_data)}''' if uploaded_data else ''}

            ### Context:
            {"Working with both database and uploaded data." if has_database_data and uploaded_data else
             "Working with uploaded data only." if uploaded_data else
             "Working with database data only." if has_database_data else
             "No data available. Please upload inventory data to begin analysis."}

            ### AI Response Guidelines:
            - If no data is available, guide the user to upload their inventory data.
            - If only uploaded data is available, focus on analyzing that data comprehensively.
            - If both database and uploaded data are available:
              * If the user asks about uploaded data, focus on analyzing that data.
              * If the user asks about general inventory, use the database data.
              * If relevant, combine insights from both sources.
            - Answer concisely based on available data.
            - Use structured JSON output:
            
            ```json
            {{
              "answer": "Your response here",
              "recommendation": "Any business advice",
              "additional_info": "Extra insights (if needed)"
            }}
            ```
            """

            ai_response = generate_text(prompt, model_name="gemini-1.5-flash").strip()

            # 🔥 Remove markdown formatting
            if ai_response.startswith("```json"):
                ai_response = ai_response.replace("```json", "").replace("```", "").strip()

            # 🔹 Validate Response
            try:
                structured_response = json.loads(ai_response)
            except json.JSONDecodeError:
                logger.error("Invalid AI Response Format: %s", ai_response)
                return Response(
                    {"error": "AI returned invalid format", "raw_response": ai_response}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            return Response({"success": True, "response": structured_response}, status=status.HTTP_200_OK)

        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON format"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error("ChatbotAPIView Error: %s", e)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# User Excel Input Analytics 

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def inventory_forecast(request):
    """
    POST endpoint for AI-powered inventory analytics and forecasting.
    Supports JSON payload or CSV/Excel file upload.
    """
    try:
        raw_data = None

        # Handle JSON input
        if request.content_type == "application/json":
            raw_data = request.data.get("data")
            # Validate required fields in JSON data
            if raw_data:
                for item in raw_data:
                    if not isinstance(item, dict) or not all(k in item for k in ['product_name', 'stock', 'sales_last_month']):
                        return Response(
                            {"error": "Malformed JSON data. Each item must have product_name, stock, and sales_last_month fields"}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )

        # Handle file upload (CSV/Excel)
        elif request.content_type.startswith("multipart/form-data"):
            uploaded_file = request.FILES.get('file')
            if not uploaded_file:
                return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

            # Read file based on type
            try:
                if uploaded_file.name.endswith('.csv'):
                    df = pd.read_csv(uploaded_file)
                elif uploaded_file.name.endswith(('.xlsx', '.xls')):
                    df = pd.read_excel(uploaded_file)
                else:
                    return Response({"error": "Unsupported file format"}, status=status.HTTP_400_BAD_REQUEST)
                raw_data = df.to_dict(orient="records")
            except Exception as pandas_e:
                logger.error(f"Pandas error: {pandas_e}")
                return Response({"error": f"Error reading file. {pandas_e}"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate input data
        if not raw_data:
            return Response({"error": "No valid data provided."}, status=status.HTTP_400_BAD_REQUEST)

        # AI-driven inventory analytics & forecasting prompt
        prompt = f"""
You are an advanced AI-powered inventory analytics and forecasting system.
Analyze the provided inventory dataset and generate the following JSON output:

### **1. Inventory Analytics**
- Identify key trends in stock levels, **fast-moving vs. slow-moving products**, and overall inventory health.
- Calculate **total inventory value** based on current stock levels and product prices.
- Highlight potential stock issues:
  - **Overstocking**: Products with excessive inventory that may need promotion or clearance.
  - **Low Stock Alerts**: Products nearing stockout that may require immediate restocking.
- Identify **top-performing product categories** based on sales volume (if available).
- Provide actionable insights to **optimize stock management and reduce waste**.

### **2. 30-Day Sales Forecasting**
Predict future demand for each product over the next 30 days based on historical patterns, trends, and current inventory levels:
- For each product, return:
  - **product_name**: Name of the product
  - **predicted_sales**: Expected number of units sold in the next 30 days
  - **confidence_score**: A value between 0 and 1 indicating the certainty of the forecast

### **Inventory Analysis Instructions**
- Calculate the overall inventory health based on stock levels.
- If the average stock level is high, set 'status' to 'high' and provide insights about overstocking.
- If the average stock level is medium, set 'status' to 'medium' and provide general insights.
- If the average stock level is low, set 'status' to 'low' and provide insights about potential stockouts.

### **Fast Moving Products Instructions**
- Identify the top 5 products with the highest projected sales.
- Include the 'product_name', 'stock', and 'projected_sales' for each fast-moving product.

### **Slow Moving Products Instructions**
- Identify the top 5 products with the lowest projected sales.
- Include the 'product_name', 'stock', and 'projected_sales' for each slow-moving product.

### **Input Data Format**
The input consists of raw inventory records from a database or a spreadsheet. Some fields may be missing or misformatted, so infer the best possible insights.

### **Expected JSON Output**
Return a structured JSON object with the following keys:
- `"forecast"`: A list of product-wise demand predictions.
- `"inventory_analysis"`: An object containing inventory health status and insights.
- `"fast_moving_products"`: A list of fast-moving products.
- `"slow_moving_products"`: A list of slow-moving products.

### **Expected JSON Output Example**
{{
  "forecast": [
    {{
      "product_name": "Laptop",
      "predicted_sales": 120,
      "confidence_score": 0.8
    }},
    ...
  ],
  "inventory_analysis": {{
    "status": "medium",
    "insights": ["Some products are at risk of stockout.", "Increase stock for popular items."]
  }},
  "fast_moving_products": [
    {{
      "product": "Laptop",
      "stock": 51,
      "projected_sales": 120
    }},
    ...
  ],
  "slow_moving_products": [
    {{
      "product": "Magazine",
      "stock": 2,
      "projected_sales": 10
    }},
    ...
  ]
}}

### **Raw Data Input**
{json.dumps(raw_data, indent=2)}

Ensure that the response follows the specified format with **only valid JSON output**.
        """

        logger.info("Generated AI prompt for analytics & forecasting: %s", prompt)

        # Call AI model (Gemini API)
        try:
            ai_response = generate_text(prompt, model_name="gemini-1.5-flash")
            logger.info("Raw AI response: %s", ai_response)
        except Exception as llm_e:
            logger.error(f"LLM error: {llm_e}")
            return Response({"error": f"Error with LLM API. {llm_e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Clean & parse AI response
        cleaned_response = clean_ai_response(ai_response)
        print("Cleaned AI Response:", cleaned_response)

        try:
            structured_output = json.loads(cleaned_response)
            print("Structured output:", structured_output)

            # Ensure the structure of the output matches the expected format.
            if not all(key in structured_output for key in ["forecast", "inventory_analysis", "fast_moving_products", "slow_moving_products"]):
                return Response({"error": "AI response did not contain required keys"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response(structured_output, status=status.HTTP_200_OK)

        except json.JSONDecodeError:
            logger.error(f"Json decode error: {cleaned_response}")
            return Response({"error": "AI response was not valid JSON"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        logger.exception("Error processing inventory forecast")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)