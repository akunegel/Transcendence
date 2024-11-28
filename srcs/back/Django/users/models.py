from django.db import models
from django.contrib.auth.hashers import make_password

class Player(models.Model):
    username = models.CharField(max_length=30, default="DefaultUser")
    fname = models.CharField(max_length=30, default="")
    lname = models.CharField(max_length=30, default="")
    email = models.EmailField(max_length=80, default="default@default.com")
    passwd = models.CharField(max_length=128, default="")
    picture = models.URLField(max_length=200, null=True, blank=True, default="https://cdn1.iconfinder.com/data/icons/basic-ui-set-v5-user-outline/64/Account_profile_user_avatar_rounded-512.png")

    def save(self, *args, **kwargs):
        if self.passwd and not self.passwd.startswith(('pbkdf2_sha256$', 'bcrypt$', 'argon2')):
            self.passwd = make_password(self.passwd)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username