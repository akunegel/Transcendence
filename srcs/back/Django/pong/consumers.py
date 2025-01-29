#consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.tokens import AccessToken
from asgiref.sync import sync_to_async
from users.models import Player
from django.contrib.auth.models import User
import urllib.parse
import json
import logging
import asyncio
from pong.RoomManager import room_manager
from pong.TournamentManager import tournament_manager


logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__PongGameLog__")


# ***************************************************
#               PONG GAME CONSUMER
# ***************************************************


def register_to_room(room, player_channel_name, auth_token):
	# Retrieving the Player associated with the token from the database
	decoded_token = AccessToken(auth_token)
	username = decoded_token['username']
	user = User.objects.get(username=username)
	player = Player.objects.get(user=user)
	# Adding user to the room, storing it's channel id, username and profil_picture
	room["state"]["ids"].append(player_channel_name)
	if room["state"]["id1"] == None:
		room["state"]["id1"] = player_channel_name
		room["players"]["one"]["name"] = str(player.user)
		room["players"]["one"]["img"] = str(player.profile_picture)
	elif room["state"]["id2"] == None:
		room["state"]["id2"] = player_channel_name
		room["players"]["two"]["name"] = str(player.user)
		room["players"]["two"]["img"] = str(player.profile_picture)

class PongGameConsumer(AsyncWebsocketConsumer):

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)

	async def connect(self):
		query_string = self.scope["query_string"].decode('utf-8')  # Decode bytes to string
		query_params = urllib.parse.parse_qs(query_string)  # Parse query string
		self.room_id = query_params.get('roomId', [None])[0] # Get the 'room_id' parameter (or None if not provided)
		auth_token = query_params.get('token', [None])[0]  # Get the 'token' parameter (or None if not provided)

		if (auth_token != None):
			# Retry connecting up to 5 times with 0.2 second delay, room might no be initialized yet
			for _ in range(5):
				try:
					room = room_manager.get_room(self.room_id)
					# Checking if the room exists and is not full yet
					if not room or len(room["state"]["ids"]) >= 2:
						raise ValueError(f"Cannot connect to room {self.room_id}.")
					# Registering the player in the room
					await sync_to_async(register_to_room)(room, self.channel_name, auth_token)
					await self.channel_layer.group_add(self.room_id, self.channel_name)
					await self.accept()
					# Checking with room_manager if the game can start
					room_manager.start_game_task(self.room_id)
					return  # Successfully accepted the connection, exiting the function
				except ValueError as e:
					await asyncio.sleep(0.2)  # Wait before retrying
		# If room is not found or no token was sent, reject the connection
		await self.close()


	async def disconnect(self, close_code=1001):
		room_manager.player_disconnected(self.room_id, self.channel_name)
		await self.channel_layer.group_discard(self.room_id, self.channel_name)
		await self.close(close_code)
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
			paddle = "l_paddle" if self.channel_name == state["id1"] else "r_paddle" # which side's paddle we are operating on

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
		await self.disconnect(1000)

	async def update_game_state(self, event):
		# Handle the `update.game_state` message from game_logic
		state = event["state"]
		case = event["case"]
		await self.send(text_data=json.dumps({"state": state, "case": case}))




# ***************************************************
#               TOURNAMENT CONSUMER
# ***************************************************


def register_to_tournament(tour, player_channel_name, auth_token):
	# Retrieving the Player associated with the token from the database
	decoded_token = AccessToken(auth_token)
	username = decoded_token['username']
	user = User.objects.get(username=username)
	player = Player.objects.get(user=user)
	# Adding user to the tournament, storing it's channel id, username and profil_picture
	tour["players"].append({
		"pcn": player_channel_name,
		"user": str(player.user),
		"img": str(player.profile_picture),
		"name": None # This will be the display name for the tournament
	})


class TournamentConsumer(AsyncWebsocketConsumer):

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)

	async def connect(self):
		query_string = self.scope["query_string"].decode('utf-8')  # Decode bytes to string
		query_params = urllib.parse.parse_qs(query_string)  # Parse query string
		self.tour_id = query_params.get('tourId', [None])[0] # Get the 'tour_id' parameter (or None if not provided)
		auth_token = query_params.get('token', [None])[0]  # Get the 'token' parameter (or None if not provided)

		if (auth_token != None):
			# Retry connecting up to 5 times with 0.2 second delay, tournament might no be initialized yet
			for _ in range(5):
				try:
					tour = tournament_manager.get_tournament(self.tour_id)
					# Checking if the room exists and is not full yet
					if not tour or len(tour["players"]) >= tour["rules"]["max_player"]:
						raise ValueError(f"Cannot connect to tournament {self.tour_id}.")
					# Registering the player in the tournament
					await sync_to_async(register_to_tournament)(tour, self.channel_name, auth_token)
					await self.channel_layer.group_add(self.tour_id, self.channel_name)
					await self.accept()
					# Checking with tournament_manager if the game can start
					tournament_manager.start_task(self.tour_id)
					return  # Successfully accepted the connection, exiting the function
				except ValueError as e:
					await asyncio.sleep(0.2)  # Wait before retrying
		# If tournament is not found or no token was sent, reject the connection
		await self.close()


	async def disconnect(self, close_code=1001):
		tournament_manager.player_disconnected(self.tour_id, self.channel_name)
		await self.channel_layer.group_discard(self.tour_id, self.channel_name)
		await self.close(close_code)
		pass


	async def receive(self, text_data):
		# Handle incoming messages (paddle movement)
		message = json.loads(text_data)
		tour = tournament_manager.get_room(self.tour_id)
		if tour is None:
			return



	async def update_disconnect(self, event):
		# Handle the `update.disconnect` message from tournament_logic, closing the WebSocket
		await self.disconnect(1000)

	async def update_game_state(self, event):
		# Handle the `update.game_state` message from game_logic
		state = event["state"]
		case = event["case"]
		await self.send(text_data=json.dumps({"state": state, "case": case}))