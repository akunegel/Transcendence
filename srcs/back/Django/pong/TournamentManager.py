from .tournament_logic import tournament_logic
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
			"rounds_winner": [],												# Keeping track of each round's winner
			"match": [],														# Storing all current matchs' information
			"started": False,													# Has the tournament started ?
			"winner": None,														# Tournament's winner
		}

	def contains(self, tour_id):
		return (str(tour_id) in self.tournaments)

	def get_tournament(self, tour_id):
		return self.tournaments.get(str(tour_id))

	def remove_tournament(self, tour_id):
		tournament = self.tournaments.get(str(tour_id))
		# Does tournament exist
		if (tournament is None):
			return
		if (tournament["task"]):
			self.stop_tournament_task(tour_id)
		del self.tournaments[str(tour_id)]

	def start_tournament_task(self, tour_id):
		tournament = self.tournaments[str(tour_id)]
		# Does tournament exist and does not have a tournament_task running ?
		if (tournament is None or tournament["started"] == True):
			return
		# Is tournament full ?
		if (len(tournament["players"]) < tournament["rules"]["max_player"]):
			return
		# Did every player choose an arena name ?
		for player in tournament["players"]:
			if (player["arena_name"] == None):
				return
		# Starting the tournament
		tournament["started"] = True
		tournament["task"] = asyncio.create_task(tournament_logic(str(tour_id)))

	def stop_tournament_task(self, tour_id):
		tournament = self.tournaments.get(str(tour_id))
		# Does tournament exist ?
		if (tournament is None):
			return
		# Stopping the associated task if there is one
		task = self.tournaments[str(tour_id)]["task"]
		if task:
			task.cancel()


tournament_manager = TournamentManager()
