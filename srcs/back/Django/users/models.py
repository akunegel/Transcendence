from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

class Player(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, default="")
    profile_picture = models.URLField(blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True, default="")
    last_name = models.CharField(max_length=100, blank=True, default="")
    email = models.EmailField(blank=True, default="")