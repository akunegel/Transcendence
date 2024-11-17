from django.urls import re_path
from . import consumers
from Django.consumers import ChatConsumer

websocket_urlpatterns= [
	re_path('ws/chat/', ChatConsumer.as_asgi()),
	re_path('ws/global/', consumers.GlobalConsumer.as_asgi())
]