from decimal import Decimal
from datetime import datetime, timedelta
from django.utils.timezone import now
from django.shortcuts import get_object_or_404
from django.db.models import Sum, F, FloatField
from django.db.models.functions import ExtractMonth, Cast
from django.core.cache import cache
from django.utils import timezone
from django.http import JsonResponse
from .utils import generate_text
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
from typing import Dict, List, Tuple, Any
from tabulate import tabulate  # For markdown table formatting

from .models import Product, InventoryTransaction, Order, OrderItem, StockAlert, ChatSession
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
    permission_classes = []  # Allow unauthenticated access
    
    def get(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
@permission_classes([])
@parser_classes([JSONParser])
def ai_forecast_demand(request):
    """AI-powered demand forecasting using Gemini API."""
    try:
        # Generate dummy forecast data for testing
        dummy_forecast = [
            {
                "product_name": "Product A",
                "predicted_sales": 150,
                "confidence_score": 0.85
            },
            {
                "product_name": "Product B",
                "predicted_sales": 200,
                "confidence_score": 0.75
            }
        ]
        
        # Return dummy data for now
        response_data = {"forecast": dummy_forecast}
        return Response(
            response_data,
            status=status.HTTP_200_OK,
            content_type='application/json'
        )

    except Exception as e:
        logger.error("Error in ai_forecast_demand: %s", e)
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content_type='application/json'
        )

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

from .chatbot import ChatbotAPIView

