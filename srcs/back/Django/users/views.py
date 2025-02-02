import os
from dotenv import load_dotenv
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import PlayerUpdateSerializer, PlayerSerializer, LanguageSerializer, PlayerRegistrationSerializer, FriendRequestSerializer, FriendshipSerializer, TwoFactorSetupSerializer, TwoFactorVerifySerializer, UserLanguagePatchSerializer
from .models import Player, FriendRequest, Friendship, BlockedUser
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Q
import requests
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
import pyotp
import qrcode
import base64
import logging
from io import BytesIO
from django.contrib.auth import authenticate

load_dotenv()

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__UserViews__")


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        return token

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        try:
            user = User.objects.get(username=username)
            player = Player.objects.get(user=user)
            
            if player.two_factor:
                serializer = self.get_serializer(data=request.data)
                try:
                    serializer.is_valid(raise_exception=True)
                except Exception as e:
                    raise e
                
                return Response({
                    'requires_2fa': True,
                    'detail': 'Please provide 2FA code'
                }, status=status.HTTP_200_OK)
                
        except (User.DoesNotExist, Player.DoesNotExist):
            pass
        
        return super().post(request, *args, **kwargs)

class RegisterPlayer(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PlayerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(
            {"error": True}, 
            status=status.HTTP_400_BAD_REQUEST
        )


class LoginWith42(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({"error": "Authorization code is required"}, status=400)

        token_url = "https://api.intra.42.fr/oauth/token"

        client_id = os.getenv('FORTYTWO_CLIENT_ID')
        client_secret = os.getenv('FORTYTWO_CLIENT_SECRET')

        token_data = {
            "grant_type": "authorization_code",
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": "https://localhost:9443/42connect",
        }
        token_response = requests.post(token_url, data=token_data).json()
        access_token = token_response.get("access_token")

        if not access_token:
            return Response({"error": "Failed to obtain access token"}, status=400)

        user_info_url = "https://api.intra.42.fr/v2/me"
        user_info_headers = {"Authorization": f"Bearer {access_token}"}
        user_info = requests.get(user_info_url, headers=user_info_headers).json()

        if not user_info.get("login"):
            return Response({"error": "Failed to fetch user info"}, status=400)

        username = f"{user_info['login']}42"
        email = user_info["email"]
        first_name = user_info["first_name"]
        last_name = user_info["last_name"]
        profile_picture = user_info.get("image", {}).get("versions", {}).get("large")

        user, created = User.objects.get_or_create(username=username, defaults={
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
        })

        if not created:
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.save()

        player, _ = Player.objects.get_or_create(user=user, defaults={
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "profile_picture": profile_picture,
        })

        player.email = email
        player.first_name = first_name
        player.last_name = last_name
        player.profile_picture = profile_picture
        player.save()

        refresh = RefreshToken.for_user(user)
        token = MyTokenObtainPairSerializer.get_token(user)
        return Response({
            'access': str(token.access_token),
            'refresh': str(token),
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getPlayerProfile(request):
    try:
        player = Player.objects.get(user=request.user)
        serializer = PlayerSerializer(player)
        return Response(serializer.data)
    except Player.DoesNotExist:
        return Response({"detail": "Player profile not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getPlayerLanguage(request):
    try:
        player = Player.objects.get(user=request.user)
        serializer = LanguageSerializer(player)
        return Response(serializer.data)
    except Player.DoesNotExist:
        return Response({"detail": "Player profile not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updatePlayerProfile(request):
    try:
        player = Player.objects.get(user=request.user)
        serializer = PlayerUpdateSerializer(player, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            updated_player = Player.objects.get(user=request.user)
            return Response(PlayerSerializer(updated_player).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Player.DoesNotExist:
        return Response({"detail": "Player profile not found"}, status=status.HTTP_404_NOT_FOUND)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getOtherPlayerProfile(request, username):
    try:
        user = User.objects.get(username=username)
        player = Player.objects.get(user=user)
        serializer = PlayerSerializer(player)
        return Response(serializer.data)
    except (User.DoesNotExist, Player.DoesNotExist):
        return Response({"detail": "Player profile not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friends(request):
    try:
        friendships = Friendship.objects.filter(user=request.user)\
            .select_related('friend__player')
        serializer = FriendshipSerializer(friendships, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error fetching friends: {str(e)}")
        return Response({"detail": "Error fetching friends"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friend_requests(request):
    try:
        player = Player.objects.get(user=request.user)
        friend_requests = FriendRequest.objects.filter(
            receiver=request.user,
            status='PENDING'
        )
        serializer = FriendRequestSerializer(friend_requests, many=True)
        return Response(serializer.data)
    except Player.DoesNotExist:
        return Response({"detail": "Player profile not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_friend_request(request):
    username = request.data.get('username')

    try:
        sender_player = Player.objects.get(user=request.user)
    except Player.DoesNotExist:
        return Response(
            {'detail': 'Sender player profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if username == request.user.username:
        return Response(
            {'detail': 'You cannot send a friend request to yourself'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        receiver_player = Player.objects.get(user__username=username)
    except Player.DoesNotExist:
        return Response(
            {'detail': 'Player not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if Friendship.objects.filter(
        user=request.user,
        friend=receiver_player.user
    ).exists():
        return Response(
            {'detail': 'You are already friends'},
            status=status.HTTP_400_BAD_REQUEST
        )

    existing_request = FriendRequest.objects.filter(
        sender=request.user,
        receiver=receiver_player.user,
        status='PENDING'
    ).exists()

    if existing_request:
        return Response(
            {'detail': 'Friend request already sent'},
            status=status.HTTP_400_BAD_REQUEST
        )

    friend_request = FriendRequest.objects.create(
        sender=request.user,
        receiver=receiver_player.user,
        status='PENDING'
    )

    serializer = FriendRequestSerializer(friend_request)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_friend_request(request):
    request_id = request.data.get('request_id')

    friend_request = get_object_or_404(
        FriendRequest,
        id=request_id,
        receiver=request.user,
        status='PENDING'
    )

    friend_request.status = 'ACCEPTED'
    friend_request.save()

    Friendship.objects.create(user=request.user, friend=friend_request.sender)
    Friendship.objects.create(user=friend_request.sender, friend=request.user)

    return Response({'detail': 'Friend request accepted'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refuse_friend_request(request):
    request_id = request.data.get('request_id')

    friend_request = get_object_or_404(
        FriendRequest,
        id=request_id,
        receiver=request.user,
        status='PENDING'
    )

    friend_request.delete()

    return Response({'detail': 'Friend request rejected'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_friend(request):
    friend_id = request.data.get('friend_id')

    try:
        friend_player = Player.objects.get(user__id=friend_id)
    except Player.DoesNotExist:
        return Response(
            {'detail': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    Friendship.objects.filter(
        user=request.user,
        friend=friend_player.user
    ).delete()
    Friendship.objects.filter(
        user=friend_player.user,
        friend=request.user
    ).delete()

    FriendRequest.objects.filter(
        (Q(sender=request.user, receiver=friend_player.user) |
         Q(sender=friend_player.user, receiver=request.user))
    ).delete()

    return Response({'detail': 'Friend removed'})


class SetupTwoFactor(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        player = get_object_or_404(Player, user=request.user)
        
        if player.two_factor:
            return Response(
                {"detail": "2FA is already enabled"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        secret = pyotp.random_base32()
        player.mfa_secret = secret
        player.save()
        
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=request.user.username,
            issuer_name='Transcendence'
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        qr_code = base64.b64encode(buffered.getvalue()).decode()
        
        return Response({
            'secret': secret,
            'qr_code': f'data:image/png;base64,{qr_code}'
        })
    
    def post(self, request):
        player = get_object_or_404(Player, user=request.user)
        serializer = TwoFactorSetupSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        if not player.mfa_secret:
            return Response(
                {"detail": "Please get a secret key first"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        totp = pyotp.TOTP(player.mfa_secret)
        if totp.verify(serializer.validated_data['verification_code']):
            player.two_factor = True
            player.save()
            return Response({"detail": "2FA enabled successfully"})
        
        return Response(
            {"detail": "Invalid verification code"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
class VerifyTwoFactor(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        verification_code = request.data.get('verification_code')
        
        if not all([username, password, verification_code]):
            return Response(
                {"detail": "Missing required fields"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=username, password=password)
        if not user:
            return Response(
                {"detail": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            player = Player.objects.get(user=user)
        except Player.DoesNotExist:
            return Response(
                {"detail": "Player not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not player.two_factor:
            return Response(
                {"detail": "2FA is not enabled for this user"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        totp = pyotp.TOTP(player.mfa_secret)
        if not totp.verify(verification_code):
            return Response(
                {"detail": "Invalid verification code"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        refresh = RefreshToken.for_user(user)
        token = MyTokenObtainPairSerializer.get_token(user)
        
        return Response({
            'access': str(token.access_token),
            'refresh': str(token),
        })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def block_user(request):
    username = request.data.get('username')

    try:
        blocked_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(
            {'detail': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if blocked_user == request.user:
        return Response(
            {'detail': 'You cannot block yourself'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if already blocked
    blocked, created = BlockedUser.objects.get_or_create(
        user=request.user,
        blocked_user=blocked_user
    )

    return Response({'detail': 'User blocked successfully'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_blocked_users(request):
    blocked_users = BlockedUser.objects.filter(user=request.user)
    blocked_usernames = [block.blocked_user.username for block in blocked_users]
    return Response({'blocked_users': blocked_usernames})

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def updateUserLanguage(request):
    #user = request.user
    try:
        player = Player.objects.get(user=request.user)
    except Player.DoesNotExist:
        return Response({"error": "Player profile not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = UserLanguagePatchSerializer(instance=player, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    print(serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)