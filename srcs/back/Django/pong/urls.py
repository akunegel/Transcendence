from django.urls import path
from . import views

urlpatterns = [
	path("createCustomGame/", views.createCustomGame, name="createCustomGame"),
	path("createTournament/", views.createTournament, name="createTournament"),
	path("quickJoinGame/", views.quickJoinGame, name="quickJoinGame"),
	path("retrieveRoomInfo/<path:room_id>", views.retrieveRoomInfo, name="retrieveRoomInfo"),
	path("retrieveTournamentInfo/<path:tour_id>", views.retrieveTournamentInfo, name="retrieveRoomInfo"),
]
