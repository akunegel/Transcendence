from pong.RoomManager import room_manager
from django.shortcuts import render, HttpResponse
from django.http import JsonResponse
import json
import uuid
import logging

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("createCustomGame")     # Créer un logger avec un nom unique

# Creating a new custom room as requested by user
def createCustomGame(request):
	room_id = uuid.uuid4()
	room_manager.create_room(room_id)

	try: # Trying to retrieve custom game info
		data = json.loads(request.body)
		add_bonus = data.get("addBonus")
		is_private = data.get("isPrivate")
		has_time_limit = data.get("hasTimeLimit")
		max_time = data.get("maxTime")
		max_point = data.get("maxPoint")

		room_manager.get_room(room_id)["rules"] = {
			"add_bonus": add_bonus,
			"is_private": is_private,
			"has_time_limit": has_time_limit,
			"max_time": max_time,
			"max_point": max_point
		}
		return JsonResponse({"room_id": room_id}, status=200)

	except json.JSONDecodeError as e:
		logger.log(f"Failed to parse JSON: {e}")
		room_manager.remove_room(room_id)
		return JsonResponse({"error": "Invalid JSON data"}, status=400)


# Quick-Join returns the room_id of the first non-private room found in the list of current rooms
def quickJoinGame(request):
	rooms = room_manager.rooms
	for i in rooms:
		if rooms[i]["rules"]["is_private"] == False:
			if rooms[i]["state"]["player2"] == None:
				return JsonResponse({"room_id": rooms[i]["id"]}, status=200)
	return JsonResponse({"room_id": "None"}, status=200)

def retrieveRoomInfo(request, room_id=""):
	room = room_manager.get_room(room_id)
	if room:
		return JsonResponse({"data": room["rules"]}, status=200)
	else:
		return JsonResponse({"error": "Cannot find room"}, status=400)