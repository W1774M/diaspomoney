#!/bin/bash

set -e

echo "🚀 Démarrage du déploiement DiaspoMoney..."

# Vérification des variables d'environnement
if [ ! -f .env ]; then
    echo "❌ Fichier .env manquant"
    exit 1
fi

# Chargement des variables
source .env

# Vérification des variables critiques
# required_vars=("MONGODB_URI" "MONGODB_DB_NAME" "REDIS_URL" "REDIS_PASSWORD" "GRAFANA_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Variable $var manquante dans .env"
        exit 1
    fi
done

# Arrêt des conteneurs existants
echo "📦 Arrêt des conteneurs existants..."
docker-compose down

# Nettoyage des images inutilisées
echo "🧹 Nettoyage..."
docker system prune -f

# Construction et démarrage
echo "🏗️  Construction des images..."
docker-compose build --no-cache app

echo "▶️  Démarrage des services..."
docker-compose up -d

# Attente du démarrage
echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérification de l'état
echo "✅ Vérification de l'état des services..."
docker-compose ps

# Test de santé
echo "🏥 Test de santé..."
curl -f https://app.diaspomoney.fr/api/health || echo "⚠️  Health check failed"

echo "✅ Déploiement terminé!"
echo "📊 Logs: docker-compose logs -f app"
