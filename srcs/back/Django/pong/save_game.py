from django.contrib.auth.models import User
from users.serializers import PlayerSerializer
from users.models import Player
import logging

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__Save_Game_Log__")

def saveTournamentResults(player):
	pName = player["username"]

	try:
		# Fetch the User object using the username
		user = User.objects.get(username=pName)
		# Fetch the Player object using the User object
		db_player = Player.objects.get(user=user)
		# Incrementing tournament won
		db_player.tr_wins += 1
		# Saving changes
		db_player.save()

		return
	except User.DoesNotExist:
		logger.error("SaveGame: User does not exist.")
	except Player.DoesNotExist:
		logger.error("SaveGame: Player does not exist.")
	except Exception as e:
		logger.error(f"An unexpected error occurred: {e}")
	return


def saveGameResults(room):
	p1Name = room["players"]["one"]["name"]
	p2Name = room["players"]["two"]["name"]

	try:
		# Fetch the User object using the username
		user1 = User.objects.get(username=p1Name)
		user2 = User.objects.get(username=p2Name)
		# Fetch the Player object using the User object
		player1 = Player.objects.get(user=user1)
		player2 = Player.objects.get(user=user2)

		# Adding a game played for both players
		player1.nb_games += 1
		player2.nb_games += 1
		# Adding to the players' rebound counters
		player1.rb += room["dyn"]["rebound"]["left"]
		player2.rb += room["dyn"]["rebound"]["right"]
		# Incrementing wins or loss for both players
		if p1Name == p2Name:
			return # When playing against oneself, results are not saved
		if room["winner"] == "player1":
			player1.wins += 1
			player2.loss += 1
		elif room["winner"] == "player2":
			player2.wins += 1
			player1.loss += 1
		# Saving changes
		player1.save()
		player2.save()

		return
	except User.DoesNotExist:
		logger.error("SaveGame: User does not exist.")
	except Player.DoesNotExist:
		logger.error("SaveGame: Player does not exist.")
	except Exception as e:
		logger.error(f"An unexpected error occurred: {e}")
	return