from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.tokens import AccessToken
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from .match_logic import targeted_msg
from users.models import Player
from django.contrib.auth.models import User
import urllib.parse
import json
import logging
import asyncio
import random
from pong.match_logic import handlePlayerInput
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

async def broadcast_players_info(tour_id, tour):

	channel_layer = get_channel_layer()
	players = tour["players"]
	data = []
	i = 1
	# Pruning the 'players' array into a new one, with only useful information 
	for player in players:
		# Re-updating users ids in the room
		if (i == 1 and player["id"] != i and tour["started"] == False): # If a player becomes id:1, they are now the tournament's leader
			await channel_layer.send(player["pcn"],{"type": "update.new_leader"})
		player["id"] = i
		data.append({
			"id": player["id"],
			"arena_name": player["arena_name"],
			"img": player["img"],
			"color": player["color"],
			"connected": True if player["pcn"] else False,
		})
		i += 1
	# Broadcasting to every players in the tournament
	if channel_layer:
		await channel_layer.group_send(
			tour_id,  # Group name (tour_id)
			{
				"type": "update.players_info",
				"case": "players_info",
				"data": data,  # Sending the pruned players array
			}
		)
	return

def register_to_tournament(tour, player_channel_name, auth_token):
	# Retrieving the Player associated with the token from the database
	decoded_token = AccessToken(auth_token)
	username = decoded_token['username']
	db_user = User.objects.get(username=username)
	db_player = Player.objects.get(user=db_user)
	# Checking if tournament is full
	if (len(tour["players"]) >= tour["rules"]["max_player"]):
		raise ValueError(f"Tournament is full")
	# Adding a new slot for the player in the tournament
	tour["players"].append({
		"id": 0, # Default is 0 then a unique id is given in broadcast_player_info
		"color": random_rgb(), # Assigning a random color for frontend display 
		"pcn": player_channel_name, # Storing the consumer's channel_name
		"username": str(db_player.user), # Storing the username from db
		"img": str(db_player.profile_picture), # Storing the profil picture from db
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
	name = name.strip()
	# Check if the player somehow manages to send a name too long or empty
	if (len(name) < 1 or len(name) > 11):
		raise ValueError(f"Name is empty")
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
			await broadcast_players_info(tour_id, tour)
			break
	return

async def log_back_player(tour, pcn):
	await targeted_msg(pcn, "update.tournament_event", None, "tournament_started")
	# This brings back the player to it's match
	for match in tour["matchs"]:
		if (match["p1"]["pcn"] == pcn or match["p2"]["pcn"] == pcn):
			await targeted_msg(pcn, "update.tournament_event", match["pids"], "match_start")
			break


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
					# Checking is tournament is already full
					if (tour["started"] == True): # If already started, player might be reconnecting
						await sync_to_async(check_for_reconnexion)(tour, self.channel_name, auth_token) # Check if user was in this tournament
					else: # Registering the player in the tournament
						await sync_to_async(register_to_tournament)(tour, self.channel_name, auth_token)
					await self.accept() # No error raised, accepting the connexion
					await self.channel_layer.group_add(self.tour_id, self.channel_name)
					# Showing other players that you are now connected
					await broadcast_players_info(self.tour_id, tour)
					# If reconnecting, players can go around the logging phase
					if (tour["started"] == True):
						await log_back_player(tour, self.channel_name)
					return
				except ValueError as e:
					if (e.args[0] == "Tournament does not exist."):
						await asyncio.sleep(0.2)  # Wait before retrying
					else:
						break # No need to retry if the error was raised from elsewhere
		# Rejecting the websocket connexion gracefully
		await self.close()


	async def disconnect(self, close_code=1001):
		tour = tournament_manager.get_tournament(self.tour_id)
		await self.channel_layer.group_discard(self.tour_id, self.channel_name)
		if (tour is not None):
			# Removing only the pcn from the slot, this allows disconnected users to reconnect
			if (tour["started"] == True) :
				# Setting the player as disconnected
				for player in tour["players"]:
					if (player["pcn"] == self.channel_name):
						player["pcn"] = None
						break
			# If the tournament did not start yet, the player's slot is removed
			else:
				for player in tour["players"]:
					if (player["pcn"] == self.channel_name):
						tour["players"].remove(player)
						break
			# Checking if every player is disconnected
			disconnected = 0
			for player in tour["players"]:
				if (player["pcn"]):
					break
				disconnected += 1
			if (len(tour["players"]) == disconnected): # Removing the tournament if it is now empty
				tournament_manager.stop_tournament(self.tour_id)
			# Updating the others of the departure if the tournament still exists
			if (tournament_manager.contains(self.tour_id)):
				await broadcast_players_info(self.tour_id, tour)
		await self.close(close_code)
		pass

	async def receive(self, text_data):
		message = json.loads(text_data)
		tour = tournament_manager.get_tournament(self.tour_id)
		if (tour is None):
			return

		match message:
			# Setting a custom username for the tournament
			case { "set_name": name }:
				try:
					await set_arena_name(self.tour_id, tour, self.channel_name, name)
					await self.send(text_data=json.dumps({"data": None, "case": "set_name_ok"}))
				except ValueError as e:
					await self.send(text_data=json.dumps({"data": str(e.args[0]), "case": "set_name_error"}))

			# Starting the tournament as Leader
			case { "start_game": _ }:
				tournament_manager.start_tournament_task(self.tour_id, self.channel_name)

			# Reads event listeners for keyboard press in a match
			case { "action": type }:
				await handlePlayerInput(tour, self.channel_name, type)
		return


	# Handle the `update.user_info` message from broadcast_players_info()
	async def update_players_info(self, event):
		tour = tournament_manager.get_tournament(self.tour_id)
		await self.send(text_data=json.dumps({"data": event["data"], "case": event["case"]}))

	# Handle the `update.new_leader` message from broadcast_players_info(), notifying the player that they are now the room's leader
	async def update_new_leader(self, event):
		await self.send(text_data=json.dumps({"data": None, "case": "you_are_leader"}))

	# Handle the `update.tournament_event` message from tournament_logic
	async def update_tournament_event(self, event):
		await self.send(text_data=json.dumps({"data": event["data"], "case": event["case"]}))

	# Handle the `update.disconnect` message from tournament_logic, closing the WebSocket
	async def update_disconnect(self, event):
		await self.disconnect(1000)
