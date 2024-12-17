import logging
import math
import random

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__bonusManager__")


async def clamp(val, minVal, maxVal):
	return (min(max(minVal, val), maxVal))

async def speedUp(var, dyn, action):
	if (action == "add"):
		# Doubling the speed, storing the old speed
		dyn["timer"] = 1
		dyn["old_speed"] = dyn["speed"]
		dyn["speed"] *= 2
	elif (action == "remove"):
		# Returning to the old speed
		dyn["speed"] = dyn["old_speed"]
		dyn["timer"] = 1

async def slowDown(var, dyn, action):
	if (action == "add"):
		# Setting the speed to the minimum, storing the old speed
		dyn["timer"] = 1
		dyn["old_speed"] = dyn["speed"]
		dyn["speed"] = 120
	elif (action == "remove"):
		# Returning to the old speed
		dyn["speed"] = dyn["old_speed"]
		dyn["timer"] = 1

async def biggerPaddle(var, dyn, action):

	if (action == "add"):
		# Doubling the player's paddle size
		dyn["timer"] = 6
		if (dyn["dir"] == 1):
			var["l_paddle_size"] = 240
			# Preventing the paddle from going out of bound
			var["l_paddle"] = await clamp(var["l_paddle"], 120, 380)
		else:
			var["r_paddle_size"] = 240
			# Preventing the paddle from going out of bound
			var["r_paddle"] = await clamp(var["r_paddle"], 120, 380)
	elif (action == "remove"):
		# Returning to default size
		var["l_paddle_size"] = 120
		var["r_paddle_size"] = 120
		dyn["timer"] = 1

async def safeWall(var, dyn, action):

	if (action == "add"):
		# Setting the paddle's size to be the max width.
		dyn["timer"] = 2
		if (dyn["dir"] == 1):
			var["l_paddle_size"] = 500
			var["l_paddle"] = 250
		else:
			var["r_paddle_size"] = 500
			var["r_paddle"] = 250
	elif (action == "remove"):
		# Returning to default size
		var["l_paddle_size"] = 120
		var["r_paddle_size"] = 120
		dyn["timer"] = 1

async def getRandomBonus():
	# Getting a random bonus value ranging from 0 to 4
	return (random.randint(0, 4))


async def bonusManager(room, type):

	dyn = room["dyn"]
	var = room["var"]

	if (type == "pos_update"):
		# Is there an available bonus ?
		if (var["available_bonus"] != "none"):
			# If yes, activating the currently available bonus
			dyn["bonus"] = var["available_bonus"]
			var["available_bonus"] = "none"
			match (dyn["bonus"]):
				case 0: # Paddle becomes double the size for the next three hits
					await biggerPaddle(var, dyn, "add")
				case 1: # Ball slow downs until next paddle hit
					await slowDown(var, dyn, "add")
				case 2: # Ball is sped up until next paddle hit
					await speedUp(var, dyn, "add")
				case 3: # Paddle becomes an impenetrable wall until it's hit
					await safeWall(var, dyn, "add")
				case 4: # Ball bounces on the box (see line 214)
					dyn["timer"] = 1

	elif (type == "hit_update"):
		dyn["timer"] -= 1
		# Did the ball do enough rebounds to add/remove a bonus ?
		if (dyn["timer"] <= 0):
			# Is a bonus currently applied ?
			if (dyn["bonus"] != "none"):

				# Removing the bonus
				match (dyn["bonus"]):
					case 0: # Paddle becomes double the size for the next three hits
						await biggerPaddle(var, dyn, "remove")
					case 1: # Ball slow downs until next paddle hit
						await slowDown(var, dyn, "remove")
					case 2: # Ball is sped up until next paddle hit
						await speedUp(var, dyn, "remove")
					case 3: # Paddle becomes an impenetrable wall until it's hit
						await safeWall(var, dyn, "remove")
					case 4: # Can't remove a bounce
						dyn["timer"] = 1
				dyn["bonus"] = 'none'
			else:
				# Adding a bonus to be available (or changing it)
				var["available_bonus"] = await getRandomBonus()
				dyn["timer"] = 1


#
# -------------------------------------------------------------------------
# Upper part is for the actual bonuses mechanics (the fun part)
# Lower part is to adapt trajectory and handle collisions with the bonus box (brain on fire part)
# -------------------------------------------------------------------------
#


async def orientation(a, b, c):
	# Calculating the "value" for orientation
	return (((b["x"] - a["x"]) * (c["y"] - a["y"])) - ((b["y"] - a["y"]) * (c["x"] - a["x"])))

