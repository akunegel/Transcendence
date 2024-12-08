from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import PlayerSerializer
from .models import Player
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model
from rest_framework.exceptions import AuthenticationFailed

@api_view(['POST'])
@permission_classes([AllowAny])
def register_player(request):
    serializer = PlayerSerializer(data=request.data)
    username = request.data.get('username')

    if Player.objects.filter(username=username).exists():
        return Response({
            'success': False,
            'errors': ["Username already used."],
        }, status=status.HTTP_400_BAD_REQUEST)

    if serializer.is_valid():
        player = serializer.save()
        return Response({
            'success': True,
            'user': serializer.data,
        }, status=status.HTTP_201_CREATED)

    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_player(request):
    username = request.data.get('username')
    password = request.data.get('passwd')

    try:
        player = Player.objects.get(username=username)
        if check_password(password, player.passwd):
            refresh = RefreshToken.for_user(player)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        else:
            return Response({
                'success': False,
                'error': 'Invalid password'
            }, status=status.HTTP_401_UNAUTHORIZED)
    except Player.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    user = request.user
    return Response({
        'username': user.username,
        'fname': user.first_name,
        'lname': user.last_name,
        'email': user.email,
    })