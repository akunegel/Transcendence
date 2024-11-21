#routing.py
from django.urls import re_path
from . import consumers
from Django.consumers import ChatConsumer
from pong.consumers import PongGameConsumer

websocket_urlpatterns= [
	re_path(r'ws/chat/', ChatConsumer.as_asgi()),
	re_path(r'ws/room/(?P<room_id>[\w-]+)/$', PongGameConsumer.as_asgi()),
	re_path(r'ws/global/', consumers.GlobalConsumer.as_asgi()),
]