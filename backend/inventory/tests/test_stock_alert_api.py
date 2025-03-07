from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from decimal import Decimal

from inventory.models import Product, StockAlert

class StockAlertAPITests(TestCase):
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test product with low stock (without triggering stock alert)
        self.product = Product(
            name='Test Product',
            description='Test Description',
            quantity_in_stock=3,  # Below threshold of 5
            price=Decimal('99.99'),
            threshold_level=5
        )
        super(Product, self.product).save()
        
        # Create test stock alert
        self.stock_alert = StockAlert.objects.create(
            product=self.product,
            stock_level=3,
            resolved=False
        )
        
        self.alert_list_url = reverse('stock-alert-list')
        self.alert_detail_url = reverse('single-stock-alert', kwargs={'pk': self.stock_alert.pk})

    def test_get_stock_alerts(self):
        """Test retrieving a list of stock alerts."""
        response = self.client.get(self.alert_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['product_name'], 'Test Product')
        self.assertEqual(response.data[0]['stock_level'], 3)

    def test_update_stock_alert(self):
        """Test updating a stock alert's resolved status."""
        data = {'resolved': True}
        response = self.client.patch(self.alert_detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['resolved'])

    def test_auto_resolve_stock_alert(self):
        """Test stock alert is automatically resolved when stock rises above threshold."""
        # Update product stock to rise above threshold
        self.product.quantity_in_stock = 6
        self.product.save()

        # Check if the alert was resolved
        response = self.client.get(self.alert_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  # Alert should be resolved
