from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
    is42stud = models.BooleanField(default=False)
    first_name = None
    last_name = None