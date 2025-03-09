from django.urls import path
from .views import (
    ProductList, SingleProductList,
    InventoryList, SingleInventoryList,
    OrderList, SingleOrderList,
    OrderItemList, SingleOrderItemList,
    StockAlertList, SingleStockAlert,
    forecast_sales,
    ai_analytics,
    ai_forecast_demand,
    ChatbotAPIView,
    inventory_forecast,
    ExcelUploadHandler,
    analyze_excel_data,
)

urlpatterns = [
    #product urls
    path('product/', ProductList.as_view(), name='product-list'),
    path('product/<int:pk>/', SingleProductList.as_view(), name='single-product'),
    path('inventory/', InventoryList.as_view(), name='inventory-list'),
    
    
    #inventory urls
    path('inventory/<int:pk>/', SingleInventoryList.as_view(), name='single-inventory'),
    path('inventory-forecast/', inventory_forecast, name='inventory_forecast'),
    
    
    #order urls
    path('order/', OrderList.as_view(), name='order-list'),
    path('order/<int:pk>/', SingleOrderList.as_view(), name='single-order'),
    path('order/<int:order_id>/items/', OrderItemList.as_view(), name='order-item-list'),
    path('order/item/<int:pk>/', SingleOrderItemList.as_view(), name='single-order-item'),
    path('stock-alert/', StockAlertList.as_view(), name='stock-alert-list'),
    
    
    #stock alert urls
    path('stock-alert/<int:pk>/', SingleStockAlert.as_view(), name='single-stock-alert'),
    path('forecast/', forecast_sales, name='forecast-demand'),
    
    
    #ai urls
    path('analytics/', ai_analytics, name='analytics'),
    path('gemini-insights/', ai_forecast_demand, name='gemini-insights'),
    path('chatbot/', ChatbotAPIView.as_view(), name='chatbot'),
    
    
    #excel urls
    path('excel/upload/', ExcelUploadHandler.as_view(), name='excel_upload'),
    path('excel/analyze/', analyze_excel_data, name='excel_analyze'),
]