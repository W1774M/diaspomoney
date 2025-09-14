#!/bin/bash

# Script de démarrage pour l'environnement de développement
# Usage: ./scripts/start-dev.sh

set -e

echo "🚀 Démarrage de l'environnement de développement DiaspoMoney"
echo "============================================================="

# Obtenir le répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$PROJECT_DIR/docker"

echo "📁 Répertoire du projet : $PROJECT_DIR"
echo "📁 Répertoire Docker : $DOCKER_DIR"

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
    exit 1
fi

echo "✅ Docker et Docker Compose sont installés"

# Vérifier que le répertoire docker existe
if [ ! -d "$DOCKER_DIR" ]; then
    echo "❌ Répertoire docker non trouvé : $DOCKER_DIR"
    exit 1
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "📝 Création du fichier .env..."
    cat > "$PROJECT_DIR/.env" << EOF
# Configuration MongoDB pour le développement
MONGODB_URI=mongodb://admin:admin123@localhost:27017/diaspomoney?authSource=admin

# Configuration de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Configuration NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key

# Configuration de l'environnement
NODE_ENV=development

# Clés secrètes
JWT_SECRET=dev-jwt-secret
EOF
    echo "✅ Fichier .env créé"
else
    echo "✅ Fichier .env existe déjà"
fi

# Créer le réseau Docker s'il n'existe pas
echo "🌐 Création du réseau Docker..."
docker network create diaspomoney 2>/dev/null || echo "✅ Réseau diaspomoney existe déjà"

# Arrêter les services existants s'ils sont en cours
echo "🛑 Arrêt des services existants..."
cd "$DOCKER_DIR"
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down 2>/dev/null || echo "Aucun service à arrêter"

# Démarrer les services de développement
echo "🚀 Démarrage des services de développement..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

echo ""
echo "🎉 Environnement de développement démarré avec succès !"
echo ""
echo "📋 Services disponibles :"
echo "   • Application : http://localhost:3000"
echo "   • Mongo Express : http://localhost:8081"
echo "   • MongoDB : mongodb://admin:admin123@localhost:27017/diaspomoney"
echo ""
echo "📊 Pour voir les logs :"
echo "   docker logs app-dev"
echo "   docker logs mongo-express"
echo "   docker logs mongodb"
echo ""
echo "🛑 Pour arrêter :"
echo "   cd docker && docker-compose -f docker-compose.yml -f docker-compose.dev.yml down"
