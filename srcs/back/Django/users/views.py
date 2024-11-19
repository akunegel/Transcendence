from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import PlayerSerializer
from .models import Player

@api_view(['POST'])
@permission_classes([AllowAny])
def register_player(request):
    serializer = PlayerSerializer(data=request.data)
    if serializer.is_valid():
        player = serializer.save()
        refresh = RefreshToken.for_user(player)
        return Response({
            'user': serializer.data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    except Player.DoesNotExist:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)