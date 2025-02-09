from channels.layers import get_channel_layer
from .bonusManager import bonusManager, handleBonusBoxCollision
import math
import asyncio
import logging

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__matchLogic__")



async def targeted_msg(pcn, type, data, case):
	channel_layer = get_channel_layer()

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



########################################################
#	Handle Player Input - Called in Tournament Consumer
########################################################

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



########################################################
#	Paddle Logic - For Tournament Logic
########################################################

# Similar to paddle_logic.py
async def paddle_logic(match):
	await asyncio.sleep(4) # 4 seconds before match starts

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
			await match_msg(match, "update.tournament_event", var, "paddle_update")

		# refresh max 61 times per seconds
		await asyncio.sleep(1 / 61)
	return



########################################################
#	Match Logic - For Tournament Logic
########################################################

async def getNewVector(side, y , var):
	paddle_y = var["r_paddle"] if side == 1 else var["l_paddle"]
	size = var["r_paddle_size"] if side == 1 else var["l_paddle_size"]
	new_vec = 2 * (abs(paddle_y - y) / size)

	# A new vector is assigned relative to the location of a hit on a paddle
	new_vec = 0.05 if new_vec < 0.05 else new_vec
	new_vec *= -1 if (paddle_y - y) > 0 else 1
	return (new_vec)


async def isPaddleAtLevel(dyn, y, var):
	side = dyn["dir"]
	paddle_y = var["r_paddle"] if side == 1 else var["l_paddle"]
	size = var["r_paddle_size"] if side == 1 else var["l_paddle_size"]

	# When at a paddle's x value, checks if the ball y value is inside the paddel's range to allow rebound
	if (y > paddle_y + ((size / 2) + 5) or y < paddle_y - ((size / 2) + 5)):
		return False # Wasn't in range
	else:
		# Adding a rebound to the player's counter
		dyn["rebound"]["right"] += 1 if side == 1 else 0
		dyn["rebound"]["left"] += 1 if side == -1 else 0
		return True # Was in range


async def nextHit(x, y, match):
	dyn = match["dyn"]
	var = match["var"]

	# Setting next hit position
	new_y = 491.1 if dyn["vec"] > 0 else 9.1
	new_x = (dyn["dir"] * ((new_y - y) / dyn["vec"])) + x

	# Checking if the ball is going past a paddle, setting the next position no further than paddle level
	if (((new_x > 750 and dyn["dir"] == 1) or (new_x < 50 and dyn["dir"] == -1)) and x < 750 and x > 50):
		new_x = 750 if new_x > 750 else 50
		new_y = dyn["dir"] * (new_x - x) * dyn["vec"] + y

	# Or, if at paddle level, checking if the ball is going to rebound or score a point
	elif (x == 750 or x == 50):
		# And if this side's paddle is in range, the ball bounces off
		if (await isPaddleAtLevel(dyn, y, var) == True):
			dyn["vec"] = await getNewVector(dyn["dir"], y, var)
			dyn["dir"] *= -1
			new_y = 491.1 if dyn["vec"] > 0 else 9.1
			new_x = dyn["dir"] * ((new_y - y) / dyn["vec"]) + x
			if (new_x >= 750 or new_x <= 50):
				new_x = 750 if new_x >= 750 else 50
				new_y = dyn["dir"] * (new_x - x) * dyn["vec"] + y
			dyn["speed"] += 60
			# Removing a rebound from bonus's manager timer
			if (match["rules"]["add_bonus"] == True):
				await bonusManager(match, "hit_update")

		else: # Otherwise, the ball goes to score a point
			if (new_x >= 791 or new_x <= 9):
				new_x = 791.1 if new_x >= 791 else 9
				new_y = dyn["dir"] * (new_x - x) * dyn["vec"] + y
				dyn["dir"] *= -1
			else:
				dyn["vec"] *= -1
	
	# Or rebound didn't need any specific verification
	else:
		if (new_x >= 750 or new_x <= 50):
			if (x > 750 or x < 50):
				new_x = 791.1 if new_x >= 750 else 9
			else:
				new_x = 750 if new_x >= 750 else 50
			new_y = dyn["dir"] * (new_x - x) * dyn["vec"] + y
			dyn["dir"] *= -1
		else:
			dyn["vec"] *= -1

	# Returns the position of the next hit
	return ({"x": new_x, "y": new_y})


