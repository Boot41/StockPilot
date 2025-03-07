from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from inventory.models import Product, Order, OrderItem
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta

class GeminiInsightsAPITests(TestCase):
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test products
        self.product1 = Product.objects.create(
            name="Gaming Laptop",
            category="Electronics",
            description="High-performance gaming laptop",
            price=Decimal("1499.99"),
            quantity_in_stock=25,
            threshold_level=5
        )
        
        self.product2 = Product.objects.create(
            name="Office Desk",
            category="Furniture",
            description="Modern office desk",
            price=Decimal("299.99"),
            quantity_in_stock=15,
            threshold_level=3
        )
        
        # Create orders spanning last 60 days
        self.create_test_orders()

    def create_test_orders(self):
        """Create test orders with varying dates and quantities."""
        dates = [
            timezone.now() - timedelta(days=x) 
            for x in [5, 15, 30, 45, 55]  # Orders spread across 60 days
        ]
        
        quantities = [2, 1, 3, 2, 1]  # Varying quantities
        
        for date, qty in zip(dates, quantities):
            order = Order.objects.create(
                order_date=date,
                total_amount=Decimal(str(qty * float(self.product1.price)))
            )
            
            # Create order items
            OrderItem.objects.create(
                order=order,
                product=self.product1,
                quantity=qty,
                price=self.product1.price
            )
            
            # Also create some orders for product2
            if qty > 1:  # Only create some orders for product2
                OrderItem.objects.create(
                    order=order,
                    product=self.product2,
                    quantity=1,
                    price=self.product2.price
                )

    def test_gemini_insights_success(self):
        """Test: Verify successful demand forecast generation."""
        url = reverse('gemini-insights')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response structure
        data = response.json()
        self.assertIn('forecast', data)
        self.assertTrue(isinstance(data['forecast'], list))
        
        # Verify forecast data for each product
        for forecast in data['forecast']:
            self.assertIn('product_name', forecast)
            self.assertIn('predicted_sales', forecast)
            self.assertIn('confidence_score', forecast)
            
            # Verify data types
            self.assertTrue(isinstance(forecast['product_name'], str))
            self.assertTrue(isinstance(forecast['predicted_sales'], (int, float)))
            self.assertTrue(isinstance(forecast['confidence_score'], (int, float)))
            
            # Verify confidence score range
            self.assertGreaterEqual(forecast['confidence_score'], 0)
            self.assertLessEqual(forecast['confidence_score'], 1)
            
            # Verify predicted sales is non-negative
            self.assertGreaterEqual(forecast['predicted_sales'], 0)

    def test_gemini_insights_no_data(self):
        """Test: Verify forecast behavior with no historical data."""
        # Delete all orders
        Order.objects.all().delete()
        
        url = reverse('gemini-insights')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should still return a forecast, but with low confidence scores
        self.assertIn('forecast', data)
        for forecast in data['forecast']:
            self.assertLessEqual(
                forecast['confidence_score'], 
                0.5,  # Confidence should be low due to no historical data
                "Confidence score should be low for products with no sales history"
            )

    def test_gemini_insights_product_specific(self):
        """Test: Verify forecast accuracy for specific products."""
        url = reverse('gemini-insights')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Find forecasts for our test products
        laptop_forecast = next(
            (f for f in data['forecast'] if f['product_name'] == "Gaming Laptop"),
            None
        )
        desk_forecast = next(
            (f for f in data['forecast'] if f['product_name'] == "Office Desk"),
            None
        )
        
        # Verify laptop forecast (more sales history)
        self.assertIsNotNone(laptop_forecast)
        self.assertGreater(
            laptop_forecast['confidence_score'],
            0.5,  # Should have higher confidence due to more sales data
            "Laptop forecast should have high confidence due to sales history"
        )
        
        # Verify desk forecast (fewer sales)
        self.assertIsNotNone(desk_forecast)
        self.assertLessEqual(
            desk_forecast['predicted_sales'],
            laptop_forecast['predicted_sales'],
            "Desk should have lower predicted sales due to less sales history"
        )

    def test_gemini_insights_error_handling(self):
        """Test: Verify error handling when AI service fails."""
        # Create a product with problematic data to potentially trigger errors
        Product.objects.create(
            name="Test Product" * 100,  # Very long name
            category="Test",
            price=Decimal("99.99"),
            quantity_in_stock=10
        )
        
        url = reverse('gemini-insights')
        response = self.client.get(url)
        
        # Even with problematic data, should either:
        # 1. Return 200 with valid forecast
        # 2. Return 500 with error message
        if response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR:
            self.assertIn('error', response.json())
        else:
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn('forecast', response.json())
