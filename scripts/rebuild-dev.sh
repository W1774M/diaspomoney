#!/bin/bash
# Script pour reconstruire et redéployer l'environnement dev
# Usage: ./scripts/rebuild-dev.sh

set -e

REGISTRY=${REGISTRY:-localhost:5000}
IMAGE_NAME="diaspomoney"
TAG="dev"
NAMESPACE="diaspomoney"

echo "🔨 Étape 1/3 : Reconstruction de l'image Docker..."
echo "   Tentative avec Dockerfile standard (Docker Hub)..."
if docker build -t ${REGISTRY}/${IMAGE_NAME}:${TAG} -f Dockerfile . 2>&1 | grep -q "connection refused\|failed to resolve\|dial tcp.*connect: connection refused"; then
    echo ""
    echo "❌ Erreur : Docker Hub et registries alternatifs non accessibles"
    echo ""
    echo "💡 Solutions :"
    echo "   1. Importer node:20-alpine depuis un autre serveur :"
    echo "      # Sur serveur avec internet :"
    echo "      docker pull node:20-alpine"
    echo "      docker save node:20-alpine | gzip > /tmp/node.tar.gz"
    echo "      # Transférer vers ce serveur, puis :"
    echo "      gunzip -c /tmp/node.tar.gz | docker load"
    echo ""
    echo "   2. Utiliser l'image déjà construite (sans les dernières modifications) :"
    echo "      docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}"
    echo "      kubectl rollout restart deployment diaspomoney-dev -n ${NAMESPACE}"
    echo ""
    exit 1
fi

echo "📤 Étape 2/3 : Push vers le registry..."
docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}

echo "🚀 Étape 3/3 : Redéploiement dans Kubernetes..."
kubectl rollout restart deployment diaspomoney-dev -n ${NAMESPACE}
kubectl rollout status deployment diaspomoney-dev -n ${NAMESPACE} --timeout=120s

echo "✅ Redéploiement terminé !"
echo ""
echo "🧪 Tests :"
echo "  curl -H 'Host: dev.diaspomoney.fr' http://localhost:30201/"
echo "  curl -k https://dev.diaspomoney.fr/"

