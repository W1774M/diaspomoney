#!/bin/bash

echo "🧪 Test du build Docker..."
echo "=========================="

# Vérifier que Docker est disponible
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Test du build
echo "🔨 Construction de l'image Docker..."
if docker build -t diaspomoney-test .; then
    echo "✅ Build Docker réussi !"
    echo "🧹 Nettoyage de l'image de test..."
    docker rmi diaspomoney-test
    echo "✅ Test terminé avec succès"
else
    echo "❌ Échec du build Docker"
    exit 1
fi
