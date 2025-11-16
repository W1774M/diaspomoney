#!/bin/bash
# Script pour démarrer l'environnement de production

set -e

echo "🚀 Démarrage de l'environnement de production..."

# Créer le réseau Traefik s'il n'existe pas
if ! docker network ls | grep -q "traefik"; then
    echo "📡 Création du réseau Traefik..."
    docker-compose -f docker-compose.traefik.yml up -d traefik
    sleep 5
fi

# Démarrer l'environnement prod
echo "🔧 Démarrage des services prod..."
docker-compose -f docker-compose.traefik.yml -f docker-compose.prod.yml up -d

# Connecter Traefik au réseau prod s'il n'y est pas déjà
if ! docker network inspect diaspomoney-prod 2>/dev/null | grep -q "traefik"; then
    echo "🔗 Connexion de Traefik au réseau prod..."
    docker network connect diaspomoney-prod traefik 2>/dev/null || true
fi

echo "✅ Environnement de production démarré !"
echo ""
echo "📋 Services disponibles :"
echo "  - Application: https://app.diaspomoney.fr"
echo "  - Mongo Express: https://mongo.diaspomoney.fr"
echo "  - Traefik Dashboard: https://dashboard.diaspomoney.fr"
echo ""
echo "📊 Voir les logs: docker-compose -f docker-compose.traefik.yml -f docker-compose.prod.yml logs -f"

