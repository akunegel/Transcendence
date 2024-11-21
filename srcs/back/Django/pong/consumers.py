#consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json
from pong.RoomManager import room_manager
import logging
import asyncio
import uuid

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger(__name__)     # Créer un logger avec un nom unique

class PongGameConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.room_id = self.scope["url_route"]["kwargs"]["room_id"]

		# Retry checking the room if room is not yet initialized
		# Retry connecting up to 5 times with 0.2 second delay
		for _ in range(5):
			try:
				room_manager.add_player_to_room(self.room_id, self.channel_name)
				await self.channel_layer.group_add(self.room_id, self.channel_name)
				await self.accept()
				return  # Successfully accepted the connection, so exit the loop
			except ValueError as e:
				logger.warning(f"Attempt failed: {str(e)}")
				await asyncio.sleep(0.2)  # Wait before retrying

		# If no room is found, reject the connection
		await self.close()

	async def disconnect(self, close_code):
		room_manager.remove_player_from_room(self.room_id, self.channel_name)
		pass

	async def receive(self, text_data):
		# Handle incoming messages (e.g., paddle movement)
		message = json.loads(text_data)

		if "action" in message:
			# Forward message to game logic
			room_state = room_manager.get_room(self.room_id)["state"]
			room_state["paddle_action"] = message["action"]

		# Example: Send an acknowledgment or update
		await self.send(text_data=json.dumps({"status": "received"}))