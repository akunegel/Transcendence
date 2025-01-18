from channels.generic.websocket import AsyncWebsocketConsumer
from pong.consumers import PongGameConsumer
import json
import time
import asyncio

class ChatConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		# Nom du groupe de chat
		self.room_group_name = 'chat_room'

		# Rejoindre le groupe
		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)

		# Accepter la connexion WebSocket
		await self.accept()

	async def disconnect(self, close_code):
		# Quitter le groupe lors de la déconnexion
		await self.channel_layer.group_discard(
			self.room_group_name,
			self.channel_name
		)

	# Recevoir un message du WebSocket
	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json['content']

		# Envoyer le message au groupe
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'chat_message',
				'message': message
			}
		)

	# Recevoir un message du groupe
	async def chat_message(self, event):
		message = event['message']

		# Envoyer le message au WebSocket
		await self.send(text_data=json.dumps({
			'content': message
		}))