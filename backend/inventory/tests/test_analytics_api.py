from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from decimal import Decimal
from datetime import timedelta
from django.utils.timezone import now

from inventory.models import Product, Order, OrderItem, StockAlert

class AnalyticsAPITests(TestCase):
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test products in different categories
        self.product1 = Product.objects.create(
            name='Electronics Item',
            description='Test Description',
            quantity_in_stock=100,
            price=Decimal('199.99'),
            threshold_level=10,
            category='Electronics'
        )
        
        self.product2 = Product.objects.create(
            name='Clothing Item',
            description='Test Description',
            quantity_in_stock=20,  # Low stock to trigger alert
            price=Decimal('49.99'),
            threshold_level=10,
            category='Clothing'
        )
        
        # Create orders with items for the last 30 days
        current_date = now()
        for i in range(3):
            order = Order.objects.create(
                customer_name=f'Customer {i}',
                telephone_number=f'+1202555{i:04d}',
                order_date=current_date - timedelta(days=i*5)
            )
            # Add items to order
            OrderItem.objects.create(
                order=order,
                product=self.product1,
                quantity=1,
                price=self.product1.price
            )
            OrderItem.objects.create(
                order=order,
                product=self.product2,
                quantity=2,
                price=self.product2.price
            )

    def test_analytics_basic_metrics(self):
        """Test 1: Verify basic analytics metrics are present and correctly calculated."""
        response = self.client.get(reverse('analytics'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check basic metrics
        kpis = response.data['KPIs']
        self.assertIn('totalRevenue', kpis)
        self.assertEqual(float(kpis['totalRevenue']), 899.91)  # (199.99 * 3) + (49.99 * 6)
        self.assertIn('totalOrders', kpis)
        self.assertEqual(kpis['totalOrders'], 9)  # 3 orders * 3 items

    def test_analytics_category_insights(self):
        """Test: Verify category-wise sales analytics dynamically."""
        response = self.client.get(reverse('analytics'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check category insights exist
        sales_by_category = response.data.get('salesByCategory', [])
        self.assertGreater(len(sales_by_category), 0, "No category sales data found")
        
        # Verify each category has valid sales data
        total_sales = 0
        for category in sales_by_category:
            self.assertIn('category', category, "Category name missing")
            self.assertIn('sales', category, "Sales data missing")
            self.assertIsInstance(category['category'], str, "Category should be a string")
            self.assertIsInstance(category['sales'], (int, float), "Sales should be numeric")
            self.assertGreaterEqual(category['sales'], 0, "Sales cannot be negative")
            total_sales += category['sales']
        
        # Verify total sales matches our test data
        # 3 orders * (1 + 2) items = 9 total items
        self.assertEqual(total_sales, 9, "Total sales across categories doesn't match test data")

    def test_analytics_inventory_health(self):
        """Test 3: Verify inventory health analysis and stock alerts."""
        response = self.client.get(reverse('analytics'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check inventory health in the response
        self.assertIn('inventoryHealth', response.data)
        inventory_health = response.data['inventoryHealth']
        
        # Verify inventory health structure
        self.assertIn('totalProductsInStock', inventory_health)
        self.assertIn('lowStockItems', inventory_health)
        self.assertIn('outOfStockItems', inventory_health)
        
        # Verify data types
        self.assertIsInstance(inventory_health['totalProductsInStock'], int)
        self.assertIsInstance(inventory_health['lowStockItems'], list)
        self.assertIsInstance(inventory_health['outOfStockItems'], list)
        
        # Verify stock alerts
        self.assertIn('stockAlerts', response.data)
        self.assertIsInstance(response.data['stockAlerts'], list)

    def test_analytics_recommendations(self):
        """Test 4: Verify AI-generated recommendations are present and well-formed."""
        response = self.client.get(reverse('analytics'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check monthly sales trend
        self.assertIn('monthlySalesTrend', response.data)
        trend = response.data['monthlySalesTrend']
        
        # Verify trend structure
        self.assertIsInstance(trend, list)
        self.assertTrue(len(trend) > 0)
        month_data = trend[0]
        self.assertIn('month', month_data)
        self.assertIn('totalSales', month_data)
        self.assertEqual(float(month_data['totalSales']), 899.91)  # Current month sales

    def test_analytics_time_period(self):
        """Test 5: Verify analytics for different time periods."""
        # Create an older order (outside 30-day window)
        old_order = Order.objects.create(
            customer_name='Old Customer',
            telephone_number='+12025559999',
            order_date=now() - timedelta(days=45)
        )
        OrderItem.objects.create(
            order=old_order,
            product=self.product1,
            quantity=5,
            price=self.product1.price
        )
        
        response = self.client.get(reverse('analytics'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify that old order is not included in 30-day metrics
        kpis = response.data['KPIs']
        self.assertEqual(float(kpis['totalRevenue']), 1899.86)  # Should include old order
        self.assertEqual(kpis['totalOrders'], 14)  # Should include old order
