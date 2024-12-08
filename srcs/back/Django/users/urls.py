from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_player, name='register'),
    path('login/', views.login_player, name='login'),
    path('profile/', views.get_user_profile, name='profile'),
]