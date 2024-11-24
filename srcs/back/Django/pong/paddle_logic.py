from channels.layers import get_channel_layer
import logging
import asyncio
import logging

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("___paddle_logic___")     # Créer un logger avec un nom unique

async def update_game(channel_layer, room_id, var):

	if channel_layer:
		await channel_layer.group_send(
			room_id,  # Group name (room_id)
			{
				"type": "update.game_state",  # Custom message type
				"case": "paddle_update",
				"state": var,  # Data to send
			}
		)

async def paddle_logic(room_id):
	from pong.RoomManager import room_manager  # Imported here to avoid circular imports
	room = room_manager.get_room(room_id)
	channel_layer = get_channel_layer()
	await asyncio.sleep(3)

	while True:
		var = room["var"] # getting the room's game variables
		dyn = room["dyn"] #

		lpu = dyn["l_paddle"]["going_up"]		# Saving a copy of thoses values for the duration of a loop
		lpd = dyn["l_paddle"]["going_down"]		# to avoid them from changing before choosing if it should
		rpu = dyn["r_paddle"]["going_up"]		# move.
		rpd = dyn["r_paddle"]["going_down"]		#

		l_movement = 0							# Keeping track of the movement done on each side,
		r_movement = 0							# if none was made, no need to send updates !

		# handling player1 (left) movement
		if (lpu == True and lpd == False):
			l_movement += 0 if var["l_paddle"] <= 60 else -5
		if (lpd == True and lpu == False):
			l_movement += 0 if var["l_paddle"] >= 440 else 5
		var["l_paddle"] += l_movement

		# handling player2 (right) movement
		if (rpu == True and rpd == False):
			r_movement += 0 if var["r_paddle"] <= 60 else -5
		if (rpd == True and rpu == False):
			r_movement += 0 if var["r_paddle"] >= 440 else 5
		var["r_paddle"] += r_movement

		# if any change was made, send an update to both players
		if (l_movement != 0 or r_movement != 0):
			await update_game(channel_layer, room_id, var)

		# refresh max 61 times per seconds
		await asyncio.sleep(1 / 61)
