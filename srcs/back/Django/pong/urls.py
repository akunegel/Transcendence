from django.urls import path
from . import views

urlpatterns = [
	path("createCustomGame/", views.createCustomGame, name="createCustomGame"),
	path("createTournament/", views.createCustomGame, name="createTournament"),
	path("quickJoinGame/", views.quickJoinGame, name="quickJoinGame"),
	path("retrieveRoomInfo/<path:room_id>", views.retrieveRoomInfo, name="retrieveRoomInfo"),
]
