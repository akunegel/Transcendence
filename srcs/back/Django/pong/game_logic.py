from channels.layers import get_channel_layer
import logging
import asyncio
import logging

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("___game_logic___")     # Créer un logger avec un nom unique


async def game_logic(room_id):
	from pong.RoomManager import room_manager  # Import here to avoid circular imports
	channel_layer = get_channel_layer()  # Get the channel layer
	logger.warning("______START OF NEW GAME_____")


	while True:
		# Example game logic (e.g., update game state)
		await asyncio.sleep(0.5)  # Simulate game tick
		room_state = room_manager.get_room(room_id)["state"]
		# Send the updated game state to all players in the room
		if channel_layer:
			await channel_layer.group_send(
				room_id,  # Group name (room_id)
				{
					"type": "update.game_state",  # Custom message type
					"state": room_state,  # Data to send
				}
			)  
