from django.urls import path
from .views import (
    ProductList, SingleProductList,
    InventoryList, SingleInventoryList,
    OrderList, SingleOrderList,
    OrderItemList, SingleOrderItemList,
    StockAlertList, SingleStockAlert,
    forecast_sales,  # ✅ AI-powered sales forecasting
    ai_analytics,  # ✅ AI-driven analytics
    ai_forecast_demand,  # ✅ Gemini AI demand forecasting
    ChatbotAPIView,  # ✅ AI-powered chatbot
    inventory_forecast,  # ✅ Inventory analytics and forecasting
)

urlpatterns = [
    # ✅ Product Endpoints
    path('product/', ProductList.as_view(), name='product-list'),
    path('product/<int:pk>/', SingleProductList.as_view(), name='single-product'),

    # ✅ Inventory Endpoints
    path('inventory/', InventoryList.as_view(), name='inventory-list'),
    path('inventory/<int:pk>/', SingleInventoryList.as_view(), name='single-inventory'),

    # ✅ Order Endpoints
    path('order/', OrderList.as_view(), name='order-list'),
    path('order/<int:pk>/', SingleOrderList.as_view(), name='single-order'),
    path('order/<int:order_id>/items/', OrderItemList.as_view(), name='order-item-list'),
    path('order-item/<int:pk>/', SingleOrderItemList.as_view(), name='single-order-item'),

    # ✅ Stock Alerts
    path('stock-alert/', StockAlertList.as_view(), name='stock-alert-list'),
    path('stock-alert/<int:pk>/', SingleStockAlert.as_view(), name='single-stock-alert'),

    # ✅ AI-Powered Features
    path('forecast/', forecast_sales, name='forecast-demand'),  # Sales forecasting
    path('analytics/', ai_analytics, name='analytics'),  # Sales & Inventory analytics
    path('gemini-insights/', ai_forecast_demand, name='gemini-insights'),  # AI-driven insights

    # ✅ AI Chatbot
    path('chatbot/', ChatbotAPIView.as_view(), name='chatbot'),
    
    # ✅ Other Endpoints
    path('inventory-forecast/', inventory_forecast, name='inventory_forecast'),
]
