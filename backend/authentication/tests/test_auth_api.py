from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from django.core import mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator

User = get_user_model()

class AuthenticationAPITests(TestCase):
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.register_url = reverse('auth-register')
        self.login_url = reverse('auth-login')
        self.forgot_password_url = reverse('auth-forgot-password')
        self.logout_url = reverse('auth-logout')
        self.profile_url = reverse('auth-profile')
        
        # Create test user
        self.test_user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Valid registration data
        self.valid_register_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'confirm_password': 'newpass123'
        }
        
        # Valid login data
        self.valid_login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }

    def test_user_registration_success(self):
        """Test successful user registration."""
        response = self.client.post(self.register_url, self.valid_register_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email=self.valid_register_data['email']).exists())
        
    def test_user_registration_invalid_data(self):
        """Test registration with invalid data."""
        # Test mismatched passwords
        invalid_data = self.valid_register_data.copy()
        invalid_data['confirm_password'] = 'wrongpass'
        response = self.client.post(self.register_url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test duplicate email
        duplicate_data = self.valid_register_data.copy()
        duplicate_data['email'] = 'test@example.com'  # Already exists
        response = self.client.post(self.register_url, duplicate_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login_success(self):
        """Test successful user login."""
        response = self.client.post(self.login_url, self.valid_login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        invalid_data = self.valid_login_data.copy()
        invalid_data['password'] = 'wrongpass'
        response = self.client.post(self.login_url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_forgot_password(self):
        """Test forgot password functionality."""
        response = self.client.post(
            self.forgot_password_url, 
            {'email': self.test_user.email}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)  # Verify email was sent

    def test_reset_password(self):
        """Test password reset functionality."""
        # Generate reset token
        uid = urlsafe_base64_encode(force_bytes(self.test_user.pk))
        token = default_token_generator.make_token(self.test_user)
        url = reverse('reset-password', kwargs={'uidb64': uid, 'token': token})
        
        # Test with valid data
        response = self.client.post(url, {
            'password': 'newpass123',
            'confirm_password': 'newpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was changed
        self.test_user.refresh_from_db()
        self.assertTrue(
            self.test_user.check_password('newpass123')
        )

    def test_user_logout(self):
        """Test user logout."""
        # First login to get token
        response = self.client.post(self.login_url, self.valid_login_data)
        access_token = response.data['access']
        refresh_token = response.data['refresh']
        
        # Set token in header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Test logout
        response = self.client.post(self.logout_url, {'refresh': refresh_token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Try to use the same refresh token
        response = self.client.post(self.logout_url, {'refresh': refresh_token})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_profile_get(self):
        """Test getting user profile."""
        # Login and set token
        response = self.client.post(self.login_url, self.valid_login_data)
        access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Get profile
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.test_user.email)

    def test_profile_update(self):
        """Test updating user profile."""
        # Login and set token
        response = self.client.post(self.login_url, self.valid_login_data)
        access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Update profile
        update_data = {
            'first_name': 'Updated',
            'last_name': 'User'
        }
        response = self.client.patch(self.profile_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')
        self.assertEqual(response.data['last_name'], 'User')

    def test_profile_unauthorized(self):
        """Test accessing profile without authentication."""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
