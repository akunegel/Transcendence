from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from users.models import BlockedUser
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'chat_room'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        sender_username = data['username']
        message = data['message']
        
        target_user = data.get('target_user')
        game_invite = data.get('game_invite')

        if not target_user:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'username': sender_username
                }
            )
        else:
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'targeted_message',
                    'message': message,
                    'username': sender_username,
                    'target_user': target_user,
                    'game_invite': game_invite
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'username': event['username'],
            'message': event['message']
        }))

    async def targeted_message(self, event):
        await self.send(text_data=json.dumps({
            'username': event['username'],
            'message': event['message'],
            'target_user': event['target_user'],
            'game_invite': event.get('game_invite')
        }))