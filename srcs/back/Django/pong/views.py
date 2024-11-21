from django.shortcuts import render, HttpResponse
from django.http import JsonResponse
from pong.RoomManager import room_manager
import uuid
import logging

logging.basicConfig(level=logging.WARNING)  # Définir le niveau des logs
logger = logging.getLogger("createCustomGame")     # Créer un logger avec un nom unique



def createCustomGame(request):
	room_id = uuid.uuid4()
	room_manager.create_room(room_id)
	logger.warning(f"_____Created room with ID: '{room_id}' Current rooms: {room_manager.rooms.keys()}_____")
	return JsonResponse(room_id, safe=False)
