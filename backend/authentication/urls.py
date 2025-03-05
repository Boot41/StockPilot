from django.urls import path, include
from rest_framework.routers import DefaultRouter
from authentication.views import (
    AuthViewSet,
    ResetPasswordView,
    LogoutView
)

router = DefaultRouter()
router.register(r'', AuthViewSet, basename='auth')  # Includes register, login, and forgot-password

urlpatterns = [
    path('', include(router.urls)),  # Handles register, login, forgot-password (inside AuthViewSet)
    path('reset-password/<uidb64>/<token>/', ResetPasswordView.as_view(), name='reset-password'),  # Reset Password API
    path('logout/', LogoutView.as_view(), name='logout'),  # Logout API
]
