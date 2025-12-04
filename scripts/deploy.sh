#!/bin/bash

# Set environment (rct, prod, dev)
ENV=$1
BUILD_DATE=$(date +'%Y%m%d-%H%M%S')
IMAGE_TAG="localhost:5000/diaspomoney:${ENV}-${BUILD_DATE}"

# Environment-specific variables
case $ENV in
  rct)
    APP_URL="https://rct.diaspomoney.fr"
    API_URL="https://rct.diaspomoney.fr/api"
    ;;
  prod)
    APP_URL="https://diaspomoney.fr"
    API_URL="https://diaspomoney.fr/api"
    ;;
  dev)
    APP_URL="http://localhost:3000"
    API_URL="http://localhost:3000/api"
    ;;
  *)
    echo "❌ Invalid environment. Use: rct, prod, or dev"
    exit 1
    ;;
esac

# Build Docker image
echo "📦 Building Docker image for $ENV..."
docker build \
  --build-arg ENV=$ENV \
  --build-arg NODE_ENV=production \
  --build-arg NEXT_PUBLIC_APP_URL=$APP_URL \
  --build-arg NEXT_PUBLIC_API_URL=$API_URL \
  -t $IMAGE_TAG \
  -f Dockerfile \
  .

# Push to local registry
echo "📤 Pushing image to registry..."
docker push $IMAGE_TAG

# Tag as latest for caching
docker tag $IMAGE_TAG "localhost:5000/diaspomoney:${ENV}-latest"
docker push "localhost:5000/diaspomoney:${ENV}-latest"

# Deploy to k3s
echo "🚀 Deploying to k3s..."
kubectl rollout restart deployment -n $ENV diaspomoney-app

echo "✅ Deployment complete: $IMAGE_TAG"
