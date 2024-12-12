from django.urls import path
from . import views
from .views import MyTokenObtainPairView

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_view'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.RegisterPlayer.as_view(), name='register_player'),
    path('profile/', views.getPlayerProfile, name='get_player_profile'),
    path('profile/update/', views.updatePlayerProfile, name='update_player_profile'),
    path('friends/', views.get_friends, name='get_friends'),
    path('friends/requests/', views.get_friend_requests, name='get_friend_requests'),
    path('friends/send-request/', views.send_friend_request, name='send_friend_request'),
    path('friends/accept-request/', views.accept_friend_request, name='accept_friend_request'),
    path('friends/remove/', views.remove_friend, name='remove_friend'),
]