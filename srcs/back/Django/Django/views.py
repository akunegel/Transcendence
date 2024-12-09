# import requests
# import os
# import secrets
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import AllowAny
# from rest_framework.response import Response
# from rest_framework import status
# from rest_framework_simplejwt.tokens import RefreshToken
# from users.models import Player
#
# @api_view(['GET'])
# @permission_classes([AllowAny])
# def forty_two_oauth(request):
#     code = request.GET.get('code')
#
#     if not code:
#         return Response({'error': 'No authorization code provided'}, status=status.HTTP_400_BAD_REQUEST)
#     client_id = os.getenv('FORTYTWO_CLIENT_ID')
#     client_secret = os.getenv('FORTYTWO_CLIENT_SECRET')
#
#     if not client_id or not client_secret:
#         return Response({'error': 'OAuth configuration error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#
#     token_url = 'https://api.intra.42.fr/oauth/token'
#     token_data = {
#         'grant_type': 'authorization_code',
#         'client_id': client_id,
#         'client_secret': client_secret,
#         'code': code,
#         'redirect_uri': 'https://localhost:9443/42connect'
#     }
#
#     try:
#
#         token_response = requests.post(token_url, data=token_data)
#
#         if token_response.status_code != 200:
#             return Response({
#                 'error': 'OAuth token request failed',
#                 'details': token_response.text
#             }, status=status.HTTP_400_BAD_REQUEST)
#
#         token_json = token_response.json()
#         access_token = token_json.get('access_token')
#
#         if not access_token:
#             return Response({'error': 'No access token received'}, status=status.HTTP_400_BAD_REQUEST)
#
#         user_info_url = 'https://api.intra.42.fr/v2/me'
#         headers = {'Authorization': f'Bearer {access_token}'}
#
#         user_response = requests.get(user_info_url, headers=headers)
#         user_response.raise_for_status()
#
#         user_data = user_response.json()
#         player, created = Player.objects.get_or_create(
#             username=user_data['login'],
#             defaults={
#                 'fname': user_data.get('first_name', ''),
#                 'lname': user_data.get('last_name', ''),
#                 'email': user_data.get('email', ''),
#                 'passwd': secrets.token_urlsafe(16),
#                 'picture': user_data.get('image', {}).get('link', '')
#             }
#         )
#
#         refresh = RefreshToken.for_user(player)
#         return Response({
#             'refresh': str(refresh),
#             'access': str(refresh.access_token),
#             'username': player.username
#         })
#
#     except requests.RequestException as e:
#         return Response({
#             'error': 'OAuth authentication failed',
#             'details': str(e)
#         }, status=status.HTTP_400_BAD_REQUEST)
#
#     except Exception as e:
#         return Response({
#             'error': 'Unexpected error occurred',
#             'details': str(e)
#         }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)