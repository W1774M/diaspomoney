#!/bin/bash

# Script pour corriger les problèmes de certificats ACME

echo "🔧 Correction des certificats ACME..."

# Créer les dossiers nécessaires
mkdir -p docker/traefik/letsencrypt
mkdir -p docker/traefik/traefik_logs

# Créer le fichier acme.json avec les bonnes permissions
touch docker/traefik/letsencrypt/acme.json
chmod 600 docker/traefik/letsencrypt/acme.json

# Vérifier que le fichier existe et a les bonnes permissions
if [ -f "docker/traefik/letsencrypt/acme.json" ]; then
    echo "✅ Fichier acme.json créé avec les bonnes permissions"
    ls -la docker/traefik/letsencrypt/acme.json
else
    echo "❌ Erreur: Impossible de créer le fichier acme.json"
    exit 1
fi

# Arrêter et supprimer le conteneur Traefik existant
echo "🛑 Arrêt du conteneur Traefik..."
docker stop traefik 2>/dev/null || true
docker rm traefik 2>/dev/null || true

# Redémarrer Traefik avec la nouvelle configuration
echo "🚀 Redémarrage de Traefik avec la nouvelle configuration..."
docker-compose -f docker/docker-compose.prod.yml up -d traefik

# Attendre que Traefik démarre
echo "⏳ Attente du démarrage de Traefik..."
sleep 10

# Vérifier les logs de Traefik
echo "📋 Vérification des logs Traefik..."
docker logs traefik --tail=20

# Vérifier si le fichier acme.json est en cours de modification
echo "🔍 Vérification du fichier acme.json..."
if [ -s "docker/traefik/letsencrypt/acme.json" ]; then
    echo "✅ Le fichier acme.json contient des données (certificats en cours de génération)"
else
    echo "⚠️  Le fichier acme.json est vide - vérifiez les logs Traefik"
fi

echo "🎉 Script terminé! Surveillez les logs avec: docker logs traefik -f"
