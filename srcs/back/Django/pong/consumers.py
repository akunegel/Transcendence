#consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
from datetime import datetime, timedelta
import json
import logging
import asyncio
import uuid
from pong.RoomManager import room_manager

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger(__name__)     # Créer un logger avec un nom unique

class PongGameConsumer(AsyncWebsocketConsumer):


	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self._last_update_time = datetime.now()  # Time of last paddle position refresh
		self._is_sleeping = False  # Is waiting for next paddle position refresh
		self._fps = timedelta(seconds=(1 / 30))  # Max paddle position refresh per seconds


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
		await self.channel_layer.group_discard(self.room_id, self.channel_name)
		pass


	async def receive(self, text_data):
		# Handle incoming messages (e.g., paddle movement)
		message = json.loads(text_data)
		state = room_manager.get_room(self.room_id)["state"]
		var = room_manager.get_room(self.room_id)["var"]

		if "action" in message and var["game_started"] == True:
			paddle = "l_paddle" if self.channel_name == state["player1"] else "r_paddle" # which side's paddle we are operating on

			if message["action"] == "move_up":  # moving the paddle up
				var[paddle] += 0 if var[paddle] <= 60 else -5
			elif message["action"] == "move_down":  # moving the paddle down
				var[paddle] += 0 if var[paddle] >= 440 else 5

			if self._is_sleeping == False:
				self._is_sleeping = True
				# Calculate remaining time to wait before next frame is sent
				elapsed_time = datetime.now() - self._last_update_time
				remaining_time = (self._fps - elapsed_time).total_seconds()
				if (remaining_time > 0):
					await asyncio.sleep(remaining_time)
				await self.send(text_data=json.dumps({"state": var}))
				self._last_update_time = datetime.now()
				self._is_sleeping = False


	async def update_game_state(self, event):
		# Handle the `update.game_state` message from game_logic
		state = event["state"]
		await self.send(text_data=json.dumps({"type": "game_state", "state": state}))