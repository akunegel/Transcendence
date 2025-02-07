from channels.layers import get_channel_layer
import asyncio
import logging

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__matchLogic__")


###################################################
#	Handle Player Input - Called in Tournament Consumer
###################################################

# Keeps track on which keys the player is pressing down
async def handlePlayerInput(tour, channel_name, type):
	for match in tour["matchs"]:
		if match["started"] and match["p1"]["pcn"] == channel_name:
			match type:
				case 'arrow_up_pressed':
					match["l_paddle_up"] = True
				case 'arrow_up_unpressed':
					match["l_paddle_up"] = False
				case 'arrow_down_pressed':
					match["l_paddle_down"] = True
				case 'arrow_down_unpressed':
					match["l_paddle_down"] = False
			break
		elif match["started"] and match["p2"]["pcn"] == channel_name:
			match type:
				case 'arrow_up_pressed':
					match["r_paddle_up"] = True
				case 'arrow_up_unpressed':
					match["r_paddle_up"] = False
				case 'arrow_down_pressed':
					match["r_paddle_down"] = True
				case 'arrow_down_unpressed':
					match["r_paddle_down"] = False
			break

async def targeted_msg(pcn, type, data, case):
	channel_layer = get_channel_layer()

	logger.warning(f"--- TRYING TO SEND TARGETED MESSAGE \n{pcn}\nTYPE={type}\nCASE={case}")

	if channel_layer and pcn:
		await channel_layer.send(
			pcn,  # Player Channel Name
			{
				"type": type, # Custom message type
				"case": case, # Case identifier
				"data": data, # Data to send
			}
		)

async def match_msg(match, type, data, case):
	await targeted_msg(match["p1"]["pcn"], type, data, case)
	await targeted_msg(match["p2"]["pcn"], type, data, case)



###################################################
#	Paddle Logic - For Tournament Logic
###################################################

# Similar to paddle_logic.py
async def paddle_logic(match):
	await asyncio.sleep(3) # 3 seconds before match starts

	while match["started"]:

		var = match["var"]

		lpu = match["l_paddle_up"]		# Saving a copy of thoses values for the duration of a loop
		lpd = match["l_paddle_down"]	# to avoid them from changing.
		rpu = match["r_paddle_up"]		#
		rpd = match["r_paddle_down"]	#

		l_movement = 0					# Keeping track of the movement done on each side,
		r_movement = 0					# if none was made, no need to send updates

		# handling p1 (left) movement
		if (lpu == True and lpd == False):
			l_movement += 0 if var["l_paddle"] <= (var["l_paddle_size"] / 2) else -5
		if (lpd == True and lpu == False):
			l_movement += 0 if var["l_paddle"] >= 500 - (var["l_paddle_size"] / 2) else 5
		var["l_paddle"] += l_movement

		# handling p2 (right) movement
		if (rpu == True and rpd == False):
			r_movement += 0 if var["r_paddle"] <= (var["r_paddle_size"] / 2) else -5
		if (rpd == True and rpu == False):
			r_movement += 0 if var["r_paddle"] >= 500 - (var["r_paddle_size"] / 2) else 5
		var["r_paddle"] += r_movement

		# if any change was made, send an update to both players
		if (l_movement != 0 or r_movement != 0):
			await match_msg(match, "tournament_update", var, "paddle_update")

		# refresh max 61 times per seconds
		await asyncio.sleep(1 / 61)
	return



###################################################
#	Match Logic - For Tournament Logic
###################################################

async def match_logic(tour_id, match):

	match["started"] = True
	# Send the ids of the opponents in this match, starts 3sec timer
	await match_msg(match, "update.tournament_event", match["pids"], "match_start")
	await asyncio.sleep(3)
	
	while True:
		await asyncio.sleep(5)


	# await broadcast_match_winners(tour_id, match)
	await match_msg(match, "update.tournament_event", None, "go_to_graph")
	return