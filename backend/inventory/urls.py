from django.urls import path
from .views import (
    ProductList, SingleProductList, 
    InventoryList, SingleInventoryList, 
    OrderList, SingleOrderList, 
    OrderItemList, SingleOrderItemList, 
    StockAlertList, SingleStockAlert,
    forecast_sales,  # ✅ Corrected function name
    ai_analytics,  # ✅ Correct function name for analytics
    ai_forecast_demand,  # ✅ Correct function for Gemini AI demand forecasting
)

urlpatterns = [
    path('product/', ProductList.as_view(), name='product-list'),
    path('product/<int:pk>/', SingleProductList.as_view(), name='single-product'),

    path('inventory/', InventoryList.as_view(), name='inventory-list'),
    path('inventory/<int:pk>/', SingleInventoryList.as_view(), name='single-inventory'),

    path('order/', OrderList.as_view(), name='order-list'),
    path('order/<int:pk>/', SingleOrderList.as_view(), name='single-order'),

    path('order/<int:order_id>/items/', OrderItemList.as_view(), name='order-item-list'),
    path('order-item/<int:pk>/', SingleOrderItemList.as_view(), name='single-order-item'),

    # Stock Alerts
    path('stock-alert/', StockAlertList.as_view(), name='stock-alert-list'),
    path('stock-alert/<int:pk>/', SingleStockAlert.as_view(), name='single-stock-alert'),
    
    # ✅ Forecast Demand (AI-powered forecasting)
    path('forecast/', forecast_sales, name='forecast-demand'),

    # ✅ Analytics (Basic Sales & Inventory Analytics)
    path('analytics/', ai_analytics, name='analytics'),

    # ✅ Gemini AI Insights (AI-driven analytics)
    path('gemini-insights/', ai_forecast_demand, name='gemini-insights'),
]
