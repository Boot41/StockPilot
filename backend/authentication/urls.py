from django.urls import path, include
from rest_framework.routers import DefaultRouter
from authentication.views import (
    AuthViewSet,
    ResetPasswordView,
    LogoutView,
    ProfileView
)

router = DefaultRouter()
router.register(r'', AuthViewSet, basename='auth')

urlpatterns = [
    path('', include(router.urls)),  # Register, Login, Forgot Password
    path('reset-password/<uidb64>/<token>/', ResetPasswordView.as_view(), name='reset-password'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('profile/', ProfileView.as_view(), name='auth-profile'),
]
