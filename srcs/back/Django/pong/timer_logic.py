import asyncio
import logging

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("___timer_logic___")     # Créer un logger avec un nom unique


async def timer_logic(room_id):
	from pong.RoomManager import room_manager  # Imported here to avoid circular imports
	room = room_manager.get_room(room_id)
	max_time = room["rules"]["max_time"]
	await asyncio.sleep(3) # 5 seconds before game start

	# Waiting for the set duration of the game
	await asyncio.sleep(max_time * 60)

	# Informing game_logic when timer is over
	room["timer_is_over"] = True
