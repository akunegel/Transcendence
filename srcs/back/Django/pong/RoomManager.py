# RoomManager.py
from .game_logic import game_logic
from django.db import models
import asyncio
import logging
import uuid

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__balblalballba__")     # Créer un logger avec un nom unique

class RoomManager:

	def __init__(self):
		self.rooms = {}


	def create_room(self, room_id):
		self.rooms[str(room_id)] = {"task": None, "state": {"players": [], "game_started": False}} # Initialize state


	def add_player_to_room(self, room_id, player_channel_name):
		room = self.rooms.get(str(room_id))
		# Checks if room exists and is not already full
		if not room:
			raise ValueError(f"Room {room_id} may not exist.")
		if len(room["state"]["players"]) >= 2:
			raise ValueError(f"Room {room_id} is already full.")
		# Adding user to the room
		room["state"]["players"].append(player_channel_name)


	def remove_player_from_room(self, room_id, player_channel_name):
		room = self.rooms.get(str(room_id))
		if room and player_channel_name in room["state"]["players"]:
			room["state"]["players"].remove(player_channel_name)


	def start_game_task(self, room_id):
		task = asyncio.create_task(game_logic(str(room_id)))
		self.rooms[str(room_id)]["task"] = task


	def get_room(self, room_id):
		return self.rooms.get(str(room_id))


	def stop_game_task(self, room_id):
		if str(room_id) in self.rooms:
			task = self.rooms[str(room_id)]["task"]
			if task:
				task.cancel()
				del self.rooms[str(room_id)]

room_manager = RoomManager()
