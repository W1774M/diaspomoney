#!/bin/bash
set -e

echo "🔧 Fix et Déploiement DiaspoMoney"
echo "=================================="
echo ""

# Vérifier que le dossier public existe
if [ ! -d "public" ]; then
    echo "❌ Erreur : Le dossier public/ n'existe pas!"
    exit 1
fi

echo "✅ Dossier public/ détecté"
echo ""

# Vérifier que .env existe
if [ ! -f ".env" ]; then
    echo "❌ Erreur : Le fichier .env n'existe pas!"
    echo "   Créez un fichier .env basé sur ENV_ANALYSIS.md"
    exit 1
fi

echo "✅ Fichier .env détecté"
echo ""

# Arrêter l'app actuelle
echo "⏸️  Arrêt de l'application..."
docker compose -f docker-compose.prod.yml stop app || true
echo ""

# Supprimer le conteneur et l'image
echo "🗑️  Suppression de l'ancien conteneur et image..."
docker compose -f docker-compose.prod.yml rm -f app || true
docker rmi diaspomoney_app || true
docker rmi diaspomoney-app || true
echo ""

# Nettoyer le cache
echo "🧹 Nettoyage du cache Docker..."
docker builder prune -f
echo ""

# Rebuild
echo "🏗️  Reconstruction de l'image..."
docker compose -f docker-compose.prod.yml build app
echo ""

# Redémarrer
echo "🚀 Démarrage de l'application..."
docker compose -f docker-compose.prod.yml up -d
echo ""

# Attendre que l'app démarre
echo "⏳ Attente du démarrage de l'application..."
sleep 10

# Vérifier les logs
echo "📋 Logs de l'application (Ctrl+C pour quitter):"
echo ""
docker compose -f docker-compose.prod.yml logs -f app

