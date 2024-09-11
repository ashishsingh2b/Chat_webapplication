from django.db import models
from django.conf import settings
from shortuuidfield import ShortUUIDField

class ChatRoom(models.Model):
    roomId = ShortUUIDField()
    type = models.CharField(max_length=10, default='DM')
    member = models.ManyToManyField(settings.AUTH_USER_MODEL)
    name = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return f'{self.roomId} -> {self.name}'

class ChatMessage(models.Model):
    MESSAGE_TYPE_CHOICES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('document', 'Document'),
        ('contact', 'Contact'),
    ]
    chat = models.ForeignKey(ChatRoom, on_delete=models.SET_NULL, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    message = models.TextField(null=True, blank=True)
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPE_CHOICES, default='text')
    media_file = models.FileField(upload_to='media_files/', null=True, blank=True)
    contact_info = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user}: {self.message[:20]}...'
