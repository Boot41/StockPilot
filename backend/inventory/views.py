from decimal import Decimal
from datetime import datetime, timedelta
from django.utils.timezone import now
from django.shortcuts import get_object_or_404
from django.db.models import Sum, F
from django.db.models.functions import ExtractMonth
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
import json
import re
import logging
from collections import defaultdict
import numpy as np

from .models import Product, InventoryTransaction, Order, OrderItem, StockAlert
from .serializers import (
    ProductSerializer, InventorySerializer, OrderSerializer,
    OrderItemSerializer, StockAlertSerializer
)
from .gemini_api import generate_text

# Setup logging for debugging
logger = logging.getLogger(__name__)

# Utility Functions
def clean_ai_response(ai_response):
    """Removes Markdown code block formatting from AI response."""
    # If the response is wrapped in markdown code block, remove them
    cleaned = re.sub(r"```json\n(.*?)\n```", r"\1", ai_response, flags=re.DOTALL).strip()
    return cleaned

def get_sales_data():
    """Fetch sales data for the last 12 months."""
    sales_data = defaultdict(int)
    one_year_ago = datetime.now() - timedelta(days=365)
    
    # Aggregate total sales per month
    orders = (
        Order.objects.filter(order_date__gte=one_year_ago)
        .annotate(month=ExtractMonth('order_date'))
        .values('month')
        .annotate(total_sales=Sum('total_amount'))
    )
    for order in orders:
        sales_data[order['month']] = order['total_sales']
    # Convert sales values to float to avoid Decimal serialization issues.
    return [{"month": datetime(2000, month, 1).strftime("%b"), "sales": float(sales_data.get(month, 0))} for month in range(1, 13)]

LOW_STOCK_THRESHOLD = 10
def get_stock_alerts():
    """Fetch stock levels and return low-stock alerts."""
    low_stock_products = Product.objects.filter(quantity_in_stock__lt=LOW_STOCK_THRESHOLD)
    return [
        {"product": item.name, "stockLevel": item.quantity_in_stock, "message": f"Low stock ({item.quantity_in_stock})"}
        for item in low_stock_products
    ]

# Product Views
class ProductList(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class SingleProductList(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

# Inventory Views
class InventoryList(generics.ListCreateAPIView):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventorySerializer

class SingleInventoryList(generics.RetrieveUpdateDestroyAPIView):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventorySerializer

# Order Views
class OrderList(generics.ListCreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class SingleOrderList(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

# Order Item Views
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
            logger.error(f"Error creating order item: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SingleOrderItemList(generics.RetrieveUpdateDestroyAPIView):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer

# Stock Alert Views
class StockAlertList(generics.ListAPIView):
    queryset = StockAlert.objects.filter(resolved=False)
    serializer_class = StockAlertSerializer

class SingleStockAlert(generics.RetrieveUpdateDestroyAPIView):
    queryset = StockAlert.objects.all()
    serializer_class = StockAlertSerializer

# AI-Powered Demand Forecasting API (Simple Average)
@api_view(['GET'])
def forecast_sales(request):
    """Forecast sales data for the last 30 days using simple average."""
    start_date = now() - timedelta(days=30)
    orders = Order.objects.filter(order_date__gte=start_date)
    sales_data = []
    for order in orders:
        for item in order.items.all():
            sales_data.append(item.quantity)
    if sales_data:
        avg_sales = np.mean(sales_data)
        forecast_data = {"forecast": avg_sales}
    else:
        forecast_data = {"message": "No sales data found."}
    return Response(forecast_data, status=status.HTTP_200_OK)

# AI-Powered Demand Forecasting API (Gemini model)
@api_view(['GET'])
def ai_forecast_demand(request):
    """AI-powered demand forecasting using Gemini API."""
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
    try:
        ai_response = generate_text(prompt, model_name="gemini-1.5-flash")
        logger.info("Raw AI response: %s", ai_response)
        cleaned_response = clean_ai_response(ai_response)
        logger.info("Cleaned AI response: %s", cleaned_response)
        forecast_data = json.loads(cleaned_response)
        return Response({"forecast": forecast_data}, status=status.HTTP_200_OK)
    except json.JSONDecodeError as e:
        logger.error("JSON decoding error: %s. Raw response: %s", e, ai_response)
        return Response({"error": "Failed to parse AI response as JSON."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# AI-Powered Analytics API with Embedded Analytics Data
@api_view(['GET'])
def ai_analytics(request):
    """AI-powered analytics using Gemini API with embedded analytics data."""
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
    try:
        ai_response = generate_text(prompt, model_name="gemini-1.5-flash")
        cleaned_response = clean_ai_response(ai_response)
        return Response(json.loads(cleaned_response), status=status.HTTP_200_OK)
    except json.JSONDecodeError:
        return Response({"error": "Failed to parse AI response as JSON."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
