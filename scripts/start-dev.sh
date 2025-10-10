#!/bin/bash

# Script de configuration de l'environnement de développement DiaspoMoney
# Usage: ./scripts/dev-setup.sh

set -e

echo "🚀 Configuration de l'environnement de développement DiaspoMoney"
echo "================================================================"


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
# Configuration MongoDB
MONGODB_URI=mongodb://${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@localhost:27017/diaspomoney

# Configuration SMTP pour l'envoi d'emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Configuration de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Configuration Redis (optionnel)
REDIS_URL=redis://localhost:6379

# Clés secrètes
JWT_SECRET=your-super-secret-jwt-key-here
NEXTAUTH_SECRET=your-nextauth-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Configuration de l'environnement
NODE_ENV=development
EOF
    echo "✅ Fichier .env créé"
    echo "⚠️  N'oubliez pas de configurer vos variables SMTP dans .env"
else
    echo "✅ Fichier .env existe déjà"
fi

# Créer le réseau Docker s'il n'existe pas
echo "🌐 Création du réseau Docker..."
docker network create diaspomoney 2>/dev/null || echo "✅ Réseau diaspomoney existe déjà"


# Arrêter les services existants s'ils sont en cours
echo "🛑 Arrêt des services existants..."
cd "$DOCKER_DIR"
docker-compose -f docker-compose.yml down 2>/dev/null || echo "Aucun service à arrêter"

# Démarrer les services Docker
echo "🐳 Démarrage des services Docker..."
cd "$DOCKER_DIR"
docker-compose -f docker-compose.yml up -d

# Attendre que MongoDB soit prêt
echo "⏳ Attente que MongoDB soit prêt..."
sleep 10

# Vérifier que les services sont démarrés
echo "🔍 Vérification des services..."
cd "$DOCKER_DIR"
if docker-compose -f docker-compose.yml ps | grep -q "Up"; then
    echo "✅ Tous les services sont démarrés"
else
    echo "❌ Erreur lors du démarrage des services"
    docker-compose -f docker-compose.yml logs
    exit 1
fi

# Vérifier la connexion MongoDB
echo "🔗 Test de connexion MongoDB..."
if docker exec mongodb mongosh --username admin --password admin123 --authenticationDatabase admin --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✅ Connexion MongoDB réussie"
    echo "🔗 Connexion MongoDB : mongodb://admin:admin123@localhost:27017/diaspomoney?authSource=admin"
else
    echo "❌ Erreur de connexion MongoDB"
    echo "📋 Logs MongoDB :"
    cd "$DOCKER_DIR" && docker-compose -f docker-compose.yml logs mongodb
    exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    pnpm install
else
    echo "✅ Dépendances déjà installées"
fi

echo ""
echo "🎉 Configuration terminée avec succès !"
echo ""
echo "📋 Informations importantes :"
echo "   • MongoDB : mongodb://admin:admin123@localhost:27017/diaspomoney?authSource=admin"
echo "   • Mongo Express : http://localhost:8081 (admin/admin123)"
echo "   • Redis : redis://localhost:6379"
echo "   • Application : http://localhost:3000"
echo ""
echo "🚀 Pour démarrer l'application :"
echo "   pnpm dev"
echo ""
echo "📊 Pour voir les logs des services :"
echo "   cd docker && docker-compose -f docker-compose.yml logs && cd ../"
echo ""
echo "🛑 Pour arrêter les services :"
echo "   cd docker && docker-compose -f docker-compose.yml down && cd ../"
echo ""
echo "⚠️  N'oubliez pas de configurer vos variables SMTP dans .env pour l'envoi d'emails" 