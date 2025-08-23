#!/bin/bash

# Script de configuration de l'environnement de développement DiaspoMoney
# Usage: ./scripts/dev-setup.sh

set -e

echo "🚀 Configuration de l'environnement de développement DiaspoMoney"
echo "================================================================"

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

# Créer le fichier .env.local s'il n'existe pas
if [ ! -f .env.local ]; then
    echo "📝 Création du fichier .env.local..."
    cat > .env.local << EOF
# Configuration MongoDB
MONGODB_URI=mongodb://diaspomoney_user:diaspomoney_app_password@localhost:27017/diaspomoney

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
    echo "✅ Fichier .env.local créé"
    echo "⚠️  N'oubliez pas de configurer vos variables SMTP dans .env.local"
else
    echo "✅ Fichier .env.local existe déjà"
fi

# Arrêter les services existants s'ils sont en cours
echo "🛑 Arrêt des services existants..."
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

# Démarrer les services Docker
echo "🐳 Démarrage des services Docker..."
docker-compose -f docker-compose.dev.yml up -d

# Attendre que MongoDB soit prêt
echo "⏳ Attente que MongoDB soit prêt..."
sleep 10

# Vérifier que les services sont démarrés
echo "🔍 Vérification des services..."
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "✅ Tous les services sont démarrés"
else
    echo "❌ Erreur lors du démarrage des services"
    docker-compose -f docker-compose.dev.yml logs
    exit 1
fi

# Vérifier la connexion MongoDB
echo "🔗 Test de connexion MongoDB..."
if docker exec diaspomoney-mongodb mongosh -u diaspomoney_user -p diaspomoney_app_password diaspomoney --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo "✅ Connexion MongoDB réussie"
else
    echo "❌ Erreur de connexion MongoDB"
    echo "📋 Logs MongoDB :"
    docker-compose -f docker-compose.dev.yml logs mongodb
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
echo "   • MongoDB : mongodb://localhost:27017/diaspomoney"
echo "   • Mongo Express : http://localhost:8081 (admin/diaspomoney123)"
echo "   • Redis : redis://localhost:6379"
echo "   • Application : http://localhost:3000"
echo ""
echo "🚀 Pour démarrer l'application :"
echo "   pnpm dev"
echo ""
echo "📊 Pour voir les logs des services :"
echo "   docker-compose -f docker-compose.dev.yml logs"
echo ""
echo "🛑 Pour arrêter les services :"
echo "   docker-compose -f docker-compose.dev.yml down"
echo ""
echo "⚠️  N'oubliez pas de configurer vos variables SMTP dans .env.local pour l'envoi d'emails" 