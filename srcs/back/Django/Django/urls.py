from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
	path('pong/', include("pong.urls")),
    path('user/', include('users.urls')),
    path('oauth/42/', views.forty_two_oauth, name='forty_two_oauth'),
]