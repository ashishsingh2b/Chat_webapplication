# apps/user/views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.generics import CreateAPIView, ListAPIView, UpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import LimitOffsetPagination
from django.db import transaction
from apps.user.models import User
from apps.user.serializers import UserSerializer, LoginSerializer, SignupSerializer
from apps.chat.models import ChatRoom

class UserView(ListAPIView):
    queryset = User.objects.all().order_by('first_name')
    serializer_class = UserSerializer
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        exclude_users_arr = []
        try:
            exclude_users = self.request.query_params.get('exclude')
            if exclude_users:
                user_ids = exclude_users.split(',')
                for user_id in user_ids:
                    exclude_users_arr.append(int(user_id))
        except ValueError:
            return User.objects.none()
        return super().get_queryset().exclude(id__in=exclude_users_arr)

class LoginApiView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

class SignupApiView(CreateAPIView):
    permission_classes = [AllowAny]
    queryset = User.objects.all()
    serializer_class = SignupSerializer

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        user = User.objects.get(email=request.data['email'])
        chat_room = ChatRoom.objects.create(
            type="SELF", name=f"{user.first_name} {user.last_name}"
        )
        chat_room.member.add(user)
        return response

class UserProfileUpdateView(UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
