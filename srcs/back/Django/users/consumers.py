import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from .models import Player
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from channels.db import database_sync_to_async

class OnlineStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            token = self.scope['query_string'].decode().split('=')[1]
            access_token = AccessToken(token)
            
            self.user = await self.get_user(access_token.payload['user_id'])
            self.player = await self.get_player(self.user)
            
            await self.set_online_status(True)
            
            await self.accept()
        except (IndexError, KeyError, InvalidToken, TokenError):
            await self.close()
        except (User.DoesNotExist, Player.DoesNotExist):
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'player'):
            await self.set_online_status(False)
        await self.close()

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get('type') == 'heartbeat':
            await self.set_online_status(True)

    @database_sync_to_async
    def get_user(self, user_id):
        return User.objects.get(id=user_id)

    @database_sync_to_async
    def get_player(self, user):
        return Player.objects.get(user=user)

    @database_sync_to_async
    def set_online_status(self, status):
        player = Player.objects.get(id=self.player.id)
        player.online = status
        player.save()
