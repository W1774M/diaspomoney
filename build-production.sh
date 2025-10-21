#!/bin/bash

# Script de build en deux étapes pour DiaspoMoney
# Étape 1: Build de l'application sans MongoDB
# Étape 2: Déploiement avec MongoDB

set -e

echo "🚀 Démarrage du build en deux étapes pour DiaspoMoney"

# Vérifier que les variables d'environnement sont définies
if [ -z "$MONGO_PASSWORD" ]; then
    echo "❌ MONGO_PASSWORD n'est pas défini"
    echo "💡 Utilisez: export MONGO_PASSWORD=votre_mot_de_passe"
    exit 1
fi

if [ -z "$REDIS_PASSWORD" ]; then
    echo "❌ REDIS_PASSWORD n'est pas défini"
    echo "💡 Utilisez: export REDIS_PASSWORD=votre_mot_de_passe"
    exit 1
fi

echo "✅ Variables d'environnement vérifiées"

# Étape 1: Build de l'application sans MongoDB
echo "📦 Étape 1: Build de l'application sans MongoDB..."
docker-compose -f docker-compose.build.yml build app-build

echo "✅ Build de l'application terminé"

# Étape 2: Tag de l'image pour la production
echo "🏷️  Étape 2: Tag de l'image pour la production..."
docker tag diaspomoney-diaspomoney-app-build:latest diaspomoney-app:latest

echo "✅ Image taguée pour la production"

# Étape 3: Déploiement avec MongoDB
echo "🚀 Étape 3: Déploiement avec MongoDB..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Déploiement terminé"

# Vérification du statut
echo "🔍 Vérification du statut des conteneurs..."
docker-compose -f docker-compose.prod.yml ps

echo "🎉 Build et déploiement terminés avec succès!"
echo "🌐 Application disponible sur: https://app.diaspomoney.fr"
