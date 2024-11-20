from django.db import models
from .game_logic import game_instance
import asyncio

class RoomManager:
	def __init__(self):
		self.rooms = {}

	def create_room(self, room_id):
		# game_task = asyncio.create_task(game_instance(room_id))
		self.rooms[room_id]["task"] = game_task
		return (room_id)
	
	def get_room(self, room_id):
		return self.rooms.get(room_id)
	
	def remove_room(self, room_id):
		self.rooms.pop(room_id, None)

room_manager = RoomManager()