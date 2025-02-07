from .game_logic import game_logic, paddle_logic, timer_logic
import asyncio
import logging

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__RoomManagerLog__")

class RoomManager:

	def __init__(self):
		self.rooms = {}

	def create_room(self, room_id):
		self.rooms[str(room_id)] = {
			"game_task": None,														# Storage for game_task id
			"paddle_task": None,													# Storage for paddle_task id
			"timer_task": None, "timer_is_over": False,								# Storage for timer_task id
			"id": room_id,															# Storing it's own id
			"rules":	{"add_bonus": False, "is_private": True,					# Initialize default game rules
						"has_time_limit": False, "max_time": 10, "max_point": 10},	# -

			"state": {"ids": [], "id1": None, "id2": None},							# Initialize state (websocket's id)

			"players": {"one": {"name": None, "img": None,},						# Sendable player info for display
						"two": {"name": None, "img": None,}},						# -

			"var": {"game_started": False, "time": 0.0,								# Initialize sendable game variables
					"objx": 400, "objy": 250, 										# -
					"l_score": 0, "r_score": 0,										# -
					"l_paddle": 250, "r_paddle": 250,								# -
					"l_paddle_size": 120, "r_paddle_size": 120,						# -
					"available_bonus": "none",},									# -

			"dyn": {"dir": 1, "vec": 0.005, "speed": 120,							# Initialize local game variables (dynamics)
					"l_paddle": {"going_up": False, "going_down": False},			# -
					"r_paddle": {"going_up": False, "going_down": False},			# -
					"bonus": "none", "timer": 3, "old_speed": 120,					# -
					"rebound": {"left": 0, "right": 0},},							# - Amount of rebounds made on paddles

			"winner": None,															# - Game's winner
		}

	def get_room(self, room_id):
		return self.rooms.get(str(room_id))

	def remove_room(self, room_id):
		room = self.rooms.get(str(room_id))
		if room:
			self.stop_game_task(room_id)
			del self.rooms[str(room_id)]

	def player_disconnected(self, room_id, player_channel_name):
		# Ending the game if it already started, or removing the room
		room = self.rooms.get(str(room_id))
		if room and player_channel_name in room["state"]["ids"]:
			if (room["var"]["game_started"] == True):
				room["var"]["game_started"] = False
			else:
				self.remove_room(room_id)

	def start_game_task(self, room_id):
		if str(room_id) in self.rooms:
			room = self.rooms[str(room_id)]
			if len(room["state"]["ids"]) == 2 and room["var"]["game_started"] == False:
				room["var"]["game_started"] = True
				room["game_task"] = asyncio.create_task(game_logic(str(room_id)))
				room["paddle_task"] = asyncio.create_task(paddle_logic(str(room_id)))
				if room["rules"]["has_time_limit"] == True:
					room["timer_task"] = asyncio.create_task(timer_logic(str(room_id)))

	def stop_game_task(self, room_id):
		if str(room_id) in self.rooms:
			task = self.rooms[str(room_id)]["game_task"]
			if task:
				task.cancel()
			task = self.rooms[str(room_id)]["paddle_task"]
			if task:
				task.cancel()
			task = self.rooms[str(room_id)]["timer_task"]
			if task:
				task.cancel()


room_manager = RoomManager()
