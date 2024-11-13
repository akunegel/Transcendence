# Emplacement du fichier docker-compose.yml
DOCKER_COMPOSE_FILE = srcs/docker-compose.yml


sup:
	sudo docker-compose -f $(DOCKER_COMPOSE_FILE) up --build

sdown:
	sudo docker-compose -f $(DOCKER_COMPOSE_FILE) down

# Commande pour démarrer les services avec Docker Compose
up:
	docker-compose -f $(DOCKER_COMPOSE_FILE) up

# Commande pour arrêter et supprimer les containers
down:
	docker-compose -f $(DOCKER_COMPOSE_FILE) down

# Commande pour reconstruire les images et relancer les containers
build:
	docker-compose -f $(DOCKER_COMPOSE_FILE) up --build

# Commande pour afficher les logs des services
logs:
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f

# Commande pour exécuter une commande dans un container en particulier
exec:
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec $(container_name) $(command)

# Commande pour stopper les services et nettoyer les volumes (optionnel)
clean:
	docker-compose -f $(DOCKER_COMPOSE_FILE) down --volumes

# Commande pour vérifier les services en cours
status:
	docker-compose -f $(DOCKER_COMPOSE_FILE) ps

