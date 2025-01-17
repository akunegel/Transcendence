from users.models import Player
import logging

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__Save_Game_Log__")


def saveGameResults(room):
	players = room["players"]
	p1Name = room["players"]["one"]["name"]
	p1 = Player.objects.get(user=p1Name)

	logger.warning(str(p1.user))
	logger.warning("----------------------------------")

	return