async def getTimeBeforeNextHit(pos, obj, speed):
	# Calculating the distance from the current position to the target position
	dx = obj["x"] - pos["x"]
	dy = obj["y"] - pos["y"]
	distance = math.sqrt((dx * dx) + (dy * dy)) # getting the distance between pos and obj
	time = distance / speed # thank you Galileo Galilei
	return (time)


async def playAgain(match, x):
	dyn = match["dyn"]
	var = match["var"]
	# Adding score depending on the position of the ball, x=791.1 would be the right side, x=9 for left
	if (x == 791.1):
		var["l_score"] += 1
	else:
		var["r_score"] += 1
	# Resets the gamestate to keep playing (except scores)
	dyn["speed"] = 120
	dyn["vec"] = 0.005
	dyn["bonus"] = "none"
	dyn["timer"] = 3
	var["objx"] = 400
	var["objy"] = 250
	var["l_paddle"] = 250
	var["l_paddle_size"] = 120
	var["r_paddle"] = 250
	var["r_paddle_size"] = 120
	var["available_bonus"] = "none"
	var["time"] = 0.0
	await match_msg(match, "update.tournament_event", var, "ball_update")


async def isGameOver(match):
	max_point = match["rules"]["max_point"]
	l_score = match["var"]["l_score"]
	r_score = match["var"]["r_score"]
	winner = None

	if (match["timer_over"] == True):
		# If the time limit has been reached
		if (l_score > r_score):
			winner = match["p1"]["arena_name"]
		elif (l_score < r_score):
			winner = match["p2"]["arena_name"]

	# If the point objective has been reached
	if (l_score >= max_point):
		winner = match["p1"]["arena_name"]
	elif (r_score >= max_point):
		winner = match["p2"]["arena_name"]

	if (winner == None):
		return False
	match["winner"] = winner
	await match_msg(match, "update.tournament_event", {"winner": winner}, "end_game")
	return True


async def match_logic(tour_id, tour, match):

	# Send the opponent's ids in this match to both players
	await match_msg(match, "update.tournament_event", match["pids"], "match_start")
	await asyncio.sleep(1) # Making sure the PongMatch display has time to initialize
	await match_msg(match, "update.tournament_event", None, "begin_countdown")
	time_before_hit = 4 # 4 seconds before game start

	while match["started"] == True:

		var = match["var"] # get the match's game variables
		pos = {"x": var["objx"], "y": var["objy"]} # old objective becomes current position
		obj = {"x": 400, "y": 250}

		var["time"] = time_before_hit
		await match_msg(match, "update.tournament_event", var, "ball_update")
		await asyncio.sleep(time_before_hit) # waiting until the ball gets to it's objective

		if (pos["x"] == 791.1 or pos["x"] == 9):
			await playAgain(match, pos["x"])
			time_before_hit = 3
			if (await isGameOver(match) == True):
				break
		else:
			obj = await nextHit(pos["x"], pos["y"], match) # determine the coordinates of the next 'rebound'
			if (match["rules"]["add_bonus"] == True):
				await handleBonusBoxCollision(match, pos, obj)
			time_before_hit = await getTimeBeforeNextHit(pos, obj, match["dyn"]["speed"]) # as a floating-point number in seconds
		var["objx"] = obj["x"]
		var["objy"] = obj["y"]


	await asyncio.sleep(5)
	# await broadcast_match_winners(tour_id, match)
	await match_msg(match, "update.tournament_event", None, "go_to_graph")
	match["started"] = False
	return