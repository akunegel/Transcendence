from .bonusManager import bonusManager, handleBonusBoxCollision
from .save_game import saveGameResults
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from .match_logic import match_logic, paddle_logic, targeted_msg
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

async def broadcast_tournament_ending(tour, winner_pcn):
	for player in tour["players"]:
		if (player["pcn"] != winner_pcn):
			await targeted_msg(player["pcn"], "update.tournament_event", "Better luck next time...", "tournament_ended")
	await targeted_msg(winner_pcn, "update.tournament_event", "You Win This Tournament !", "tournament_ended")
	return

async def generate_match_rooms(tour_id, tour, players, amount):

	p = 0
	for i in range(amount):
		tour["matchs"].append({
			"match_id": i,
			"rules": tour["rules"],
			"p1": players[p],
			"p2": players[p + 1],
			"pids": {"p1": players[p]["id"], "p2": players[p + 1]["id"]},
			"started": True,
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
		match["match_task"] = asyncio.create_task(match_logic(tour_id, tour, match))
		match["paddle_task"] = asyncio.create_task(paddle_logic(match))


async def are_all_match_finished(tour):
	# Checks if any match is still ongoing
	for match in tour["matchs"]:
		if (match["started"] == True):
			return False
	return True


async def end_matchs_tasks(tour):
	# Stops and resets every tasks used in the round
	for match in tour["matchs"]:
		if (match["match_task"]):
			match["match_task"].cancel()
			match["match_task"] = None
		if (match["paddle_task"]):
			match["paddle_task"].cancel()
			match["paddle_task"] = None
		if (match["timer_task"]):
			match["timer_task"].cancel()
			match["timer_task"] = None
	# Deletes every matchs stored in the array
	tour["matchs"].clear()


async def format_round_results(matchs):
	# Stores all the winners' ids in an array
	winners = []
	for match in matchs:
		p1 = match["p1"]
		p2 = match["p2"]
		winner_id = p1["id"] if match["winner"] == p1["arena_name"] else p2["id"]
		winners.append(winner_id)
	return {"winners": winners}


async def keep_round_winners(players_left, winners):
	# Removing players if their ids is not in the winners array
	for player in players_left:
		if (player["id"] not in winners):
			players_left.remove(player)


async def tournament_logic(tour_id, tour):
	from .consumers import broadcast_players_info

	max_player = tour["rules"]["max_player"]
	random.shuffle(tour["players"]) # Randomize matchmaking
	players_left = tour["players"].copy() # Keeping track all the players still in competition
	results = []
	round_number = 1

	await share_event(tour_id, "update.tournament_event", None, "tournament_started")
	await broadcast_players_info(tour_id, tour)

	while (tour["started"]):
		# Inform players that the next round is about to start 
		await share_event(tour_id, "update.tournament_event", round_number, "round_starting")
		await asyncio.sleep(10)
		# Depending on the round and max_player, the right amount of matchs will be generated and assigned
		await generate_match_rooms(tour_id, tour, players_left, int(max_player / pow(2, round_number)))
		# Checking if the round is over every 5 seconds
		while (await are_all_match_finished(tour) == False):
			await asyncio.sleep(5)
		round_number += 1
		# Saving the results of this match, broadcasting them to the players
		round_winners = await format_round_results(tour["matchs"])
		results.append(round_winners)
		# Stopping every tasks used in this round
		await end_matchs_tasks(tour)
		await share_event(tour_id, "update.tournament_event", results, "round_results")
		# Keeping only the players specified in the winners array for the next round
		await keep_round_winners(players_left, round_winners)
		if (len(players_left) == 1):
			break

	await broadcast_tournament_ending(tour, players_left[0]["pcn"])
	await asyncio.sleep(15)
	# saveTournamentsResults()
	await share_event(tour_id, "update.disconnect", None, None)

	return