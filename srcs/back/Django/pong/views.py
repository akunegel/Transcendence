from django.shortcuts import render, HttpResponse
from django.http import JsonResponse
from .models import room_manager
import asyncio
import uuid



def createCustomGame(request):
	room_id = uuid.uuid4()
	# room_manager.create_room(room_id)
	# room_manager.get_room(room_id)["maxPoint"] = request.data.get('maxPoint')
	return JsonResponse(room_id, safe=False)