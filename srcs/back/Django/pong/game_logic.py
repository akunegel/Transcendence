from channels.layers import get_channel_layer
import logging
import asyncio
import logging
import math
from datetime import datetime, timedelta

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("___game_logic___")     # Créer un logger avec un nom unique


ROOM_WIDTH = 800
ROOM_HEIGHT = 500

async def update_game(channel_layer, room_id, var, time_before_hit):

	var["time"] = time_before_hit

	if channel_layer:
		await channel_layer.group_send(
			room_id,  # Group name (room_id)
			{
				"type": "update.game_state",  # Custom message type
				"state": var,  # Data to send
			}
		)

async def nextHit(l_paddle, r_paddle, x, y, dyn):
	new_y = ROOM_HEIGHT - 10 if dyn["vec"] > 0 else 10
	new_x = (dyn["dir"] * ((new_y - y) / dyn["vec"])) + x

	if (new_x >= ROOM_WIDTH - 10 or new_x <= 10):
		new_x = ROOM_WIDTH - 10 if new_x >= ROOM_WIDTH - 10 else 10
		new_y = ((dyn["dir"] * (new_x - x)) * dyn["vec"]) + y
		dyn["dir"] *= -1
		dyn["speed"] += 40
	else:
		dyn["vec"] *= -1

	return ({"x": new_x, "y": new_y})

async def getTimeBeforeNextHit(pos, obj, speed):
	# Calculating the distance from the current position to the target position
	dx = obj["x"] - pos["x"]
	dy = obj["y"] - pos["y"]
	distance = math.sqrt((dx * dx) + (dy * dy)) # getting the distance between pos and obj
	time = distance / speed # thank you Galileo Galilei
	return (time)

async def game_logic(room_id):
	from pong.RoomManager import room_manager  # Imported here to avoid circular imports
	channel_layer = get_channel_layer()  # Get the channel layer
	room = room_manager.get_room(room_id) # getting the associated room
	time_before_hit = 3 # 3 seconds before games start
	game_started = True


	while game_started:

		var = room["var"] # getting the room's game variables
		pos = {"x": var["objx"], "y": var["objy"]} # old objective becomes current position

		await update_game(channel_layer, room_id, var, time_before_hit)
		await asyncio.sleep(time_before_hit) # waiting until the ball gets to it's objective

		obj = await nextHit(var["l_paddle"], var["r_paddle"], pos["x"], pos["y"], room["dyn"]) # determine the coordinates of the next 'rebound'
		time_before_hit = await getTimeBeforeNextHit(pos, obj, room["dyn"]["speed"]) # as a floating-point number in seconds

		var["objx"] = obj["x"]
		var["objy"] = obj["y"]
