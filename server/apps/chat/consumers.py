import json
import base64
from django.core.files.base import ContentFile
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from apps.chat.models import ChatRoom, ChatMessage
from apps.user.models import User, OnlineUser

class ChatConsumer(AsyncWebsocketConsumer):
    async def get_user(self, user_id):
        try:
            return await database_sync_to_async(User.objects.get)(id=user_id)
        except User.DoesNotExist:
            return None

    async def get_online_users(self):
        online_users = await database_sync_to_async(lambda: list(OnlineUser.objects.select_related('user').all()))()
        return [online_user.user.id for online_user in online_users]

    async def add_online_user(self, user):
        if user:
            await database_sync_to_async(OnlineUser.objects.get_or_create)(user=user)

    async def delete_online_user(self, user):
        if user:
            await database_sync_to_async(OnlineUser.objects.filter(user=user).delete)()

    async def save_message(self, message, user_id, room_id, message_type='text', media_file=None):
        user_obj = await self.get_user(user_id)
        if not user_obj:
            return {"error": "User does not exist"}

        try:
            chat_obj = await database_sync_to_async(ChatRoom.objects.get)(roomId=room_id)
        except ChatRoom.DoesNotExist:
            return {"error": "ChatRoom does not exist"}

        data = None
        file_name = None
        if media_file:
            try:
                # Process base64 media file and decode
                format, imgstr = media_file.split(';base64,') 
                ext = format.split('/')[-1]
                file_name = f"file.{ext}"  # Generate the file name
                data = ContentFile(base64.b64decode(imgstr), name=file_name)
            except Exception as e:
                return {"error": f"Error processing media file: {str(e)}"}

        chat_message_obj = await database_sync_to_async(ChatMessage.objects.create)(
            chat=chat_obj,
            user=user_obj,
            message=message if message_type == 'text' else None,
            message_type=message_type,
            media_file=data
        )

        return {
            'action': 'message',
            'user': user_id,
            'roomId': room_id,
            'message': message,
            'message_type': message_type,
            'media_file': chat_message_obj.media_file.url if chat_message_obj.media_file else None,
            'media_file_name': file_name,
            'userImage': user_obj.image.url if user_obj.image else None,
            'userName': f"{user_obj.first_name} {user_obj.last_name}",
            'timestamp': str(chat_message_obj.timestamp)
        }

    async def send_online_user_list(self):
        online_user_list = await self.get_online_users()
        chat_message = {
            'type': 'chat_message',
            'message': {
                'action': 'onlineUser',
                'userList': online_user_list
            }
        }
        await self.channel_layer.group_send('onlineUser', chat_message)

    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['userId']
        self.user_rooms = await database_sync_to_async(lambda: list(ChatRoom.objects.filter(member=self.user_id)))()

        for room in self.user_rooms:
            await self.channel_layer.group_add(
                room.roomId,
                self.channel_name
            )

        await self.channel_layer.group_add('onlineUser', self.channel_name)

        self.user = await self.get_user(self.user_id)
        if self.user:
            await self.add_online_user(self.user)

        await self.send_online_user_list()
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'user'):
            await self.delete_online_user(self.user)

        await self.send_online_user_list()

        for room in self.user_rooms:
            await self.channel_layer.group_discard(
                room.roomId,
                self.channel_name
            )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')
        room_id = text_data_json.get('roomId')
        chat_message = {}

        if action == 'message':
            message = text_data_json.get('message', '')
            user_id = text_data_json.get('user')
            message_type = text_data_json.get('message_type', 'text')
            media_file = text_data_json.get('media_file', None)
            chat_message = await self.save_message(message, user_id, room_id, message_type, media_file)
        elif action == 'typing':
            chat_message = text_data_json

        await self.channel_layer.group_send(
            room_id,
            {
                'type': 'chat_message',
                'message': chat_message
            }
        )

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps(message))
