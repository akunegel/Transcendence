from .bonusManager import bonusManager, handleBonusBoxCollision
from .save_game import saveGameResults
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from .match_logic import match_logic
from .match_logic import paddle_logic
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

	p = 1
	for i in range(amount):
		tour["matchs"].append({
			"match_id": i,
			"rules": tour["rules"],
			"p1": players[p],
			"p2": players[p + 1],
			"started": False,
			"winner": None,
			"match_task": None,
			"paddle_task": None,
		})
		p += 2
	
	for match in tour["matchs"]:
		match["match_task"] = asyncio.create_task(match_logic(match))
		match["paddle_task"] = asyncio.create_task(paddle_logic(match))


async def tournament_logic(tour_id):
	from pong.TournamentManager import tournament_manager  # Imported here to avoid circular imports
	from .consumers import broadcast_players_info
	tour = tournament_manager.get_tournament(tour_id)
	max_player = tour["rules"]["max_player"]
	match_amount_divider = 2 # Depending on the round and max_player, this will determine how many rooms must be created
	players_left = tour["players"].copy()

	random.shuffle(tour["players"]) # Randomize matchmaking
	await share_event(tour_id, "update.tournament_event", None, "tournament_started")
	await broadcast_players_info(tour_id, tour)

	while (tour["started"]):
		await generate_match_rooms(tour_id, tour, players_left, max_player / match_amount_divider)
		match_amount_divider *= 2
		# await send_room_ids()
		await share_event(tour_id, "update.tournament_event", None, "start_new_round")
		# while (all_match_finished == False):
			# await asyncio.sleep(5)
		# end_matchs_tasks()
		# await send_match_winners()
		await share_event(tour_id, "update.tournament_event", None, "go_to_graph")

	return