from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from decimal import Decimal
from datetime import timedelta
from django.utils.timezone import now

from inventory.models import Product, Order, OrderItem

class ForecastAPITests(TestCase):
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test product
        self.product = Product.objects.create(
            name='Test Product',
            description='Test Description',
            quantity_in_stock=100,
            price=Decimal('99.99'),
            threshold_level=5
        )
        
        # Create orders with items for the last 30 days
        current_date = now()
        for i in range(3):  # Create 3 orders
            order = Order.objects.create(
                customer_name=f'Customer {i}',
                telephone_number=f'+1202555{i:04d}',
                order_date=current_date - timedelta(days=i*5)  # Orders every 5 days
            )
            # Each order has 2 items
            OrderItem.objects.create(
                order=order,
                product=self.product,
                quantity=5
            )
        
        self.forecast_sales_url = reverse('forecast-demand')
        self.forecast_demand_url = reverse('gemini-insights')

    def test_forecast_sales_no_data(self):
        """Test sales forecast when there is no sales data."""
        # Delete all orders
        Order.objects.all().delete()
        
        response = self.client.get(self.forecast_sales_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['message'], 'No sales data found.')

    def test_forecast_demand(self):
        """Test AI-powered demand forecast."""
        response = self.client.get(self.forecast_demand_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('forecast', response.data)
        
        # Check forecast data structure
        self.assertIn('forecast', response.data)
        forecast_list = response.data['forecast']
        self.assertIsInstance(forecast_list, list)
        self.assertEqual(len(forecast_list), 1)  # One product

        forecast = forecast_list[0]
        self.assertIn('product_name', forecast)
        self.assertEqual(forecast['product_name'], 'Test Product')
        self.assertIn('predicted_sales', forecast)
        self.assertIsInstance(forecast['predicted_sales'], (int, float))
        self.assertIn('confidence_score', forecast)
        self.assertIsInstance(forecast['confidence_score'], (int, float))

    def test_forecast_sales_no_data(self):
        """Test sales forecast when there is no sales data."""
        # Delete all orders
        Order.objects.all().delete()
        
        response = self.client.get(self.forecast_sales_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['message'], 'No sales data found.')