async def doSegmentsIntersect(pos, obj, p1, p2):
	# Compute orientations
	val1 = await orientation(pos, obj, p1)
	val2 = await orientation(pos, obj, p2)
	val3 = await orientation(p1, p2, pos)
	val4 = await orientation(p1, p2, obj)

	# Check if endpoints of each segment are on opposite sides of the other
	return (val1 * val2 < 0) and (val3 * val4 < 0)

async def whereWillItHit(pos, p1, p2, vec, dir, incline):

	# Calculating where the ball will collide on the bonus box
	if (incline == "horizontal"):
		hitY = p1["y"]
		hitX = (dir * ((hitY - pos["y"]) / vec)) + pos["x"]
	elif (incline == "vertical"):
		hitX = p1["x"]
		hitY = (dir * ((hitX - pos["x"]) * vec)) + pos["y"]

	return ({"x": hitX, "y": hitY})

async def getDistanceTo(pos, hitPoint):

	dx = hitPoint["x"] - pos["x"]
	dy = hitPoint["y"] - pos["y"]
	# Thank you Pythagoras
	return (math.sqrt((dx * dx) + (dy * dy)))

async def handleBonusBoxCollision(room, pos, obj):

	tlc = {"x": 370, "y": 220} # top left corner
	blc = {"x": 370, "y": 280} # bottom left corner
	trc = {"x": 430, "y": 220} # top right corner
	brc = {"x": 430, "y": 280} # bottom right corner

	# No checks should be done if the ball is already within the bonus box
	if (pos["x"] >= 370 and pos["x"] <= 430 and pos["y"] >= 220 and pos["y"] <= 280):
		await bonusManager(room, "pos_update")
		return

	dir = room["dyn"]["dir"]
	vec = room["dyn"]["vec"]

	# Getting the previous vector to keep the same trajectory (see nextHit() in game_logic.py)
	if (pos["x"] != 750 and pos["x"] != 50):
		vec *= -1


	left = await doSegmentsIntersect(pos, obj, tlc, blc) # will left side be hit ?
	hitPointL = None if not left else await whereWillItHit(pos, tlc, blc, vec, dir, "vertical")
	distL = None if not left else await getDistanceTo(pos, hitPointL)

	right = await doSegmentsIntersect(pos, obj, trc, brc) # will right side be hit ?
	hitPointR = None if not right else await whereWillItHit(pos, trc, brc, vec, dir, "vertical")
	distR = None if not right else await getDistanceTo(pos, hitPointR)

	top = await doSegmentsIntersect(pos, obj, tlc, trc) # will top side be hit ?
	hitPointT = None if not top else await whereWillItHit(pos, tlc, trc, vec, dir, "horizontal")
	distT = None if not top else await getDistanceTo(pos, hitPointT)

	bottom = await doSegmentsIntersect(pos, obj, blc, brc) # will bottom side be hit ?
	hitPointB = None if not bottom else await whereWillItHit(pos, blc, brc, vec, dir, "horizontal")
	distB = None if not bottom else await getDistanceTo(pos, hitPointB)

	validDist = [distL, distR, distT, distB]
	validDist = [d for d in validDist if d != None]
	
	if validDist:
		minDist = min(validDist) # Keeping the shortest distance to the box
	else:
		return # Box wasn't in the trajectory

	# Returning to previous vector direction to avoid inversing the vector twice (see nextHit() in game_logic.py)
	if (pos["x"] != 750 and pos["x"] != 50):
		room["dyn"]["vec"] *= -1
	
	# If the current available bonus is 'solid_box' (type 4) dir or vec is reversed to simulate the box as a solid object
	if (room["var"]["available_bonus"] == 4):
		if (minDist == distL or minDist == distR):
			room["dyn"]["dir"] *= -1
		elif (minDist == distT or minDist == distB):
			room["dyn"]["vec"] *= -1

	match minDist:
		case dist if dist == distL: # Left side was hit first
			obj["x"] = hitPointL["x"]
			obj["y"] = hitPointL["y"]
		case dist if dist == distR: # Right side was hit first
			obj["x"] = hitPointR["x"]
			obj["y"] = hitPointR["y"]
		case dist if dist == distT: # Top side was hit first
			obj["x"] = hitPointT["x"]
			obj["y"] = hitPointT["y"]
		case dist if dist == distB: # Bottom side was hit first
			obj["x"] = hitPointB["x"]
			obj["y"] = hitPointB["y"]
