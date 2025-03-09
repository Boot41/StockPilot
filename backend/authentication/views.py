from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from authentication.serializers import (
    RegisterSerializer,
    LoginSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    UserProfileSerializer,
    UpdateUserProfileSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import action  
from rest_framework.views import APIView


from django.middleware.csrf import get_token

from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.utils.decorators import method_decorator

class AuthViewSet(viewsets.ViewSet):
    """
    ViewSet for User Authentication (Register, Login, Forgot Password)
    """
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    @action(detail=False, methods=['get'])
    def get_csrf_token(self, request):
        """ Get CSRF token for the client """
        token = get_token(request)
        response = Response({
            'csrfToken': token,
            'detail': 'CSRF cookie set'
        })
        response['X-CSRFToken'] = token
        response['Access-Control-Allow-Origin'] = 'http://localhost:5173'  # Your React dev server
        response['Access-Control-Allow-Credentials'] = 'true'
        return response

    @method_decorator(csrf_protect)
    @action(detail=False, methods=['post'])
    def register(self, request):
        """ User Registration """
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            response = Response({
                "user": {
                    "username": user.username,
                    "email": user.email
                },
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
            response['Access-Control-Allow-Credentials'] = 'true'
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @method_decorator(csrf_protect)
    @action(detail=False, methods=['post'])
    def login(self, request):
        """ User Login """
        print("Login request received")
        print("Request headers:", request.headers)
        print("Request data:", request.data)
        print("Request COOKIES:", request.COOKIES)
        
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            print("Serializer is valid")
            user = serializer.validated_data.get('user')
            if user:
                print(f"User authenticated successfully: {user.username}")
                refresh = RefreshToken.for_user(user)
                response_data = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    }
                }
                print("Response data:", response_data)
                return Response(response_data)
            print("User not found in validated data")
        else:
            print("Serializer errors:", serializer.errors)
        
        return Response(
            {"detail": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    @action(detail=False, methods=['post'], url_path='forgot-password')
    def forgot_password(self, request):
        """ Forgot Password - Sends Password Reset Email """
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            try:
                user = User.objects.get(email=email)
                uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                reset_url = f"{settings.FRONTEND_URL}/reset-password/{uidb64}/{token}/"

                send_mail(
                    subject="Password Reset Request",
                    message=f"Click the link below to reset your password:\n{reset_url}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )

                return Response({"message": "Password reset link sent!"}, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({"error": "User with this email does not exist"}, status=status.HTTP_404_NOT_FOUND)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(generics.GenericAPIView):
    """ Reset Password - Validates token & updates password """
    serializer_class = ResetPasswordSerializer
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)

            if not default_token_generator.check_token(user, token):
                return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                user.set_password(serializer.validated_data["password"])
                user.save()
                return Response({"message": "Password reset successfully"}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"error": "Invalid token or user"}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    """ Profile View - Get & Update user details """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve user profile"""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        """Update user profile"""
        serializer = UpdateUserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
