from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from inventory.models import Product, Order, OrderItem
from django.utils import timezone
from decimal import Decimal
import json

class ChatbotAPITests(TestCase):
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test products
        self.product1 = Product.objects.create(
            name="Test Laptop",
            category="Electronics",
            description="High-end laptop",
            price=Decimal("999.99"),
            quantity_in_stock=20,
            threshold_level=5
        )
        
        self.product2 = Product.objects.create(
            name="Test Chair",
            category="Furniture",
            description="Office chair",
            price=Decimal("199.99"),
            quantity_in_stock=3,  # Below threshold
            threshold_level=5
        )
        
        # Create test orders and order items
        order = Order.objects.create(
            order_date=timezone.now(),
            total_amount=Decimal("1199.98")
        )
        
        OrderItem.objects.create(
            order=order,
            product=self.product1,
            quantity=1,
            price=Decimal("999.99")
        )
        
        OrderItem.objects.create(
            order=order,
            product=self.product2,
            quantity=1,
            price=Decimal("199.99")
        )

    def test_chatbot_empty_query(self):
        """Test: Verify chatbot rejects empty queries."""
        url = reverse('chatbot')
        data = {
            "contents": [
                {"parts": [{"text": ""}]}
            ]
        }
        
        response = self.client.post(url, data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()['error'], "Query cannot be empty")

    def test_chatbot_invalid_query_format(self):
        """Test: Verify chatbot handles invalid query format."""
        url = reverse('chatbot')
        data = {"invalid": "format"}
        
        response = self.client.post(url, data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_chatbot_stock_query(self):
        """Test: Verify chatbot provides accurate stock information."""
        url = reverse('chatbot')
        data = {
            "contents": [
                {"parts": [{"text": "Which products are low on stock?"}]}
            ]
        }
        
        response = self.client.post(url, data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response structure
        response_data = response.json()
        self.assertTrue(response_data['success'])
        self.assertIn('answer', response_data['response'])
        self.assertIn('recommendation', response_data['response'])
        
        # Verify content mentions low stock item
        combined_text = (
            response_data['response']['answer'].lower() + 
            response_data['response']['recommendation'].lower()
        )
        self.assertIn('chair', combined_text)  # Should mention our low-stock chair

    def test_chatbot_sales_query(self):
        """Test: Verify chatbot provides accurate sales information."""
        url = reverse('chatbot')
        data = {
            "contents": [
                {"parts": [{"text": "What are our recent sales?"}]}
            ]
        }
        
        response = self.client.post(url, data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response structure
        response_data = response.json()
        self.assertTrue(response_data['success'])
        self.assertIn('answer', response_data['response'])
        self.assertIn('recommendation', response_data['response'])
        
        # Verify content mentions our products
        combined_text = (
            response_data['response']['answer'].lower() + 
            response_data['response']['recommendation'].lower()
        )
        self.assertTrue(
            'laptop' in combined_text or 
            'chair' in combined_text or 
            '1199.98' in combined_text
        )

    def test_chatbot_product_query(self):
        """Test: Verify chatbot provides accurate product information."""
        url = reverse('chatbot')
        data = {
            "contents": [
                {"parts": [{"text": "Tell me about our electronics products"}]}
            ]
        }
        
        response = self.client.post(url, data=json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response structure
        response_data = response.json()
        self.assertTrue(response_data['success'])
        self.assertIn('answer', response_data['response'])
        self.assertIn('recommendation', response_data['response'])
        
        # Verify content mentions electronics category
        combined_text = (
            response_data['response']['answer'].lower() + 
            response_data['response']['recommendation'].lower()
        )
        self.assertIn('laptop', combined_text)  # Should mention our electronics product
