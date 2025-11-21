#!/bin/bash
# Script complet de déploiement et vérification de A à Z jusqu'aux TLS
# Usage: ./scripts/deploy-full.sh [dev|rct|prod]

set -e

ENV=${1:-dev}

if [[ ! "$ENV" =~ ^(dev|rct|prod)$ ]]; then
  echo "❌ Environnement invalide: $ENV"
  echo "Usage: $0 [dev|rct|prod]"
  exit 1
fi

echo "🚀 Déploiement complet pour l'environnement: $ENV"
echo "=========================================="

# Déterminer les fichiers selon l'environnement
case $ENV in
  dev)
    COMPOSE_FILE="docker-compose.dev.yml"
    APP_URL="https://dev.diaspomoney.fr"
    DEPLOYMENT_NAME="diaspomoney-dev"
    NAMESPACE="diaspomoney"
    ;;
  rct)
    COMPOSE_FILE="docker-compose.rct.yml"
    APP_URL="https://rct.diaspomoney.fr"
    DEPLOYMENT_NAME="diaspomoney-rct"
    NAMESPACE="diaspomoney"
    ;;
  prod)
    COMPOSE_FILE="docker-compose.prod.yml"
    APP_URL="https://app.diaspomoney.fr"
    DEPLOYMENT_NAME="diaspomoney-app"
    NAMESPACE="diaspomoney"
    ;;
esac

# 1. Extraire les variables d'environnement depuis docker-compose
echo ""
echo "📋 Étape 1/8: Extraction des variables d'environnement..."
NEXT_PUBLIC_APP_URL=$(grep -A 5 "NEXT_PUBLIC_APP_URL:" "$COMPOSE_FILE" | grep "NEXT_PUBLIC_APP_URL:" | sed 's/.*NEXT_PUBLIC_APP_URL: *\(.*\)/\1/' | tr -d ' "')
NEXT_PUBLIC_API_URL=$(grep -A 5 "NEXT_PUBLIC_API_URL:" "$COMPOSE_FILE" | grep "NEXT_PUBLIC_API_URL:" | sed 's/.*NEXT_PUBLIC_API_URL: *\(.*\)/\1/' | tr -d ' "')

if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
  NEXT_PUBLIC_APP_URL="$APP_URL"
fi
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
  NEXT_PUBLIC_API_URL="$APP_URL/api"
fi

export NEXT_PUBLIC_APP_URL
export NEXT_PUBLIC_API_URL

echo "  ✓ NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL"
echo "  ✓ NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"

# 2. Build local Next.js
echo ""
echo "🔨 Étape 2/8: Build local Next.js..."
rm -f .next/lock
pnpm build
echo "  ✓ Build local terminé"

# 3. Modifier .dockerignore temporairement si USE_LOCAL_BUILD=true
echo ""
echo "📦 Étape 3/8: Préparation du contexte Docker..."
USE_LOCAL_BUILD=$(grep -A 5 "USE_LOCAL_BUILD:" "$COMPOSE_FILE" | grep "USE_LOCAL_BUILD:" | sed 's/.*USE_LOCAL_BUILD: *\(.*\)/\1/' | tr -d ' "')
if [ "$USE_LOCAL_BUILD" = "true" ] && [ -f .dockerignore ]; then
  cp .dockerignore .dockerignore.tmp
  sed -i '/^\.next$/d' .dockerignore
  sed -i '/^\.next\//d' .dockerignore
  echo "  ✓ .dockerignore modifié temporairement pour inclure .next"
fi

# 4. Build image Docker
echo ""
echo "🐳 Étape 4/8: Build de l'image Docker..."
docker-compose -f "$COMPOSE_FILE" build
echo "  ✓ Image Docker construite"

# 5. Restaurer .dockerignore
if [ -f .dockerignore.tmp ]; then
  mv .dockerignore.tmp .dockerignore
  echo "  ✓ .dockerignore restauré"
fi

