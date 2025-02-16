from django.contrib.auth.models import User
from users.serializers import PlayerSerializer
from users.models import Player, GameResult
import logging

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("__Save_Game_Log__")


##############################################################
# Save for tournaments - called in tournament_logic.py
##############################################################

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



########################################################################
# Save for two player games - called in game_logic.py & match_logic.py
########################################################################

def saveGameResults(room, p1, p2):
	p1Name = p1["username"]
	p2Name = p2["username"]

	# When playing against oneself, results are not saved
	if p1Name == p2Name:
		return

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
		if room["winner"] == p1Name:
			player1.wins += 1
			player2.loss += 1
			GameResult.objects.create(
				player = player1,
				opponent = player2,
				win = True,
			)

			GameResult.objects.create(
				player = player2,
				opponent = player1,
				win = False,
			)
		elif room["winner"] == p2Name:
			player2.wins += 1
			player1.loss += 1
			GameResult.objects.create(
				player = player2,
				opponent = player1,
				win = True,
			)

			GameResult.objects.create(
				player = player1,
				opponent = player2,
				win = False,
			)
		# Saving changes
		player1.save()
		player2.save()
		return

	except User.DoesNotExist:
		logger.warning("SaveGame: User does not exist.")
	except Player.DoesNotExist:
		logger.warning("SaveGame: Player does not exist.")
	except Exception as e:
		logger.warning(f"An unexpected error occurred: {e}")
	return