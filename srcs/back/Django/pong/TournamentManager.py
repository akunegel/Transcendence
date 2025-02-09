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
			"rounds_winners": [],												# Keeping track of each round's winner
			"matchs": [],														# Storing all current matchs' information
			"started": False,													# Has the tournament started ?
			"winner": None,														# Tournament's winner
		}

	def contains(self, tour_id):
		return (str(tour_id) in self.tournaments)

	def get_tournament(self, tour_id):
		return self.tournaments.get(str(tour_id))

	def stop_tournament(self, tour_id):
		tour = self.tournaments[str(tour_id)]
		# Does tournament exist ?
		if (tour is None):
			return
		# Stopping the associated task if there is one
		if tour["task"]:
			tour["task"].cancel()
		# Stopping any match task still running
		for match in tour["matchs"]:
			if match["match_task"]:
				match["match_task"].cancel()
			if match["paddle_task"]:
				match["paddle_task"].cancel()
			if match["timer_task"]:
				match["timer_task"].cancel()
		# Deleting the tournament
		del self.tournaments[str(tour_id)]

	def start_tournament_task(self, tour_id, pcn):
		tour = self.tournaments[str(tour_id)]
		# Does tournament exist and does not have a tournament_task running ?
		if (tour is None or tour["started"] == True):
			return
		# Is it really leader ?
		if (tour["players"][0]["pcn"] != pcn):
			return
		# Is tournament full ?
		if (len(tour["players"]) < tour["rules"]["max_player"]):
			return
		# Did every player choose an arena name ?
		for player in tour["players"]:
			if (player["arena_name"] == None):
				return
		# Starting the tournament
		tour["started"] = True
		tour["task"] = asyncio.create_task(tournament_logic(str(tour_id), tour))


tournament_manager = TournamentManager()
