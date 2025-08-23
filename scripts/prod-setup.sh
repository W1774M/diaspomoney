#!/bin/bash

# Script de configuration de l'environnement de production DiaspoMoney
# Usage: ./scripts/prod-setup.sh

set -e

echo "🚀 Configuration de l'environnement de production DiaspoMoney"
echo "============================================================="

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

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cat > .env << EOF
# Configuration MongoDB pour la production
MONGODB_URI=mongodb://diaspomoney:supersecret@mongodb:27017/diaspomoney?authSource=admin

# Configuration SMTP pour l'envoi d'emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Configuration de l'application
NEXT_PUBLIC_APP_URL=https://app.diaspomoney.fr
NEXT_PUBLIC_API_URL=https://app.diaspomoney.fr/api

# Configuration NextAuth
NEXTAUTH_URL=https://app.diaspomoney.fr
NEXTAUTH_SECRET=your-super-secret-nextauth-key-here

# Configuration Google OAuth (optionnel)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Configuration de l'environnement
NODE_ENV=production

# Clés secrètes
JWT_SECRET=your-super-secret-jwt-key-here
EOF
    echo "✅ Fichier .env créé"
    echo "⚠️  N'oubliez pas de configurer vos variables SMTP et OAuth dans .env"
else
    echo "✅ Fichier .env existe déjà"
fi

# Créer le réseau Docker s'il n'existe pas
echo "🌐 Création du réseau Docker..."
docker network create diaspomoney 2>/dev/null || echo "✅ Réseau diaspomoney existe déjà"

# Arrêter les services existants s'ils sont en cours
echo "🛑 Arrêt des services existants..."
cd docker
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.yml down 2>/dev/null || true

# Démarrer MongoDB d'abord
echo "🐳 Démarrage de MongoDB..."
docker-compose -f docker-compose.yml up -d mongodb

# Attendre que MongoDB soit prêt
echo "⏳ Attente que MongoDB soit prêt..."
sleep 15

# Vérifier que MongoDB est démarré
echo "🔍 Vérification de MongoDB..."
if docker ps | grep -q "dev-mongodb"; then
    echo "✅ MongoDB est démarré"
else
    echo "❌ Erreur lors du démarrage de MongoDB"
    docker-compose -f docker-compose.yml logs mongodb
    exit 1
fi

# Vérifier la connexion MongoDB
echo "🔗 Test de connexion MongoDB..."
if docker exec dev-mongodb mongosh -u diaspomoney -p supersecret diaspomoney --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    echo "✅ Connexion MongoDB réussie"
else
    echo "❌ Erreur de connexion MongoDB"
    echo "📋 Logs MongoDB :"
    docker-compose -f docker-compose.yml logs mongodb
    exit 1
fi

# Démarrer l'application en production
echo "🚀 Démarrage de l'application en production..."
docker-compose -f docker-compose.prod.yml up -d

# Attendre que l'application soit prête
echo "⏳ Attente que l'application soit prête..."
sleep 10

# Vérifier que tous les services sont démarrés
echo "🔍 Vérification des services..."
if docker ps | grep -q "diaspomoney"; then
    echo "✅ Application DiaspoMoney est démarrée"
else
    echo "❌ Erreur lors du démarrage de l'application"
    docker-compose -f docker-compose.prod.yml logs app
    exit 1
fi

# Vérifier que Traefik est démarré
if docker ps | grep -q "traefik"; then
    echo "✅ Traefik est démarré"
else
    echo "❌ Erreur lors du démarrage de Traefik"
    docker-compose -f docker-compose.prod.yml logs reverse-proxy
    exit 1
fi

# Test de connectivité de l'application
echo "🌐 Test de connectivité de l'application..."
sleep 5
if curl -f -s -o /dev/null -w "%{http_code}" https://app.diaspomoney.fr | grep -q "200"; then
    echo "✅ Application accessible via HTTPS"
else
    echo "⚠️  Application pas encore accessible via HTTPS (peut prendre quelques minutes)"
fi

cd ..

echo ""
echo "🎉 Configuration de production terminée avec succès !"
echo ""
echo "📋 Informations importantes :"
echo "   • MongoDB : mongodb://diaspomoney:supersecret@mongodb:27017/diaspomoney"
echo "   • Application : https://app.diaspomoney.fr"
echo "   • Dashboard Traefik : https://dev.diaspomoney.fr/dashboard/"
echo "   • Monitoring : https://dev.diaspomoney.fr/grafana/"
echo ""
echo "📊 Pour voir les logs des services :"
echo "   docker logs diaspomoney"
echo "   docker logs traefik"
echo "   docker logs dev-mongodb"
echo ""
echo "🛑 Pour arrêter les services :"
echo "   cd docker && docker-compose -f docker-compose.prod.yml down"
echo ""
echo "🔄 Pour redémarrer l'application :"
echo "   docker restart diaspomoney"
echo ""
echo "⚠️  N'oubliez pas de configurer vos variables SMTP et OAuth dans .env"
echo "⚠️  Assurez-vous que vos domaines pointent vers ce serveur" 