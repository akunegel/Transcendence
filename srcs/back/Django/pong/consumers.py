#consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
from datetime import datetime, timedelta
import json
import logging
import asyncio
from pong.RoomManager import room_manager


logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__PongGameLog__")

class PongGameConsumer(AsyncWebsocketConsumer):


	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self._last_update_time = datetime.now()  # Time of last paddle position refresh
		self._is_sleeping = False  # Is waiting for next paddle position refresh
		self._fps = timedelta(seconds=(1 / 30))  # Max paddle position refresh per seconds


	async def connect(self):
		self.room_id = str(self.scope["url_route"]["kwargs"]["room_id"])
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
		room_manager.player_disconnected(self.room_id, self.channel_name)
		await self.channel_layer.group_discard(self.room_id, self.channel_name)
		pass


	async def receive(self, text_data):
		# Handle incoming messages (paddle movement)
		message = json.loads(text_data)
		room = room_manager.get_room(self.room_id)
		if room is None:
			return
		state = room["state"]
		var = room["var"]
		dyn = room["dyn"]

		if "action" in message and var["game_started"] == True:
			paddle = "l_paddle" if self.channel_name == state["player1"] else "r_paddle" # which side's paddle we are operating on

			if message["action"] == "arrow_up_pressed": # player is now pressing up
				dyn[paddle]["going_up"] = True
			elif message["action"] == "arrow_up_unpressed": # player stopped pressing up
				dyn[paddle]["going_up"] = False
			
			if message["action"] == "arrow_down_pressed":  # player is now pressing down
				dyn[paddle]["going_down"] = True
			elif message["action"] == "arrow_down_unpressed":  # player stopped pressing down
				dyn[paddle]["going_down"] = False


	async def update_disconnect(self, event):
		# Handle the `update.disconnect` message from game_logic, closing the WebSocket
		await self.disconnect()

	async def update_game_state(self, event):
		# Handle the `update.game_state` message from game_logic
		state = event["state"]
		case = event["case"]
		await self.send(text_data=json.dumps({"state": state, "case": case}))