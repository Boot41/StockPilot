from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from decimal import Decimal
from inventory.models import Product, InventoryTransaction
from phonenumber_field.phonenumber import PhoneNumber

class InventoryTransactionAPITests(TestCase):
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create a test product
        self.product = Product.objects.create(
            name='Test Product',
            category='Test Category',
            description='Test Description',
            quantity_in_stock=100,
            price='99.99',
            threshold_level=10,
            extra_charge_percent=Decimal('5.00')
        )
        
        # Create a test inventory transaction
        self.transaction = InventoryTransaction.objects.create(
            product=self.product,
            quantity=10,
            transaction_type='restock',
            extra_charge_percent=Decimal('5.00')
        )
        
        self.inventory_list_url = reverse('inventory-list')
        self.inventory_detail_url = reverse('single-inventory', kwargs={'pk': self.transaction.pk})

    def test_create_restock_transaction(self):
        """Test creating a new restock transaction."""
        data = {
            'product_id': self.product.id,
            'quantity': 50,
            'transaction_type': 'restock',
            'extra_charge_percent': Decimal('5.00')
        }
        response = self.client.post(self.inventory_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity_in_stock, 160)  # Original 100 + first restock 10 + new restock 50

    def test_create_sale_transaction(self):
        """Test creating a new sale transaction."""
        data = {
            'product_id': self.product.id,
            'quantity': 20,
            'transaction_type': 'sale',
            'extra_charge_percent': Decimal('5.00')
        }
        response = self.client.post(self.inventory_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity_in_stock, 90)  # Original 100 + first restock 10 - sale 20

    def test_create_invalid_sale_transaction(self):
        """Test creating a sale transaction with insufficient stock."""
        data = {
            'product_id': self.product.id,
            'quantity': 200,  # More than available stock
            'transaction_type': 'sale',
            'extra_charge_percent': Decimal('5.00')
        }
        response = self.client.post(self.inventory_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity_in_stock, 110)  # Stock should remain unchanged

    def test_get_inventory_list(self):
        """Test retrieving a list of inventory transactions."""
        response = self.client.get(self.inventory_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['quantity'], self.transaction.quantity)

    def test_get_inventory_detail(self):
        """Test retrieving a specific inventory transaction."""
        response = self.client.get(self.inventory_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity'], self.transaction.quantity)
        self.assertEqual(response.data['transaction_type'], self.transaction.transaction_type)

    def test_delete_inventory_transaction(self):
        """Test deleting an inventory transaction."""
        # Note: This might need to be adjusted based on your business logic
        # Some systems might not allow deletion of inventory transactions for audit purposes
        response = self.client.delete(self.inventory_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(InventoryTransaction.objects.count(), 0)
