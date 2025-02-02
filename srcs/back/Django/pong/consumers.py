from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.tokens import AccessToken
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from users.models import Player
from django.contrib.auth.models import User
import urllib.parse
import json
import logging
import asyncio
import random
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


def random_rgb():
	r, g, b = random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)
	return f"#{r:02X}{g:02X}{b:02X}"

async def broadcast_players_info(tour_id, players):

	channel_layer = get_channel_layer()
	data = []
	i = 1
	# Pruning the 'players' array into a new one, with only useful information 
	for player in players:
		player["id"] = i # Re-updating users ids in the room
		data.append({
			"id": player["id"],
			"arena_name": player["arena_name"],
			"img": player["img"],
			"color": player["color"],
		})
		i += 1
	# Broadcasting to every players in the tournament
	if channel_layer:
		await channel_layer.group_send(
			tour_id,  # Group name (tour_id)
			{
				"type": "update.players_info",  # Custom message type
				"case": "players_info",
				"data": data,  # Data to send
			}
		)
	return

def register_to_tournament(tour, player_channel_name, auth_token):
	# Retrieving the Player associated with the token from the database
	decoded_token = AccessToken(auth_token)
	username = decoded_token['username']
	db_user = User.objects.get(username=username)
	db_player = Player.objects.get(user=db_user)
	# Adding user to the tournament, storing it's channel id, username and profil_picture
	tour["players"].append({
		"id": (len(tour["players"]) + 1),
		"color": random_rgb(),
		"pcn": player_channel_name,
		"username": str(db_player.user),
		"img": str(db_player.profile_picture),
		"arena_name": None, # This will be the display name for the tournament
	})

def check_for_reconnexion(tour, player_channel_name, auth_token):
	# Retrieving the Player associated with the token from the database
	decoded_token = AccessToken(auth_token)
	username = decoded_token['username']
	db_user = User.objects.get(username=username)
	db_player = Player.objects.get(user=db_user)
	for player in tour["players"]:
		if (player["username"] == str(db_player.user) and player["pcn"] == None):
			# Update the reconnecting player with it's new channel name
			player["pcn"] = player_channel_name
			return
	# Player was not in the tournament
	raise ValueError(f"Tournament is full")

async def set_arena_name(tour_id, tour, player_channel_name, name):
	# Check if the player somehow manages to send a name too long or empty
	if (len(name) < 1 or len(name) > 11):
		raise ValueError(f"Invalid name length")
	# Check if the name is already in use in this tournament
	for player in tour["players"]:
		if (player["pcn"] != player_channel_name and player["arena_name"] == name):
			raise ValueError(f"Name already taken")
		elif (player["pcn"] == player_channel_name and player["arena_name"] != None):
			raise ValueError (f"Name already set")
	# Confirm the username and broadcast it to every users
	for player in tour["players"]:
		if (player["pcn"] == player_channel_name):
			player["arena_name"] = name
			await broadcast_players_info(tour_id, tour["players"])
			break
	return

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
					# Checking if the room exists
					if (not tour):
						raise ValueError(f"Tournament does not exist.")
					# Checking is tournament is full
					if (len(tour["players"]) >= tour["rules"]["max_player"]): # If full, player might be reconnecting
						await sync_to_async(check_for_reconnexion)(tour, self.channel_name, auth_token)
					else: # Registering the player in the tournament
						await sync_to_async(register_to_tournament)(tour, self.channel_name, auth_token)
					await self.channel_layer.group_add(self.tour_id, self.channel_name)
					await self.accept()
					return  # Successfully accepted the connection, exiting the function
				except ValueError as e:
					if (e.args[0] == "Tournament does not exist."):
						await asyncio.sleep(0.2)  # Wait before retrying
					else:
						break # No need to retry if the error came from elsewhere
		# Rejecting the websocket connexion gracefully
		await self.close()


	async def disconnect(self, close_code=1001):
		# Removing the channel name from the channel layer
		await self.channel_layer.group_discard(self.tour_id, self.channel_name)
		# Getting the associated tournament
		tour = tournament_manager.get_tournament(self.tour_id)
		if (tour is not None):
			if (tour["started"] == True) : # Removing only the pcn from the slot, this allows disconnected users to reconnect
				for player in tour["players"]:
					if (player["pcn"] == self.channel_name):
						player["pcn"] = None
						break
			else: # If the tournament did not start yet, the player's slot is removed
				for player in tour["players"]:
					if (player["pcn"] == self.channel_name):
						tour["players"].remove(player)
						break
				if (len(tour["players"]) == 0): # Removing the tournament if it is now empty
					tournament_manager.remove_tournament(self.tour_id)
				else: # Or updating the others of the departure
					await broadcast_players_info(self.tour_id, tour["players"])
		await self.close(close_code)
		pass

	async def receive(self, text_data):
		message = json.loads(text_data)
		tour = tournament_manager.get_tournament(self.tour_id)
		# Message case 'set_name' (from NameForm.jsx) 
		if (tour is not None and "set_name" in message and tour["started"] == False):
			try:
				await set_arena_name(self.tour_id, tour, self.channel_name, message["set_name"])
				await self.send(text_data=json.dumps({"data": None, "case": "set_name_ok"}))
			except ValueError as e:
				await self.send(text_data=json.dumps({"data": str(e.args[0]), "case": "set_name_error"}))
		return

	# Handle the `update.disconnect` message from tournament_logic, closing the WebSocket
	async def update_disconnect(self, event):
		await self.disconnect(1000)

	# Handle the `update.user_info` message from broadcast_players_info()
	async def update_players_info(self, event):
		await self.send(text_data=json.dumps({"data": event["data"], "case": event["case"]}))