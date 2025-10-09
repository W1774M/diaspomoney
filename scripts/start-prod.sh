#!/bin/bash

# Script de démarrage pour l'environnement de production
# Usage: ./scripts/start-prod.sh

set -e

echo "🚀 Démarrage de l'environnement de production DiaspoMoney"
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
# Configuration MongoDB pour la production
MONGODB_URI=mongodb://admin:admin123@mongodb:27017/diaspomoney?authSource=admin

# Configuration de l'application
NEXT_PUBLIC_APP_URL=https://app.diaspomoney.fr
NEXT_PUBLIC_API_URL=https://app.diaspomoney.fr/api

# Configuration NextAuth
NEXTAUTH_URL=https://app.diaspomoney.fr
NEXTAUTH_SECRET=your-super-secret-nextauth-key-here

# Configuration de l'environnement
NODE_ENV=production

# Clés secrètes
JWT_SECRET=your-super-secret-jwt-key-here

# Configuration Let's Encrypt
LETSENCRYPT_EMAIL=your-email@example.com
EOF
    echo "✅ Fichier .env créé"
    echo "⚠️  N'oubliez pas de configurer vos variables dans .env"
else
    echo "✅ Fichier .env existe déjà"
fi

# Créer le réseau Docker s'il n'existe pas
echo "🌐 Création du réseau Docker..."
docker network create diaspomoney 2>/dev/null || echo "✅ Réseau diaspomoney existe déjà"

# Arrêter les services existants s'ils sont en cours
echo "🛑 Arrêt des services existants..."
cd "$DOCKER_DIR"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down 2>/dev/null || echo "Aucun service à arrêter"

# Démarrer les services de production
echo "🚀 Démarrage des services de production..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# Attendre que les services soient prêts
echo "⏳ Attente que les services soient prêts..."
sleep 15

echo ""
echo "🎉 Environnement de production démarré avec succès !"
echo ""
echo "📋 Services disponibles :"
echo "   • Application : https://app.diaspomoney.fr"
echo "   • Mongo Express : https://mongo.diaspomoney.fr"
echo "   • Dashboard Traefik : https://dashboard.diaspomoney.fr"
echo "   • Monitoring : https://dashboard.diaspomoney.fr/grafana/"
echo ""
echo "📊 Pour voir les logs :"
echo "   docker logs app"
echo "   docker logs traefik"
echo "   docker logs mongodb"
echo "   docker logs mongo-express"
echo ""
echo "🛑 Pour arrêter :"
echo "cd docker && docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