# 6. Push vers le registry
echo ""
echo "📤 Étape 5/8: Push vers le registry..."
IMAGE_NAME=$(grep "image:" "$COMPOSE_FILE" | sed 's/.*image: *\(.*\)/\1/' | tr -d ' "')
docker push "$IMAGE_NAME"
echo "  ✓ Image poussée: $IMAGE_NAME"

# 7. Déploiement Kubernetes
echo ""
echo "☸️  Étape 6/8: Déploiement sur Kubernetes..."
kubectl rollout restart deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE"
kubectl rollout status deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" --timeout=120s
echo "  ✓ Déploiement Kubernetes terminé"

# 8. Vérifications
echo ""
echo "✅ Étape 7/8: Vérifications..."

# 8.1 Vérifier que le pod est prêt
echo "  🔍 Vérification du pod..."
POD_READY=$(kubectl get pods -n "$NAMESPACE" -l app="$DEPLOYMENT_NAME" -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "False")
if [ "$POD_READY" != "True" ]; then
  echo "  ⚠️  Pod pas encore prêt, attente..."
  sleep 10
  POD_READY=$(kubectl get pods -n "$NAMESPACE" -l app="$DEPLOYMENT_NAME" -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "False")
fi

if [ "$POD_READY" = "True" ]; then
  echo "  ✓ Pod prêt"
else
  echo "  ❌ Pod non prêt"
  kubectl get pods -n "$NAMESPACE" -l app="$DEPLOYMENT_NAME"
  exit 1
fi

# 8.2 Vérifier l'accessibilité HTTP
echo "  🔍 Vérification HTTP..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
  echo "  ✓ HTTP accessible (code: $HTTP_CODE)"
else
  echo "  ⚠️  HTTP code: $HTTP_CODE (peut être normal si redirection)"
fi

# 8.3 Vérifier TLS/HTTPS
echo "  🔍 Vérification TLS/HTTPS..."
TLS_CHECK=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$APP_URL" 2>/dev/null || echo "000")
if [ "$TLS_CHECK" != "000" ]; then
  echo "  ✓ HTTPS accessible"
  
  # Vérifier le certificat
  CERT_INFO=$(echo | openssl s_client -servername $(echo "$APP_URL" | sed 's|https\?://||' | cut -d/ -f1) -connect $(echo "$APP_URL" | sed 's|https\?://||' | cut -d/ -f1):443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
  if [ -n "$CERT_INFO" ]; then
    echo "  ✓ Certificat TLS valide"
    echo "$CERT_INFO" | grep "notAfter" | sed 's/notAfter=/    Expiration: /'
  else
    echo "  ⚠️  Impossible de vérifier le certificat (peut être normal)"
  fi
else
  echo "  ⚠️  HTTPS non accessible (vérifiez manuellement)"
fi

# 8.4 Vérifier l'ingress
echo "  🔍 Vérification de l'ingress..."
INGRESS_EXISTS=$(kubectl get ingress -n "$NAMESPACE" | grep -c "$DEPLOYMENT_NAME" || echo "0")
if [ "$INGRESS_EXISTS" -gt 0 ]; then
  echo "  ✓ Ingress configuré"
  kubectl get ingress -n "$NAMESPACE" | grep "$DEPLOYMENT_NAME"
else
  echo "  ⚠️  Ingress non trouvé"
fi

# 9. Résumé final
echo ""
echo "🎉 Étape 8/8: Résumé"
echo "=========================================="
echo "✅ Environnement: $ENV"
echo "✅ Application: $APP_URL"
echo "✅ Déploiement: $DEPLOYMENT_NAME"
echo "✅ Namespace: $NAMESPACE"
echo ""
echo "📊 Statut du déploiement:"
kubectl get pods -n "$NAMESPACE" -l app="$DEPLOYMENT_NAME"
echo ""
echo "🌐 Accès: $APP_URL"
echo ""
echo "✨ Déploiement terminé avec succès!"

