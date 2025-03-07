from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from decimal import Decimal
from inventory.models import Product, Order, OrderItem
from phonenumber_field.phonenumber import PhoneNumber

class OrderAPITests(TestCase):
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test products
        self.product1 = Product.objects.create(
            name='Test Product 1',
            category='Test Category',
            description='Test Description 1',
            quantity_in_stock=100,
            price='99.99',
            threshold_level=10,
            extra_charge_percent=Decimal('5.00')
        )
        
        self.product2 = Product.objects.create(
            name='Test Product 2',
            category='Test Category',
            description='Test Description 2',
            quantity_in_stock=50,
            price='49.99',
            threshold_level=5,
            extra_charge_percent=Decimal('5.00')
        )
        
        # Create a test order
        self.order = Order.objects.create(
            customer_name='Test Customer',
            telephone_number='+12025550109'
        )
        
        # Create test order items without affecting stock
        self.order_item = OrderItem(
            order=self.order,
            product=self.product1,
            quantity=2
        )
        # Save without triggering stock update
        self.order_item.price = Decimal('199.98')  # 99.99 * 2
        super(OrderItem, self.order_item).save()
        
        self.order_list_url = reverse('order-list')
        self.order_detail_url = reverse('single-order', kwargs={'pk': self.order.pk})

    def test_create_order(self):
        """Test creating a new order with multiple items."""
        data = {
            'customer_name': 'New Customer',
            'telephone_number': '+12025550110',
            'items': [
                {
                    'product': self.product1.id,
                    'quantity': 3
                },
                {
                    'product': self.product2.id,
                    'quantity': 2
                }
            ]
        }
        response = self.client.post(self.order_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 2)
        self.assertEqual(OrderItem.objects.count(), 3)
        
        # Verify products' stock is updated
        self.product1.refresh_from_db()
        self.product2.refresh_from_db()
        self.assertEqual(self.product1.quantity_in_stock, 97)  # 100 - 3
        self.assertEqual(self.product2.quantity_in_stock, 48)  # 50 - 2

    def test_create_invalid_order(self):
        """Test creating an order with insufficient stock."""
        data = {
            'customer_name': 'New Customer',
            'telephone_number': '+12025550111',
            'items': [
                {
                    'product': self.product1.id,
                    'quantity': 150  # More than available stock
                }
            ]
        }
        response = self.client.post(self.order_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_get_order_list(self):
        """Test retrieving a list of orders."""
        response = self.client.get(self.order_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['customer_name'], self.order.customer_name)

    def test_get_order_detail(self):
        """Test retrieving a specific order."""
        response = self.client.get(self.order_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['customer_name'], self.order.customer_name)
        self.assertEqual(len(response.data['items']), 1)

    def test_update_order_status(self):
        """Test updating an order's status."""
        data = {'status': 'completed'}
        response = self.client.patch(self.order_detail_url, data, format='json')
        print(f"Response data: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'completed')

    def test_delete_order(self):
        """Test deleting an order."""
        response = self.client.delete(self.order_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Order.objects.count(), 0)
