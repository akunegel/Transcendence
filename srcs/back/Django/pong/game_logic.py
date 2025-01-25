from .bonusManager import bonusManager, handleBonusBoxCollision
from .save_game import saveGameResults
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
import asyncio
import math
import logging


logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__gameLogic__")

async def disconnectPlayers(channel_layer, room_id):

	if channel_layer:
		await channel_layer.group_send(
			room_id,  # Group name (room_id)
			{
				"type": "update.disconnect",  # Sending disconnect message to room's users
			}
		)

async def updateGame(channel_layer, room_id, var, time_before_hit, case):

	var["time"] = time_before_hit

	if channel_layer:
		await channel_layer.group_send(
			room_id,  # Group name (room_id)
			{
				"type": "update.game_state",  # Custom message type
				"case": case,
				"state": var,  # Data to send
			}
		)


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


async def nextHit(x, y, room):
	dyn = room["dyn"]
	var = room["var"]

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
			# Bonus manager, removing a rebound from timer
			if (room["rules"]["add_bonus"] == True):
				await bonusManager(room, "hit_update")

		else: # Otherwise, the ball goes to score a point
			if (new_x >= 791 or new_x <= 9):
				new_x = 791.1 if new_x >= 791 else 9
				new_y = dyn["dir"] * (new_x - x) * dyn["vec"] + y
				dyn["dir"] *= -1
			else:
				dyn["vec"] *= -1


	else: # Or rebound didn't need any specific verification
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


async def playAgain(channel_layer, room_id, room, x):
	dyn = room["dyn"]
	var = room["var"]

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
	await updateGame(channel_layer, room_id, var, 0.0, "global_update")


async def isGameOver(channel_layer, room, room_id):
	max_point = room["rules"]["max_point"]
	l_score = room["var"]["l_score"]
	r_score = room["var"]["r_score"]
	winner = "draw"

	# If the time limit has been reached
	if (room["timer_is_over"] == True):
		if (l_score > r_score):
			winner = "player1"
		elif (r_score > l_score):
			winner = "player2"
		await updateGame(channel_layer, room_id, {"winner": winner}, 0.0, "end_game")
		room["winner"] = winner
		return True

	# If the point objective has been reached
	if (l_score >= max_point):
		winner = "player1"
	elif (r_score >= max_point):
		winner = "player2"
	else:
		return False
	room["winner"] = winner
	await updateGame(channel_layer, room_id, {"winner": winner, "game_started": False}, 0.0, "end_game")
	return True


async def game_logic(room_id):
	from pong.RoomManager import room_manager  # Imported here to avoid circular imports
	channel_layer = get_channel_layer()  # Get the channel layer
	room = room_manager.get_room(room_id) # getting the associated room
	time_before_hit = 3 # 3 seconds before game start
	room["var"]["game_started"] = True

	await updateGame(channel_layer, room_id, room["players"], 0, "start_game")

	while room and room["var"]["game_started"]:

		var = room["var"] # get the room's game variables
		pos = {"x": var["objx"], "y": var["objy"]} # old objective becomes current position
		obj = {"x": 400, "y": 250}

		await updateGame(channel_layer, room_id, var, time_before_hit, "ball_update")
		await asyncio.sleep(time_before_hit) # waiting until the ball gets to it's objective

		if (pos["x"] == 791.1 or pos["x"] == 9):
			await playAgain(channel_layer, room_id, room, pos["x"])
			time_before_hit = 3
			if (await isGameOver(channel_layer, room, room_id) == True):
				room["var"]["game_started"] = False
		else:
			obj = await nextHit(pos["x"], pos["y"], room) # determine the coordinates of the next 'rebound'
			if (room["rules"]["add_bonus"] == True):
				await handleBonusBoxCollision(room, pos, obj)
			time_before_hit = await getTimeBeforeNextHit(pos, obj, room["dyn"]["speed"]) # as a floating-point number in seconds
		var["objx"] = obj["x"]
		var["objy"] = obj["y"]

	await sync_to_async(saveGameResults)(room)
	await asyncio.sleep(5)
	await disconnectPlayers(channel_layer, room_id)
	room_manager.remove_room(room_id)