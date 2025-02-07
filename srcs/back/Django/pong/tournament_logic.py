from .bonusManager import bonusManager, handleBonusBoxCollision
from .save_game import saveGameResults
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from .match_logic import match_logic, paddle_logic
import asyncio
import math
import logging
import random


logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__tournamentLogic__")

async def share_event(tour_id, type, data, case):

	channel_layer = get_channel_layer()

	if channel_layer:
		await channel_layer.group_send(
			tour_id,  # Group name
			{
				"type": type,  # Custom message type
				"case": case,
				"data": data,  # Data to send
			}
		)

async def generate_match_rooms(tour_id, tour, players, amount):

	p = 0
	for i in range(amount):
		tour["matchs"].append({
			"match_id": i,
			"rules": tour["rules"],
			"p1": players[p],
			"p2": players[p + 1],
			"pids": {"p1": players[p]["id"], "p2": players[p + 1]["id"]},
			"started": False,
			"winner": None,
			"match_task": None,
			"paddle_task": None,
			"timer_task": None,
			"timer_over" : False,
			"l_paddle_up": False,
			"l_paddle_down": False,
			"r_paddle_up": False,
			"r_paddle_down": False,
			"var": {"time": 0.0,											# Initialize sendable game variables
					"objx": 400, "objy": 250, 								# -
					"l_score": 0, "r_score": 0,								# -
					"l_paddle": 250, "r_paddle": 250,						# -
					"l_paddle_size": 120, "r_paddle_size": 120,				# -
					"available_bonus": "none"},								# -
			"dyn": {"dir": 1, "vec": 0.005, "speed": 120,					# Initialize local game variables (dynamics)
					"bonus": "none", "timer": 3, "old_speed": 120,			# -
					"rebound": {"left": 0, "right": 0}},					# - Amount of rebounds made on paddles
		})
		p += 2

	for match in tour["matchs"]:
		match["match_task"] = asyncio.create_task(match_logic(tour_id, match))
		match["paddle_task"] = asyncio.create_task(paddle_logic(match))


async def tournament_logic(tour_id, tour):
	from .consumers import broadcast_players_info

	max_player = tour["rules"]["max_player"]
	match_amount_divider = 2 # Depending on the round and max_player, this will determine how many rooms must be created
	players_left = tour["players"].copy() # Keeping track all the players still in competition
	random.shuffle(tour["players"]) # Randomize matchmaking

	await share_event(tour_id, "update.tournament_event", None, "tournament_started")
	await broadcast_players_info(tour_id, tour)

	await generate_match_rooms(tour_id, tour, tour["players"], int(max_player / match_amount_divider))
	match_amount_divider *= 2
	while (tour["started"]):
		await asyncio.sleep(10)
		# while (all_match_finished == False):
			# await asyncio.sleep(5)
		# end_matchs_tasks()

	return