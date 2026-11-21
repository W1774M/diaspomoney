#!/bin/bash
# Script pour démarrer l'environnement de développement

set -e

echo "🚀 Démarrage de l'environnement de développement..."

# Créer le réseau Traefik s'il n'existe pas
if ! docker network ls | grep -q "traefik"; then
    echo "📡 Création du réseau Traefik..."
    docker-compose -f docker-compose.traefik.yml up -d traefik
    sleep 5
fi

# Démarrer l'environnement dev
echo "🔧 Démarrage des services dev..."
docker-compose -f docker-compose.traefik.yml -f docker-compose.dev.yml up -d

# Connecter Traefik au réseau dev s'il n'y est pas déjà
if ! docker network inspect diaspomoney-dev 2>/dev/null | grep -q "traefik"; then
    echo "🔗 Connexion de Traefik au réseau dev..."
    docker network connect diaspomoney-dev traefik 2>/dev/null || true
fi

echo "✅ Environnement de développement démarré !"
echo ""
echo "📋 Services disponibles :"
echo "  - Application: https://dev.diaspomoney.fr"
echo "  - Mongo Express: https://mongo.dev.diaspomoney.fr"
echo "  - Traefik Dashboard: https://dashboard.diaspomoney.fr"
echo ""
echo "📊 Voir les logs: docker-compose -f docker-compose.traefik.yml -f docker-compose.dev.yml logs -f"

