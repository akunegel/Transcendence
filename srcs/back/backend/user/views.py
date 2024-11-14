from django.shortcuts import render
from .models import User
from .serializers import UserSerializer, CreatUserSerializer
from rest_framework import generics
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
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
	# 	logger.info("Received data: %s", request.data)
	# 	myData = request.data

	# 	myUsername = myData.get("username")
	# 	myPassword = myData.get("password")

	# 	# Check if the user already exists
	# 	if User.objects.filter(username=myUsername).exists():
	# 		logger.warning("Username already taken: %s", myUsername)
	# 		return JsonResponse({"error": "Username already exists"}, status=400)

	# 	# Create the new user with hashed password
	# 	try:
	# 		user = User(username=myUsername)
	# 		user.set_password(myPassword)  # Properly hash the password
	# 		user.save()

	# 		logger.info("User created successfully: %s", myUsername)
	# 		return JsonResponse({"message": "User created successfully"}, status=201)
		
	# 	except Exception as e:
	# 		logger.error("Failed to create user: %s", e)
	# 		return JsonResponse({"error": "Failed to create user"}, status=500)


def getUser(request):
	myPath = request.build_absolute_uri()
	token_string = myPath.split("?")[1]

	try:
		token = AccessToken(token_string)
		token.verify()
		user_id = token['user_id']
		myUser = User.objects.get(id=user_id)
		myUserSer = UserSerializer(myUser)
		myUserFinal = myUserSer.data
	except TokenError as e:
		return JsonResponse({"error": "Invalid or expired token"}, status=401)

	return JsonResponse(myUserFinal, safe=False)
