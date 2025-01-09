from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Player, FriendRequest, Friendship

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class PlayerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Player
        fields = ['user_id', 'username', 'profile_picture', 'first_name', 'last_name', 'email', 'two_factor']

class LanguageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.language', read_only=True)

    class Meta:
        model = Player
        fields = ['username', 'language']
class PlayerRegistrationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = Player
        fields = ['username', 'password']
    
    def validate_username(self, value):
        if value.endswith('42'):
            raise Exception("Username cannot end with '42'")
        return value

    def create(self, validated_data):
        username = validated_data.pop('username')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            username=username,
            password=password,
        )
        
        player = Player.objects.create(
            user=user,
            first_name='',
            last_name='',
            email='',
            **validated_data
        )
        return player

class PlayerUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Player
        fields = ['user_id', 'username', 'profile_picture', 'first_name', 'last_name', 'email', 'two_factor']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'email': {'required': False},
            'profile_picture': {'required': False},
            'two_factor': {'required': False},
        }

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.two_factor = validated_data.get('two_factor', instance.two_factor)
        instance.save()
        return instance

class FriendRequestSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    receiver_id = serializers.IntegerField(source='receiver.id', read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'sender_id', 'sender_username', 'receiver_id', 'receiver_username', 'status', 'created_at']

class FriendshipSerializer(serializers.ModelSerializer):
    friend_id = serializers.IntegerField(source='friend.id', read_only=True)
    friend_username = serializers.CharField(source='friend.username', read_only=True)
    first_name = serializers.CharField(source='friend.player.first_name', read_only=True)
    last_name = serializers.CharField(source='friend.player.last_name', read_only=True)
    profile_picture = serializers.URLField(source='friend.player.profile_picture', read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'friend_id', 'friend_username', 'first_name', 'last_name', 'profile_picture', 'created_at']