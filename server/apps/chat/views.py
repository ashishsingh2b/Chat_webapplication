from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.pagination import LimitOffsetPagination
from apps.chat.serializers import ChatRoomSerializer, ChatMessageSerializer
from apps.chat.models import ChatRoom, ChatMessage

class ChatRoomView(APIView):
	def get(self, request, userId):
		chatRooms = ChatRoom.objects.filter(member=userId)
		serializer = ChatRoomSerializer(
			chatRooms, many=True, context={"request": request}
		)
		return Response(serializer.data, status=status.HTTP_200_OK)

	def post(self, request):
		serializer = ChatRoomSerializer(
			data=request.data, context={"request": request}
		)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=status.HTTP_200_OK)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.generics import ListAPIView
from rest_framework.pagination import LimitOffsetPagination
from .models import ChatMessage
from .serializers import ChatMessageSerializer

class MessagesView(ListAPIView):
    serializer_class = ChatMessageSerializer
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        # Extract 'roomId' from URL parameters
        roomId = self.kwargs.get('roomId')

        # If 'roomId' is provided, filter messages accordingly
        if roomId:
            return ChatMessage.objects.filter(chat__roomId=roomId).order_by('-timestamp')
        else:
            # Return an empty queryset if 'roomId' is not provided
            return ChatMessage.objects.none()

    def get(self, request, *args, **kwargs):
        # Ensure 'roomId' is provided in the URL
        roomId = self.kwargs.get('roomId')
        if not roomId:
            return Response({"detail": "roomId parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        return super().get(request, *args, **kwargs)


	


# class MessagesView(ListAPIView):
# 	serializer_class = ChatMessageSerializer
# 	pagination_class = LimitOffsetPagination

# 	def get_queryset(self):
# 		roomId = self.kwargs['roomId']
# 		return ChatMessage.objects.\
# 			filter(chat__roomId=roomId).order_by('-timestamp')
