from .bonusManager import bonusManager, handleBonusBoxCollision
from .save_game import saveGameResults
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
import asyncio
import math
import logging


logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__tournamentLogic__")

async def tournament_event(tour_id, data, case):

	channel_layer = get_channel_layer()

	if channel_layer:
		await channel_layer.group_send(
			tour_id,  # Group name
			{
				"type": "update.tournament_event",  # Custom message type
				"case": case,
				"data": data,  # Data to send
			}
		)

async def tournament_logic(tour_id):
	from pong.TournamentManager import tournament_manager  # Imported here to avoid circular imports
	tour = tournament_manager.get_tournament(tour_id)

	await tournament_event(tour_id, None, "tournament_started")



	return