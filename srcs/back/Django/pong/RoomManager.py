# RoomManager.py
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .paddle_logic import paddle_logic
from .game_logic import game_logic
from django.db import models
import asyncio
import logging

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__RoomManagerLog__")


class RoomManager:

	def __init__(self):
		self.rooms = {}

	def create_room(self, room_id):
		self.rooms[str(room_id)] = {"game_task": None,														# Storage for game_task id
							  		"paddle_task": None,													# Storage for paddle_task id
									"id": room_id,															# Storing it's own id
									"rules":	{"add_bonus": False, "is_private": True,					# Initialize default game rules
												"has_time_limit": False, "max_time": 10, "max_point": 10},	# -
									"state": {"players": [], "player1": None, "player2": None,},			# Initialize state
									"var": {"game_started": False, "time": 0.0,								# Initialize 'sendable' game variables
											"objx": 400, "objy": 250, 										# -
											"l_score": 0, "r_score": 0,										# -
											"l_paddle": 250, "r_paddle": 250},								# -
									"dyn": {"dir": 1, "vec": 0.005, "speed": 60,							# Initialize local game variables (dynamics)
											"l_paddle": {"going_up": False, "going_down": False},			# -
											"r_paddle": {"going_up": False, "going_down": False}},			# -
									}

	def remove_room(self, room_id):
		room = self.rooms.get(str(room_id))
		if room:
			self.stop_game_task(room_id)
			del self.rooms[str(room_id)]

	def add_player_to_room(self, room_id, player_channel_name):
		room = self.rooms.get(str(room_id))
		# Checks if room exists and is not already full
		if not room:
			raise ValueError(f"Room {room_id} may not exist.")
		if len(room["state"]["players"]) >= 2:
			raise ValueError(f"Room {room_id} is already full.")

		# Adding user to the room, 'saving their seats' as player1 or player2
		room["state"]["players"].append(player_channel_name)
		if room["state"]["player1"] == None:
			room["state"]["player1"] = player_channel_name
		elif room["state"]["player2"] == None:
			room["state"]["player2"] = player_channel_name

		# Starting the game when room is full
		if len(room["state"]["players"]) == 2:
			if room["var"]["game_started"] == False:
				room["var"]["game_started"] = True
				self.start_game_task(room_id)


	def remove_player_from_room(self, room_id, player_channel_name):
		room = self.rooms.get(str(room_id))
		if room and player_channel_name in room["state"]["players"]:
			room["state"]["players"].remove(player_channel_name)
			room["var"]["game_started"] = False


	def start_game_task(self, room_id):
		self.rooms[str(room_id)]["game_task"] = asyncio.create_task(game_logic(str(room_id)))
		self.rooms[str(room_id)]["paddle_task"] = asyncio.create_task(paddle_logic(str(room_id)))


	def get_room(self, room_id):
		return self.rooms.get(str(room_id))


	def stop_game_task(self, room_id):
		if str(room_id) in self.rooms:
			task = self.rooms[str(room_id)]["game_task"]
			if task:
				task.cancel()
			task = self.rooms[str(room_id)]["paddle_task"]
			if task:
				task.cancel()


room_manager = RoomManager()
