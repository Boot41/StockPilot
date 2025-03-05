from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

class AuthenticationTests(TestCase):
    def setUp(self):
        """Set up test user"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",  # Required by Django's default User model
            email="testuser@example.com",
            password="Test@1234"
        )

    def test_login_user(self):
        """Test user login with correct credentials"""
        response = self.client.post("/auth/login/", {
            "username": "testuser",
            "password": "Test@1234"
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)  # Check if JWT token is returned

    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = self.client.post("/auth/login/", {
            "username": "testuser",
            "password": "WrongPassword"
        })
        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_register_user(self):
        """Test user registration"""
        response = self.client.post("/auth/register/", {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "NewPassword@123"
        })
        self.assertEqual(response.status_code, 201)  # Created

    def test_logout_user(self):
        """Test user logout"""
        login_response = self.client.post("/auth/login/", {
            "username": "testuser",
            "password": "Test@1234"
        })
        token = login_response.data.get("access")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        logout_response = self.client.post("/auth/logout/")
        self.assertEqual(logout_response.status_code, 200)  # Successful logout

    def test_forgot_password(self):
        """Test forgot password request"""
        response = self.client.post("/auth/forgot-password/", {
            "email": "testuser@example.com"
        })
        self.assertEqual(response.status_code, 200)  # Assuming a successful email sent response
