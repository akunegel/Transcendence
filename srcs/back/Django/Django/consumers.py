from channels.generic.websocket import AsyncWebsocketConsumer
import json
import time
import asyncio
import logging
from chat.consumers import ChatConsumer

logging.basicConfig(level=logging.DEBUG)  # Définir le niveau des logs
logger = logging.getLogger(__name__)     # Créer un logger avec un nom unique

class GlobalConsumer(AsyncWebsocketConsumer):

	async def connect(self):
		await self.accept()

		await self.send(text_data=json.dumps({
			'type':'connection_established',
			'message':'You are now connected!'
		}))

	async def receive(self, text_data):
		data_json = json.loads(text_data)
		message = data_json['message']

		if (message == "left_paddle_down"):
			if self.left_paddle_pos[1] > self.down_limit:
				return

			self.left_paddle_pos[1] += 1
			await self.send(text_data=json.dumps({
				'type':'left_paddle_down',
				'message': self.left_paddle_pos[1]
		}))

		if self.game_task == None:
			self.game_task = asyncio.create_task(self.main_loop())


	async def disconnect(self, close_code):
		logger.info("salut mon pote")