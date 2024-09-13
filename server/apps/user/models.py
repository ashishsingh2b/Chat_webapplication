from django.db import models
from django.contrib.auth.models import AbstractUser
from shortuuidfield import ShortUUIDField

class User(AbstractUser):
    userId = ShortUUIDField()
    image = models.ImageField(upload_to="user", blank=True, null=True)  # Image field for profile picture
    # Additional fields can be added here
    bio = models.TextField(blank=True, null=True)  # Field for user bio
    phone_number = models.CharField(max_length=15, blank=True, null=True)  

class OnlineUser(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)

	def __str__(self):
		return self.user.username
