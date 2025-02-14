from pathlib import Path
from datetime import timedelta
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-xk(6rx!re4qn*ci9jo@ae(x4dv2e%6w9i+tg9x0i_s_v66nkos'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEBUG = True

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    'channels_redis',
    'channels',
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.staticfiles',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',

    'users',
    'chat',
    'pong',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'Django.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=90),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_HEADER_TYPES': ('Bearer',),
}

ASGI_APPLICATION = 'Django.asgi.application'

WSGI_APPLICATION = 'Django.wsgi.application'

DATABASES = {
	'default': {
		'ENGINE': 'django.db.backends.postgresql',
		'NAME': os.getenv('POSTGRES_DB'),
		'USER': os.getenv('POSTGRES_USER'),
		'PASSWORD': os.getenv('POSTGRES_PASSWORD'),
		'HOST': os.getenv('POSTGRES_HOST'),
		'PORT': os.getenv('POSTGRES_PORT'),
	}
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


CORS_ALLOW_ALL_ORIGINS = True
#pour des raison de securite, a l'avenir, penser a chager ce qu'il y a en bas la
CORS_ALLOW_CREDENTIALS = True

LOGGING = {
	'version': 1,
	'disable_existing_loggers': False,
	'handlers': {
		'console': {
			'level': 'INFO',
			'class': 'logging.StreamHandler',
		},
	},
	'loggers': {
		'django': {
			'handlers': ['console'],
			'level': 'INFO',
			'propagate': True,
		},
		'django.db.backends': {
			'handlers': ['console'],
			'level': 'INFO',
			'propagate': False,
		},
		'pong': {
			'handlers': ['console'],
			'level': 'INFO',
			'propagate': True,
		},
		'chat': {
			'handlers': ['console'],
			'level': 'INFO',
			'propagate': True,
		}
		# Add other apps here if needed
	},
}

CHANNEL_LAYERS = {
	'default': {
		'BACKEND': 'channels_redis.core.RedisChannelLayer',
		'CONFIG': {
			"hosts": [('redis', 6379)],
		},
	},
}

CORS_ALLOWED_ORIGINS = [
    "https://localhost:9443",
]

APPEND_SLASH = True

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
