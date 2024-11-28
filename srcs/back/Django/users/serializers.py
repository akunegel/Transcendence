from rest_framework import serializers
from .models import Player
from django.contrib.auth.hashers import make_password
import secrets

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ('id', 'username', 'passwd')
        extra_kwargs = {'passwd': {'write_only': True}}

    def create(self, validated_data):
        validated_data['passwd'] = make_password(validated_data['passwd'])
        return Player.objects.create(**validated_data)


class PlayerSerializer42(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ('id', 'username', 'fname', 'lname', 'email', 'passwd')
        extra_kwargs = {'passwd': {'write_only': True}}

    def create(self, validated_data):
        if 'passwd' not in validated_data or not validated_data['passwd']:
            validated_data['passwd'] = secrets.token_urlsafe(16)
        validated_data['passwd'] = make_password(validated_data['passwd'])
        return Player.objects.create(**validated_data)