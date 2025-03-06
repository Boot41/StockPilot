from django.test import TestCase
from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from decimal import Decimal
from .models import Product, InventoryTransaction, Order, OrderItem

class ProductAPITests(APITestCase):
    def setUp(self):
        # Create test user and get JWT token
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )
        
        # Create test product
        self.product = Product.objects.create(
            name='Test Product',
            description='Test Description',
            category='Test Category',
            price=Decimal('10.00'),
            quantity_in_stock=100,
            threshold_level=10
        )
        
        # Test product data for creation
        self.product_data = {
            'name': 'New Product',
            'description': 'New Description',
            'category': 'New Category',
            'price': '15.99',
            'quantity_in_stock': 50,
            'threshold_level': 5
        }
    
    def test_list_products(self):
        """Test GET /product/ endpoint"""
        response = self.client.get(reverse('product-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)
        self.assertEqual(response.data[0]['name'], 'Test Product')
    
    def test_create_product(self):
        """Test POST /product/ endpoint"""
        response = self.client.post(
            reverse('product-list'),
            self.product_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 2)
        self.assertEqual(
            Product.objects.get(name='New Product').price,
            Decimal('15.99')
        )
    
    def test_get_product_detail(self):
        """Test GET /product/{id}/ endpoint"""
        response = self.client.get(
            reverse('single-product', args=[self.product.id])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Product')
    
    def test_update_product(self):
        """Test PUT /product/{id}/ endpoint"""
        update_data = {
            'name': 'Updated Product',
            'description': 'Updated Description',
            'category': 'Updated Category',
            'price': '20.00',
            'quantity_in_stock': 75,
            'threshold_level': 15
        }
        response = self.client.put(
            reverse('single-product', args=[self.product.id]),
            update_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'Updated Product')
        self.assertEqual(self.product.price, Decimal('20.00'))
    
    def test_delete_product(self):
        """Test DELETE /product/{id}/ endpoint"""
        response = self.client.delete(
            reverse('single-product', args=[self.product.id])
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Product.objects.count(), 0)
    
    def test_create_product_invalid_data(self):
        """Test product creation with invalid data"""
        invalid_data = {
            'name': '',  # Name is required
            'price': 'invalid',  # Price must be decimal
            'quantity_in_stock': -1  # Cannot be negative
        }
        response = self.client.post(
            reverse('product-list'),
            invalid_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
        self.assertIn('price', response.data)


class InventoryTransactionAPITests(APITestCase):
    def setUp(self):
        # Create user and get token
        self.user = User.objects.create_user(username='testuser', password='testpass')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Create test product
        self.product = Product.objects.create(
            name='Test Product',
            description='Test Description',
            quantity_in_stock=10,
            price=Decimal('10.00'),
            threshold_level=5
        )
        
        # Create test transaction
        self.transaction = InventoryTransaction.objects.create(
            product=self.product,
            transaction_type='sale',
            quantity=4,
            extra_charge_percent=Decimal('5.00')
        )

    def test_list_transactions(self):
        response = self.client.get(reverse('inventory-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)

    def test_create_transaction(self):
        data = {
            'product_id': self.product.id,
            'transaction_type': 'sale',
            'quantity': 2,
            'extra_charge_percent': '5.00'
        }
        response = self.client.post(reverse('inventory-list'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_get_transaction_detail(self):
        response = self.client.get(reverse('single-inventory', args=[self.transaction.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity'], 4)

    def test_create_invalid_transaction(self):
        data = {
            'product_id': self.product.id,
            'transaction_type': 'sale',
            'quantity': 20  # More than available stock
        }
        response = self.client.post(reverse('inventory-list'), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class OrderAPITests(APITestCase):
    def setUp(self):
        # Create user and get token
        self.user = User.objects.create_user(username='testuser', password='testpass')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Create test product
        self.product = Product.objects.create(
            name='Test Product',
            description='Test Description',
            quantity_in_stock=10,
            price=Decimal('10.00'),
            threshold_level=5
        )

    def test_list_orders(self):
        response = self.client.get(reverse('order-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_order(self):
        data = {
            'customer_name': 'New Customer',
            'telephone_number': '+12025550109',
            'status': 'pending',
            'items': [{
                'product': self.product.id,
                'quantity': 1
            }]
        }
        response = self.client.post(reverse('order-list'), data, format='json')
        print('Response:', response.status_code)
        print('Response data:', response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_invalid_order(self):
        data = {
            'customer_name': 'Invalid Order',
            'telephone_number': '123',  # Invalid phone number
            'status': 'pending',
            'items': [{
                'product': self.product.id,
                'quantity': 1
            }]
        }
        response = self.client.post(reverse('order-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    def setUp(self):
        # Create test user and get JWT token
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}'
        )
        
        # Create test product
        self.product = Product.objects.create(
            name='Laptop',
            description='Test Laptop',
            category='Electronics',
            price=Decimal('915.18'),
            quantity_in_stock=55,
            threshold_level=10
        )
        
        # Create test transaction
        self.transaction = InventoryTransaction.objects.create(
            product=self.product,
            transaction_type='sale',
            quantity=4,
            extra_charge_percent=Decimal('5.00')
        )
    
    def test_list_transactions(self):
        """Test GET /inventory/ endpoint"""
        response = self.client.get(reverse('inventory-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)
        self.assertEqual(response.data[0]['transaction_type'], 'sale')
        self.assertEqual(response.data[0]['quantity'], 4)
    
    def test_create_transaction(self):
        """Test POST /inventory/ endpoint"""
        data = {
            'product_id': self.product.id,
            'transaction_type': 'sale',
            'quantity': 2,
            'extra_charge_percent': '5.00'
        }
        response = self.client.post(reverse('inventory-list'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['quantity'], 2)
        self.assertEqual(response.data['transaction_type'], 'sale')
    
    def test_get_transaction_detail(self):
        """Test GET /inventory/{id}/ endpoint"""
        response = self.client.get(
            reverse('single-inventory', args=[self.transaction.id])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity'], 4)
        self.assertEqual(response.data['transaction_type'], 'sale')
    
    def test_create_invalid_transaction(self):
        """Test transaction creation with invalid data"""
        invalid_data = {
            'product_id': self.product.id,
            'transaction_type': 'invalid_type',
            'quantity': -10
        }
        response = self.client.post(
            reverse('inventory-list'),
            invalid_data
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)