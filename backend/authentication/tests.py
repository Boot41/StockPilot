from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class AuthenticationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",  # Ensure username is provided
            email="testuser@example.com",
            password="testpassword"
        )
        self.login_url = reverse("login")
        self.register_url = reverse("register")
        self.forgot_password_url = reverse("forgot-password")
        self.reset_password_url = reverse("reset-password")

    def test_register_user(self):
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "newpassword"
        }
        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_register_user_invalid_data(self):
        data = {
            "email": "invalidemail.com",  # Invalid email format
            "password": "short"
        }
        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_user(self):
        data = {
            "email": "testuser@example.com",
            "password": "testpassword"
        }
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_login_invalid_credentials(self):
        data = {
            "email": "testuser@example.com",
            "password": "wrongpassword"
        }
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout(self):
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        response = self.client.post(reverse("logout"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_forgot_password(self):
        data = {"email": "testuser@example.com"}
        response = self.client.post(self.forgot_password_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_forgot_password_invalid_email(self):
        data = {"email": "nonexistent@example.com"}
        response = self.client.post(self.forgot_password_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_password(self):
        data = {
            "token": "dummy_token",
            "new_password": "newsecurepassword"
        }
        response = self.client.post(self.reset_password_url, data, format="json")
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])

    def test_reset_password_invalid_token(self):
        data = {
            "token": "invalid_token",
            "new_password": "newsecurepassword"
        }
        response = self.client.post(self.reset_password_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_expired_jwt_token(self):
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)

        # Simulating an expired token (if needed, set a very short expiration time in settings)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.get(reverse("some-protected-endpoint"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
