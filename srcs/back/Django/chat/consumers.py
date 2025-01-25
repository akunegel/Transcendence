from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from users.models import BlockedUser
import json

class ChatConsumer(AsyncWebsocketConsumer):
    @database_sync_to_async
    def check_blocking(self, sender_username, receiver_username):
        # Check if sender is blocked by receiver
        return BlockedUser.objects.filter(
            user__username=receiver_username,
            blocked_user__username=sender_username
        ).exists()

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

        # Send to all users, add blocking logic on client-side
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': sender_username
            }
        )

    async def chat_message(self, event):
        username = event['username']
        message = event['message']

        await self.send(text_data=json.dumps({
            'username': username,
            'message': message
        }))