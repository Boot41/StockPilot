from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
import json
import pandas as pd
import io

class InventoryForecastAPITests(TestCase):
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Sample JSON data for testing
        self.valid_json_data = {
            "data": [
                {
                    "product_name": "Laptop",
                    "category": "Electronics",
                    "price": 999.99,
                    "stock": 50,
                    "sales_last_month": 30
                },
                {
                    "product_name": "Office Chair",
                    "category": "Furniture",
                    "price": 199.99,
                    "stock": 20,
                    "sales_last_month": 5
                }
            ]
        }
        
        # Create sample CSV data
        self.csv_data = """product_name,category,price,stock,sales_last_month
Laptop,Electronics,999.99,50,30
Office Chair,Furniture,199.99,20,5"""
        
        # Create sample Excel data
        df = pd.DataFrame({
            'product_name': ['Laptop', 'Office Chair'],
            'category': ['Electronics', 'Furniture'],
            'price': [999.99, 199.99],
            'stock': [50, 20],
            'sales_last_month': [30, 5]
        })
        excel_buffer = io.BytesIO()
        df.to_excel(excel_buffer, index=False)
        excel_buffer.seek(0)
        self.excel_data = excel_buffer.getvalue()

    def test_inventory_forecast_json(self):
        """Test: Verify inventory forecast with JSON data."""
        url = reverse('inventory_forecast')
        response = self.client.post(
            url,
            data=json.dumps(self.valid_json_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify response structure
        data = response.json()
        self.assertIn('forecast', data)
        self.assertIn('inventory_analysis', data)
        self.assertIn('fast_moving_products', data)
        self.assertIn('slow_moving_products', data)
        
        # Verify forecast data
        self.assertTrue(len(data['forecast']) > 0)
        forecast_item = data['forecast'][0]
        self.assertIn('product_name', forecast_item)
        self.assertIn('predicted_sales', forecast_item)
        self.assertIn('confidence_score', forecast_item)
        
        # Verify inventory analysis
        self.assertIn('status', data['inventory_analysis'])
        self.assertIn('insights', data['inventory_analysis'])
        
        # Verify fast/slow moving products
        self.assertTrue(len(data['fast_moving_products']) > 0)
        self.assertTrue(len(data['slow_moving_products']) > 0)

    def test_inventory_forecast_csv(self):
        """Test: Verify inventory forecast with CSV file upload."""
        url = reverse('inventory_forecast')
        csv_file = SimpleUploadedFile(
            "inventory.csv",
            self.csv_data.encode('utf-8'),
            content_type='text/csv'
        )
        
        response = self.client.post(
            url,
            {'file': csv_file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('forecast', response.json())

    def test_inventory_forecast_excel(self):
        """Test: Verify inventory forecast with Excel file upload."""
        url = reverse('inventory_forecast')
        excel_file = SimpleUploadedFile(
            "inventory.xlsx",
            self.excel_data,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
        response = self.client.post(
            url,
            {'file': excel_file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('forecast', response.json())

    def test_inventory_forecast_no_data(self):
        """Test: Verify error handling when no data is provided."""
        url = reverse('inventory_forecast')
        response = self.client.post(url, {}, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())

    def test_inventory_forecast_invalid_file(self):
        """Test: Verify error handling for invalid file format."""
        url = reverse('inventory_forecast')
        invalid_file = SimpleUploadedFile(
            "inventory.txt",
            b"invalid data",
            content_type='text/plain'
        )
        
        response = self.client.post(
            url,
            {'file': invalid_file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())

    def test_inventory_forecast_malformed_json(self):
        """Test: Verify error handling for malformed JSON data."""
        url = reverse('inventory_forecast')
        invalid_data = {
            "data": [
                {
                    "product_name": "Laptop",
                    # Missing required fields
                }
            ]
        }
        
        response = self.client.post(
            url,
            data=json.dumps(invalid_data),
            content_type='application/json'
        )
        
        # The API should return a 400 Bad Request for malformed JSON
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn('error', data)
        self.assertIsInstance(data['error'], str)
