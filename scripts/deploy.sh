#!/bin/bash

set -e

ENV=$1
BUILD_DATE=$(date +'%Y%m%d-%H%M%S')
IMAGE_TAG="localhost:5000/diaspomoney:${ENV}-${BUILD_DATE}"
LATEST_TAG="localhost:5000/diaspomoney:${ENV}-latest"
NAMESPACE="diaspomoney"
DEPLOYMENT_NAME="diaspomoney-${ENV}"

echo "==============================================="
echo "🚀 Déploiement ${ENV}"
echo "📦 Image : ${IMAGE_TAG}"
echo "📁 Deployment : ${DEPLOYMENT_NAME}"
echo "==============================================="

# Build with proper build args
docker build \
  --build-arg ENV=${ENV} \
  --build-arg NODE_ENV=production \
  --build-arg NEXT_PUBLIC_APP_URL="https://${ENV}.diaspomoney.fr" \
  --build-arg NEXT_PUBLIC_API_URL="https://${ENV}.diaspomoney.fr/api" \
  -t ${IMAGE_TAG} \
  -t ${LATEST_TAG} \
  -f Dockerfile \
  .

# Push images
docker push ${IMAGE_TAG}
docker push ${LATEST_TAG}

# Update deployment
kubectl set image deployment/${DEPLOYMENT_NAME} ${DEPLOYMENT_NAME}=${IMAGE_TAG} -n ${NAMESPACE}

# Verify rollout
kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE} --timeout=60s

echo "✅ Déploiement terminé: ${IMAGE_TAG}"
