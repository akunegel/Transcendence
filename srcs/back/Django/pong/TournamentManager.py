from .tournament_logic import tournament_logic
import asyncio
import logging

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__tournamentManagerLog__")


class TournamentManager:

	def __init__(self):
		self.tournaments = {}

	def create_tournament(self, tournament_id):
		self.tournaments[str(tournament_id)] = {"task": None,															# Storage for task id
												"id": tournament_id,													# Storing it's own id
												"rules":	{"add_bonus": False, "is_private": True,					# Initialize default tournament rules
															"has_time_limit": False, "max_time": 10,					# -
															"max_point": 10, "max_player": 6},							# -

												"players": [],															# Storage for players websocket id)
												"started": False,														# Has the tournament started ?
												"winner": None,															# Tournament's winner

												}

	def remove_tournament(self, tournament_id):
		tournament = self.tournaments.get(str(tournament_id))
		if tournament:
			self.stop_task(tournament_id)
			del self.tournaments[str(tournament_id)]

	def add_player_to_tournament(self, tournament_id, player_channel_name):
		tournament = self.tournaments.get(str(tournament_id))
		# Checks if tournament exists and is not already full
		if not tournament:
			raise ValueError(f"tournament {tournament_id} may not exist.")
		if len(tournament["players"]) >= tournament["rules"]["max_player"]:
			raise ValueError(f"tournament {tournament_id} is already full.")
		# Adding user to the tournament
		tournament["players"][player_channel_name] = player_channel_name
		# Starting the game when tournament is full
		if len(tournament["players"]) == tournament["rules"]["max_player"]:
			if tournament["started"] == False:
				tournament["started"] = True
				self.start_task(tournament_id)


	def player_disconnected(self, tournament_id, player_channel_name):
		# Ending the game if it already started, or removing the tournament
		tournament = self.tournaments.get(str(tournament_id))
		if tournament and player_channel_name in tournament["players"]:
			tournament["players"][player_channel_name] = None


	def start_task(self, tournament_id):
		tournament = self.tournaments[str(tournament_id)]
		tournament["task"] = asyncio.create_task(tournament_logic(str(tournament_id)))

	def get_tournament(self, tournament_id):
		return self.tournaments.get(str(tournament_id))


	def stop_task(self, tournament_id):
		if str(tournament_id) in self.tournaments:
			task = self.tournaments[str(tournament_id)]["task"]
			if task:
				task.cancel()


tournament_manager = TournamentManager()
