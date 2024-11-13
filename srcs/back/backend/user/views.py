from django.shortcuts import render
from .models import User
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework.permissions import AllowAny
from django.http import JsonResponse
from rest_framework import generics
from rest_framework.views import APIView
from .serializers import UserSerializer, CreatUserSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.http import JsonResponse
import logging
logger = logging.getLogger(__name__)
# Create your views here.

class CreatUserView(generics.CreateAPIView):
	queryset = User.objects.all()#pour regarder tout les objets de ma classe pour ne pas cree un user qui existe deja
	serializer_class = CreatUserSerializer#dire a la "view" quel genre de donne on a besooin pour faire un nouveau user
	permission_classes = [AllowAny]#determine qui a le droit d'avoir accee a cette "view"

	# def post(self, request, *args, **kwargs):
	#     logger.info(request.data)
	#     myData = request.data

	#     myUsername = myData.get("username")
	#     myPassword = myData.get("password")

	#     myUserData = {
	#         "username": myUsername,
	#         "password": myPassword
	#     }

	#     myUserToSave = UserSerializer(data=myUserData)

	#     if myUserToSave.is_valid():
	#         myUserToSave.save()
		
	#     logger.info("LE USER EST CREEE")
	#     return JsonResponse({"mabite": "0"}, safe=False)

def getUser(request):
	myPath = request.build_absolute_uri()

	token_string = myPath.split("?")[1]
	token = AccessToken(token_string)

	user_id = token['user_id']
	myUser = User.objects.get(id=user_id)
	myUserSer = UserSerializer(myUser)
	myUserFinal = myUserSer.data

	return JsonResponse(myUserFinal, safe=False)
