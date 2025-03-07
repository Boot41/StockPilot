from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from decimal import Decimal
from inventory.models import Product

class ProductAPITests(TestCase):
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.product_data = {
            'name': 'Test Product',
            'category': 'Test Category',
            'description': 'Test Description',
            'quantity_in_stock': 100,
            'price': '99.99',
            'threshold_level': 10,
            'extra_charge_percent': '5.00'
        }
        self.product = Product.objects.create(**self.product_data)
        self.product_list_url = reverse('product-list')
        self.product_detail_url = reverse('single-product', kwargs={'pk': self.product.pk})

    def test_create_product(self):
        """Test creating a new product."""
        new_product_data = {
            'name': 'New Test Product',
            'category': 'Test Category',
            'description': 'New Test Description',
            'quantity_in_stock': 50,
            'price': '149.99',
            'threshold_level': 5,
            'extra_charge_percent': '5.00'
        }
        response = self.client.post(self.product_list_url, new_product_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 2)
        self.assertEqual(Product.objects.get(name='New Test Product').price, Decimal('149.99'))

    def test_create_product_invalid_data(self):
        """Test creating a product with invalid data."""
        invalid_product_data = {
            'name': '',  # Name is required
            'price': 'invalid_price',  # Invalid price format
            'quantity_in_stock': -1  # Cannot be negative
        }
        response = self.client.post(self.product_list_url, invalid_product_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
        self.assertIn('price', response.data)
        self.assertIn('quantity_in_stock', response.data)

    def test_get_product_list(self):
        """Test retrieving a list of products."""
        response = self.client.get(self.product_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], self.product_data['name'])

    def test_get_product_detail(self):
        """Test retrieving a specific product."""
        response = self.client.get(self.product_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.product_data['name'])
        self.assertEqual(Decimal(response.data['price']), Decimal(self.product_data['price']))

    def test_update_product(self):
        """Test updating a product."""
        update_data = {
            'name': 'Updated Product Name',
            'price': '199.99',
            'quantity_in_stock': 75
        }
        response = self.client.patch(self.product_detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'Updated Product Name')
        self.assertEqual(self.product.price, Decimal('199.99'))
        self.assertEqual(self.product.quantity_in_stock, 75)

    def test_delete_product(self):
        """Test deleting a product."""
        response = self.client.delete(self.product_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Product.objects.count(), 0)