class DecimalEncoder:
    def _decimal_to_float(self, obj):
        """Convert Decimal objects to float for JSON serialization."""
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, list):
            return [self._decimal_to_float(item) for item in obj]
        if isinstance(obj, dict):
            return {k: self._decimal_to_float(v) for k, v in obj.items()}
        return obj

    def _generate_ai_context(self, query, inventory, sales_data, uploaded_data):
        """Dynamic context builder with intelligent data prioritization."""
        try:
            # Convert all numeric data to float
            inventory = self._decimal_to_float(inventory)
            sales_data = self._decimal_to_float(sales_data)

            context = {
                "query": query,
                "system_role": "You are StockPilot, an enterprise inventory AI assistant. "
                               "Provide expert analysis with numerical insights and action-oriented recommendations.",
                "inventory_stats": {
                    "total_items": len(inventory),
                    "critical_stock": sum(1 for item in inventory if item.get('critical', False)),
                    "value_optimization_opportunity": float(sum(
                        item['price'] * (item['threshold_level'] - item['quantity_in_stock'])
                        for item in inventory if item.get('critical', False)
                    ))
                },
                "sales_insights": {
                    "total_revenue": float(sum(item.get('total_revenue', 0) for item in sales_data)),
                    "top_performers": [item for item in sales_data if item.get('total_sold', 0) > self.SALES_THRESHOLDS['best_seller']],
                    "underperformers": [item for item in sales_data if item.get('total_sold', 0) < self.SALES_THRESHOLDS['slow_moving']]
                },
                "uploaded_data": uploaded_data,
                "analysis_parameters": {
                    "timeframe_days": 30,
                    "currency": "USD",
                    "forecast_model": "ARIMA"
                }
            }
            
            return json.dumps(context, indent=2)
        except Exception as e:
            logger.error(f"Error generating AI context: {e}")
            # Return a simplified context in case of error
            return json.dumps({
                "query": query,
                "system_role": "StockPilot AI Assistant",
                "error": "Error processing inventory data"
            }, indent=2)

    def post(self, request, *args, **kwargs):
        """Enterprise-grade inventory intelligence endpoint with formatting."""
        try:
            # Validate and extract input
            data = json.loads(request.body)
            query = self._extract_query(data)

            if not query:
                return Response(
                    {"error": "Invalid query format", "resolution": "Use structured 'contents[0].parts[0].text' format"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Fetch and process data
            inventory = self._get_inventory()
            sales_data = self._get_sales_analytics()
            
            # Check if data is available
            if not inventory or not sales_data:
                return JsonResponse({
                    "response": "Welcome to StockPilot Enterprise AI! To get started, upload your inventory data using the upload button below.",
                    "status": "no_data"
                })

            # Generate context for AI
            context = {
                "query": query,
                "system_role": "You are StockPilot, an enterprise inventory AI assistant. "
                               "Provide expert analysis with numerical insights and action-oriented recommendations.",
                "inventory_stats": {
                    "total_items": len(inventory),
                    "critical_stock": sum(1 for item in inventory if item.get('critical', False)),
                    "value_optimization_opportunity": float(sum(
                        item['price'] * (item['threshold_level'] - item['quantity_in_stock'])
                        for item in inventory if item.get('critical', False)
                    ))
                },
                "sales_insights": {
                    "total_revenue": float(sum(item.get('total_revenue', 0) for item in sales_data)),
                    "top_performers": [item for item in sales_data if item.get('total_sold', 0) > self.SALES_THRESHOLDS['best_seller']],
                    "underperformers": [item for item in sales_data if item.get('total_sold', 0) < self.SALES_THRESHOLDS['slow_moving']]
                },
                "uploaded_data": data.get('uploaded_data')
            }

            # Determine query type
            identity_keywords = ['who are you', 'who made you', 'what are you', 'tell me about yourself']
            is_identity_query = any(keyword in query.lower() for keyword in identity_keywords)

            # Analyze query intent
            query_lower = query.lower()
            
            # Handle different query types
            if is_identity_query:
                prompt = "Provide a brief 1-2 sentence introduction about being StockPilot, an AI assistant specializing in inventory management."
            
            elif "product list" in query_lower or "all products" in query_lower:
                # Format product table
                rows = []
                for item in sales_data:
                    rows.append(f"| {item['product_name']} | {item['category']} | {item.get('total_sold', 0):,} | ${item.get('total_revenue', 0):,.2f} | {item.get('avg_daily_sales', 0):.1f} |")
                
                return JsonResponse({
                    "response": f"### Product Inventory\n\n| Product | Category | Sold | Revenue | Daily Sales |\n|---------|----------|------|---------|-------------|\n{chr(10).join(rows)}"
                })
            
            elif "total products" in query_lower or "how many products" in query_lower:
                total = len(sales_data)
                return JsonResponse({
                    "response": f"Total number of products: **{total}**"
                })
            
            elif "top selling" in query_lower or "best selling" in query_lower:
                # Sort by total_sold and get top product
                top_product = max(sales_data, key=lambda x: x.get('total_sold', 0))
                return JsonResponse({
                    "response": f"Top selling product: **{top_product['product_name']}**\n- Category: {top_product['category']}\n- Total Sold: {top_product.get('total_sold', 0):,}\n- Revenue: ${top_product.get('total_revenue', 0):,.2f}"
                })
            
            else:
                prompt = f"Answer this inventory question concisely: {query}\nContext: {json.dumps(sales_data)}"



            # Get AI response
            try:
                ai_response = generate_text(prompt, model_name="gemini-1.5-flash").strip()
                
                # Clean and format the response
                response = {
                    "version": "2.1",
                    "response": ai_response,
                    "context": context
                }
                
                return Response(response, status=status.HTTP_200_OK)
                
            except Exception as e:
                logger.error(f"Error generating AI response: {e}")
                return Response({
                    "error": "Failed to generate AI response",
                    "message": "Our AI assistant is temporarily unavailable. Please try again later."
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        except json.JSONDecodeError as e:
            logger.error(f"JSON Error: {str(e)}")
            return Response(
                {"error": "Data format mismatch", "resolution": "Validate input structure"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Premium Engine Failure: {str(e)}", exc_info=True)
            return Response(
                {
                    "error": "Intelligence engine timeout",
                    "error_code": "PREMIUM_ENGINE_500",
                    "resolution": "Try reducing query complexity or try again later"
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

# User Excel Input Analytics 

@api_view(['GET', 'POST'])
@permission_classes([])
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
                # Validate basic data structure
            if raw_data:
                for item in raw_data:
                    if not isinstance(item, dict) or 'product_name' not in item:
                        return Response(
                            {"error": "Malformed JSON data. Each item must have at least a product_name field"}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    # Set defaults for missing fields
                    item.setdefault('stock', 0)
                    item.setdefault('sales_last_month', 0)
                    item.setdefault('category', 'Uncategorized')
                    item.setdefault('price', 0)

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


# --------------------------------------------------
# Excel Upload Handler
# --------------------------------------------------

class ExcelUploadHandler(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]
    
    def handle_error(self, error_msg, status_code=status.HTTP_400_BAD_REQUEST):
        """Standardized error response handler"""
        logger.error(f"Excel Upload Error: {error_msg}")
        return Response({
            'status': 'error',
            'message': str(error_msg),
            'data': None
        }, status=status_code)

    def guess_column_mapping(self, df: pd.DataFrame) -> Dict[str, str]:
        """Guess the mapping between Excel columns and database fields using fuzzy matching."""
        db_fields = {
            'name': ['product name', 'item name', 'product', 'item', 'name'],
            'category': ['category', 'type', 'product type', 'item category'],
            'price': ['price', 'unit price', 'cost', 'rate'],
            'quantity_in_stock': ['quantity', 'stock', 'quantity in stock', 'available', 'inventory'],
            'threshold_level': ['threshold', 'reorder point', 'minimum stock', 'min quantity']
        }
        
        column_mapping = {}
        df.columns = [str(col).strip().lower() for col in df.columns]
        
        # Try to map each database field to a column
        for db_field, possible_names in db_fields.items():
            # First try exact matches
            matched_col = next((col for col in df.columns if col in possible_names), None)
            if matched_col:
                column_mapping[db_field] = matched_col
                continue
            
            # If no exact match, try partial matches
            matched_col = next((col for col in df.columns if any(name in col for name in possible_names)), None)
            if matched_col:
                column_mapping[db_field] = matched_col
        
        return column_mapping

    def validate_dataframe(self, df: pd.DataFrame) -> Tuple[bool, List[str], Dict[str, Any]]:
        """Validate the DataFrame and prepare it for import."""
        errors = []
        column_mapping = self.guess_column_mapping(df)
        
        # Fill missing mappings with default values
        default_values = {
            'name': None,  # Required
            'category': 'Uncategorized',
            'price': 0.0,
            'quantity_in_stock': 0,
            'threshold_level': 0
        }
        
        # Check if we can at least identify the product name
        if 'name' not in column_mapping or not column_mapping['name']:
            errors.append("Could not identify a column for product names. Please include a column with 'name', 'product', or 'item' in the header.")
            return False, errors, {}
        
        # Fill in default values for missing columns
        for field, default in default_values.items():
            if field not in column_mapping or not column_mapping[field]:
                if default is not None:
                    logger.info(f"Using default value for {field}: {default}")
                    column_mapping[field] = f'default_{field}'
                    df[f'default_{field}'] = default
        
        # Validate and clean data types
        try:
            # Ensure product names are not empty
            name_col = column_mapping['name']
            df[name_col] = df[name_col].fillna('')
            if df[name_col].str.strip().eq('').any():
                errors.append("Some product names are empty")
            
            # Convert and validate numeric columns
            numeric_fields = ['price', 'quantity_in_stock', 'threshold_level']
            for field in numeric_fields:
                if field in column_mapping:
                    col = column_mapping[field]
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
                    df[col] = df[col].apply(lambda x: max(0, float(x)))  # Ensure non-negative

        except Exception as e:
            errors.append(f"Error processing data: {str(e)}")
            logger.error(f"Error processing data: {str(e)}")
            return False, errors, {}

        return len(errors) == 0, errors, column_mapping

    def map_columns(self, df: pd.DataFrame) -> Dict[str, str]:
        """Map Excel columns to database columns."""
        db_columns = {
            'product name': 'name',
            'category': 'category',
            'price': 'price',
            'quantity in stock': 'quantity_in_stock',
            'threshold level': 'threshold_level'
        }
        
        column_mapping = {}
        for excel_col in df.columns:
            excel_col_lower = excel_col.lower()
            if excel_col_lower in db_columns:
                column_mapping[excel_col] = db_columns[excel_col_lower]
            else:
                # Keep extra columns as is
                column_mapping[excel_col] = excel_col.lower().replace(' ', '_')
        
        return column_mapping

    def process_data(self, df: pd.DataFrame, column_mapping: Dict[str, str]) -> Tuple[List[Dict], int]:
        """Process the DataFrame and prepare it for database update."""
        processed_data = []
        updated_count = 0

        for _, row in df.iterrows():
            product_data = {}
            # Map the columns according to our guessed mapping
            for db_field, excel_col in column_mapping.items():
                value = row[excel_col]
                if pd.isna(value):
                    # Use default values for missing data
                    if db_field in ['price', 'quantity_in_stock', 'threshold_level']:
                        value = 0
                    elif db_field == 'category':
                        value = 'Uncategorized'
                    else:
                        value = ''
                product_data[db_field] = value

            # Ensure we have a valid product name
            if not product_data.get('name') or str(product_data['name']).strip() == '':
                logger.warning(f"Skipping row due to missing product name: {product_data}")
                continue

            # Clean up the data
            product_data['name'] = str(product_data['name']).strip()
            product_data['category'] = str(product_data.get('category', 'Uncategorized')).strip()
            product_data['price'] = float(product_data.get('price', 0))
            product_data['quantity_in_stock'] = int(float(product_data.get('quantity_in_stock', 0)))
            product_data['threshold_level'] = int(float(product_data.get('threshold_level', 0)))

            # Update or create product
            try:
                product, created = Product.objects.update_or_create(
                    name=product_data['name'],
                    defaults=product_data
                )
                updated_count += 1
                processed_data.append({
                    'id': product.id,
                    'name': product.name,
                    'category': product.category,
                    'price': product.price,
                    'quantity_in_stock': product.quantity_in_stock,
                    'threshold_level': product.threshold_level,
                    'status': 'created' if created else 'updated'
                })
            except Exception as e:
                logger.error(f"Error processing product {product_data['name']}: {str(e)}")

        return processed_data, updated_count

    def post(self, request, *args, **kwargs):
        logger.info(f"Incoming request data: {request.data}")
        logger.info(f"Incoming request files: {request.FILES}")
        try:
            if 'file' not in request.FILES:
                return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

            excel_file = request.FILES['file']
            update_inventory = request.POST.get('update_inventory', 'no').lower() == 'yes'

            # Read Excel file
            df = pd.read_excel(excel_file)
            logger.info(f"Excel columns found: {df.columns.tolist()}")

            # Store Excel data in ChatSession
            chat_session = ChatSession.objects.create(
                title=f'Excel Analysis - {datetime.now().strftime("%Y-%m-%d %H:%M")}',
                excel_data={
                    'products': df.to_dict('records'),
                    'total_products': len(df),
                    'columns': df.columns.tolist(),
                    'upload_time': datetime.now().isoformat()
                },
                is_using_excel=True
            )

            # Validate data and get column mapping
            is_valid, errors, column_mapping = self.validate_dataframe(df)
            
            if not is_valid:
                return Response({
                    'error': 'Data validation failed',
                    'details': errors,
                    'detected_columns': df.columns.tolist(),
                    'suggested_mapping': column_mapping
                }, status=status.HTTP_400_BAD_REQUEST)

            # Process data with the mapped columns
            processed_data, updated_count = self.process_data(df, column_mapping)
            
            # Store processed data in session
            chat_session.excel_data = {
                'products': processed_data,
                'total_products': len(processed_data),
                'columns': df.columns.tolist(),
                'upload_time': datetime.now().isoformat()
            }
            chat_session.save()
            
            # Return response based on whether we're updating inventory
            if update_inventory:
                return Response({
                    'message': 'Inventory updated successfully',
                    'total_processed': updated_count,
                    'details': processed_data,
                    'column_mapping': column_mapping,
                    'stats': {
                        'total_rows': len(df),
                        'processed_rows': updated_count,
                        'skipped_rows': len(df) - updated_count
                    }
                })
            else:
                return Response({
                    'message': ('Excel file uploaded successfully! '
                               'You can now ask questions about the data. '
                               'To update inventory, just ask "update inventory with this data".'),
                    'total_products': len(processed_data),
                    'columns': df.columns.tolist(),
                    'chat_session_id': chat_session.id,
                    'products': processed_data,  # Send all products for frontend processing
                    'stats': {
                        'total_rows': len(df),
                        'processed': len(processed_data)
                    }
                })

        except Exception as e:
            logger.error(f"Error processing Excel upload: {str(e)}")
            return Response({
                'error': 'Failed to process Excel file',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_excel_data(request):
    """
    Analyze Excel data and prepare it for chatbot integration.
    Creates a chat session to store the analyzed data.
    """
    logger = logging.getLogger(__name__)
    logger.info("Starting Excel data analysis")
    
    try:
        if 'file' not in request.FILES:
            logger.warning("No file uploaded in request")
            return Response({
                'error': 'No file uploaded',
                'status': 'error'
            }, status=status.HTTP_400_BAD_REQUEST)

        excel_file = request.FILES['file']
        
        # Validate file extension
        if not excel_file.name.endswith(('.xlsx', '.xls')):
            logger.warning(f"Invalid file type: {excel_file.name}")
            return Response({
                'error': 'Invalid file type. Please upload an Excel file (.xlsx or .xls)',
                'status': 'error'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(excel_file)
        except Exception as e:
            logger.error(f"Error reading Excel file: {str(e)}")
            return Response({
                'error': 'Could not read Excel file. Please check the file format.',
                'details': str(e),
                'status': 'error'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Clean and standardize column names
        df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
        
        # Validate required columns
        required_columns = ['name', 'category', 'price', 'quantity_in_stock']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            logger.warning(f"Missing required columns: {missing_columns}")
            return Response({
                'error': f"Missing required columns: {', '.join(missing_columns)}",
                'status': 'error'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Convert DataFrame to list of dictionaries
        products = df.to_dict('records')

        # Calculate statistics
        stats = {
            'total_products': len(products),
            'categories': df['category'].nunique(),
            'total_value': float(df['price'].mul(df['quantity_in_stock']).sum()),
            'avg_price': float(df['price'].mean()),
            'low_stock_count': int(df[df['quantity_in_stock'] <= df['threshold_level']].shape[0]) if 'threshold_level' in df.columns else 0,
            'out_of_stock_count': int(df[df['quantity_in_stock'] == 0].shape[0]),
            'categories_breakdown': df.groupby('category').size().to_dict()
        }

        # Create chat session with Excel data
        try:
            chat_session = ChatSession.objects.create(
                user=request.user,
                is_using_excel=True,
                excel_data={
                    'products': products,
                    'stats': stats,
                    'upload_time': datetime.now().isoformat()
                }
            )
            logger.info(f"Created chat session {chat_session.id} with Excel data")
        except Exception as e:
            logger.error(f"Error creating chat session: {str(e)}")
            return Response({
                'error': 'Failed to store Excel data',
                'details': str(e),
                'status': 'error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Format preview data as markdown table
        preview_df = df.head(5)
        table_data = tabulate(
            preview_df,
            headers='keys',
            tablefmt='pipe',
            showindex=False,
            floatfmt=".2f"
        )

        response_data = {
            'message': 'Excel file analyzed successfully',
            'status': 'success',
            'data': table_data,
            'format': 'markdown',
            'chat_session_id': str(chat_session.id),
            'stats': stats,
            'preview': {
                'total_rows': len(df),
                'shown_rows': len(preview_df),
                'columns': list(df.columns)
            }
        }

        logger.info("Excel analysis completed successfully")
        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Unexpected error during Excel analysis: {str(e)}")
        return Response({
            'error': 'An unexpected error occurred while processing the Excel file',
            'details': str(e),
            'status': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)