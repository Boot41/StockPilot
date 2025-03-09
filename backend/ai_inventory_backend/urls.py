"""
URL configuration for ai_inventory_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

from inventory.views import (
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
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # API endpoints
    path('api/', include('inventory.urls')),
    # Legacy API endpoints (to be removed)
    path('api-old/', include([
        path('inventory/', include([
            path('', InventoryList.as_view(), name='inventory-list'),
            path('<int:pk>/', SingleInventoryList.as_view(), name='single-inventory'),
        ])),
        path('product/', include([
            path('', ProductList.as_view(), name='product-list'),
            path('<int:pk>/', SingleProductList.as_view(), name='single-product'),
        ])),
        path('order/', include([
            path('', OrderList.as_view(), name='order-list'),
            path('<int:pk>/', SingleOrderList.as_view(), name='single-order'),
            path('<int:order_id>/items/', OrderItemList.as_view(), name='order-item-list'),
            path('item/<int:pk>/', SingleOrderItemList.as_view(), name='single-order-item'),
        ])),
        path('stock-alert/', include([
            path('', StockAlertList.as_view(), name='stock-alert-list'),
            path('<int:pk>/', SingleStockAlert.as_view(), name='single-stock-alert'),
        ])),
        path('analytics/', ai_analytics, name='analytics'),
        path('forecast/', forecast_sales, name='forecast'),
        path('gemini-insights/', ai_forecast_demand, name='gemini-insights'),
        path('chatbot/', ChatbotAPIView.as_view(), name='chatbot'),
        path('inventory-forecast/', inventory_forecast, name='inventory-forecast'),
    ])),
    # Auth endpoints
    path('auth/', include('authentication.urls')),
    # Static and frontend routes
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT + '/assets/'}),
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='index'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
