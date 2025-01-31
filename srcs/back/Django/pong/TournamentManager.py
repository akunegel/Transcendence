# from .tournament_logic import tournament_logic
import asyncio
import logging

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__tournamentManagerLog__")


class TournamentManager:

	def __init__(self):
		self.tournaments = {}

	def create_tournament(self, tour_id):
		self.tournaments[str(tour_id)] = {
			"task": None,														# Storage for task id
			"id": tour_id,														# Storing it's own id
			"rules":	{"add_bonus": False, 									# Initialize default tournament rules
			 			"is_private": True,										# -
						"has_time_limit": False,								# -
						"max_time": 5,											# -
						"max_point": 5,											# -
						"max_player": 4,										# -
			},																	# -
			"players": [],														# Storage for players' websocket id, username, displayname
			"started": False,													# Has the tournament started ?
			"winner": None,														# Tournament's winner
		}

	def get_tournament(self, tour_id):
		return self.tournaments.get(str(tour_id))

	def remove_tournament(self, tour_id):
		tournament = self.tournaments.get(str(tour_id))
		if tournament:
			self.stop_task(tour_id)
			del self.tournaments[str(tour_id)]

	def stop_task(self, tour_id):
		if str(tour_id) in self.tournaments:
			task = self.tournaments[str(tour_id)]["task"]
			if task:
				task.cancel()

	def player_disconnected(self, tour_id, player_channel_name):
		# Ending the game if it already started, or removing the tournament
		tournament = self.tournaments.get(str(tour_id))
		if tournament and player_channel_name in tournament["players"]:
			tournament["players"][player_channel_name] = None

	def start_task(self, tour_id):
		tournament = self.tournaments[str(tour_id)]
		tournament["task"] = asyncio.create_task(tournament_logic(str(tour_id)))


tournament_manager = TournamentManager()
