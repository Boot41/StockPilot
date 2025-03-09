from django.test import TestCase
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils.timezone import make_aware
from unittest.mock import patch, MagicMock
from inventory.utils import process_inventory_query, fetch_ai_insights
from inventory.models import Product, Order, OrderItem

class UtilsTests(TestCase):
    def setUp(self):
        # Create test products
        self.product1 = Product.objects.create(
            name='Test Product 1',
            description='Test Description 1',
            quantity_in_stock=100,
            price=Decimal('99.99'),
            threshold_level=10
        )
        self.product2 = Product.objects.create(
            name='Test Product 2',
            description='Test Description 2',
            quantity_in_stock=50,
            price=Decimal('49.99'),
            threshold_level=5
        )

        # Create test orders
        current_date = make_aware(datetime.now())
        previous_month = current_date - timedelta(days=35)

        # Current month order
        self.current_order = Order.objects.create(
            customer_name='Current Customer',
            telephone_number='+1234567890',
            order_date=current_date
        )
        OrderItem.objects.create(
            order=self.current_order,
            product=self.product1,
            quantity=2,
            price=Decimal('199.98')
        )

        # Previous month order
        self.previous_order = Order.objects.create(
            customer_name='Previous Customer',
            telephone_number='+0987654321',
            order_date=previous_month
        )
        OrderItem.objects.create(
            order=self.previous_order,
            product=self.product2,
            quantity=3,
            price=Decimal('149.97')
        )

    def test_process_inventory_query_total_products(self):
        response = process_inventory_query('total product count')
        self.assertIn('Total product count: 2', response['response']['answer'])

    def test_process_inventory_query_total_products(self):
        response = process_inventory_query('total product count')
        self.assertIn('Total product count: 2', response['response']['answer'])
