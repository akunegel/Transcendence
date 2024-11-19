from rest_framework import serializers
from .models import Player
from django.contrib.auth.hashers import make_password

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ('id', 'username', 'passwd')
        extra_kwargs = {'passwd': {'write_only': True}}

    def create(self, validated_data):
        validated_data['passwd'] = make_password(validated_data['passwd'])
        return Player.objects.create(**validated_data)