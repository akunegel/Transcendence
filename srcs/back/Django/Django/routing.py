#routing.py
from django.urls import re_path
from . import consumers
from Django.consumers import ChatConsumer
from pong.consumers import PongGameConsumer
from pong.consumers import TournamentConsumer
from users.consumers import OnlineStatusConsumer

websocket_urlpatterns= [
	re_path(r'ws/chat/', ChatConsumer.as_asgi()),
	re_path(r'ws/room/$', PongGameConsumer.as_asgi()),
	re_path(r'ws/tournament/$', TournamentConsumer.as_asgi()),
	re_path(r'ws/global/', consumers.GlobalConsumer.as_asgi()),
    re_path(r'ws/online/$', OnlineStatusConsumer.as_asgi()),
]