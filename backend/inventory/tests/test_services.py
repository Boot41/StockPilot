from django.test import TestCase
from unittest.mock import patch, MagicMock
from inventory.services import get_gemini_response

class GeminiServiceTests(TestCase):
    @patch('inventory.services.model')
    def test_get_gemini_response_success(self, mock_model):
        # Mock successful response
        mock_response = MagicMock()
        mock_response.text = "Test response"
        mock_model.generate_content.return_value = mock_response
        
        response = get_gemini_response("Test prompt")
        self.assertEqual(response, "Test response")
        mock_model.generate_content.assert_called_once_with("Test prompt")

    @patch('inventory.services.model')
    def test_get_gemini_response_error(self, mock_model):
        # Mock API error
        mock_model.generate_content.side_effect = Exception("API Error")
        
        response = get_gemini_response("Test prompt")
        self.assertIsNone(response)
        mock_model.generate_content.assert_called_once_with("Test prompt")

    @patch('inventory.services.model', None)
    def test_get_gemini_response_no_model(self):
        # Test when model is not initialized
        response = get_gemini_response("Test prompt")
        self.assertIsNone(response)
