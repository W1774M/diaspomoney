#!/bin/bash

# Script pour vérifier que les secrets Stripe sont correctement configurés
# Usage: ./scripts/check-stripe-secrets.sh [env]
#   env: rct, prod, dev (défaut: rct)

set -e

ENV=${1:-"rct"}
NAMESPACE="diaspomoney"
SECRET_NAME="app-secrets"

echo "==============================================="
echo "🔍 Vérification des secrets Stripe"
echo "📁 Environnement: ${ENV}"
echo "📦 Namespace: ${NAMESPACE}"
echo "==============================================="
echo ""

# Vérifier si le namespace existe
if ! kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1; then
  echo "❌ Erreur: Le namespace ${NAMESPACE} n'existe pas"
  exit 1
fi

# Vérifier si le secret existe
echo "1️⃣  Vérification de l'existence du secret..."
if ! kubectl get secret ${SECRET_NAME} -n ${NAMESPACE} >/dev/null 2>&1; then
  echo "❌ Erreur: Le secret ${SECRET_NAME} n'existe pas dans le namespace ${NAMESPACE}"
  echo ""
  echo "Pour créer le secret, utilisez:"
  echo "  kubectl apply -f k8s/app/secrets.yaml -n ${NAMESPACE}"
  exit 1
fi
echo "✅ Le secret ${SECRET_NAME} existe"
echo ""

# Déterminer quelle clé vérifier selon l'environnement
if [ "${ENV}" = "prod" ]; then
  STRIPE_SECRET_KEY_NAME="STRIPE_SECRET_KEY_PROD"
  STRIPE_PUBLISHABLE_KEY_NAME="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_PROD"
else
  STRIPE_SECRET_KEY_NAME="STRIPE_SECRET_KEY"
  STRIPE_PUBLISHABLE_KEY_NAME="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
fi

# Vérifier STRIPE_SECRET_KEY
echo "2️⃣  Vérification de ${STRIPE_SECRET_KEY_NAME}..."
STRIPE_SECRET_KEY=$(kubectl get secret ${SECRET_NAME} -n ${NAMESPACE} -o jsonpath="{.data.${STRIPE_SECRET_KEY_NAME}}" 2>/dev/null | base64 -d 2>/dev/null || echo "")

if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "❌ Erreur: ${STRIPE_SECRET_KEY_NAME} n'est pas définie dans le secret"
  echo ""
  echo "Pour ajouter la clé au secret, utilisez:"
  echo "  kubectl patch secret ${SECRET_NAME} -n ${NAMESPACE} \\"
  echo "    --type='json' \\"
  echo "    -p='[{\"op\": \"add\", \"path\": \"/data/${STRIPE_SECRET_KEY_NAME}\", \"value\": \"'$(echo -n 'sk_test_...' | base64)'\"}]'"
  exit 1
fi

# Vérifier le format de la clé secrète
if [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_(test_|live_) ]]; then
  echo "⚠️  Avertissement: ${STRIPE_SECRET_KEY_NAME} n'a pas le bon format"
  echo "   Préfixe actuel: ${STRIPE_SECRET_KEY:0:10}..."
  echo "   Attendu: sk_test_ ou sk_live_"
else
  echo "✅ ${STRIPE_SECRET_KEY_NAME} est définie et a le bon format (${STRIPE_SECRET_KEY:0:20}...)"
fi
echo ""

# Vérifier NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
echo "3️⃣  Vérification de ${STRIPE_PUBLISHABLE_KEY_NAME}..."
STRIPE_PUBLISHABLE_KEY=$(kubectl get secret ${SECRET_NAME} -n ${NAMESPACE} -o jsonpath="{.data.${STRIPE_PUBLISHABLE_KEY_NAME}}" 2>/dev/null | base64 -d 2>/dev/null || echo "")

if [ -z "$STRIPE_PUBLISHABLE_KEY" ]; then
  echo "❌ Erreur: ${STRIPE_PUBLISHABLE_KEY_NAME} n'est pas définie dans le secret"
  exit 1
fi

# Vérifier le format de la clé publique
if [[ ! "$STRIPE_PUBLISHABLE_KEY" =~ ^pk_(test_|live_) ]]; then
  echo "⚠️  Avertissement: ${STRIPE_PUBLISHABLE_KEY_NAME} n'a pas le bon format"
  echo "   Préfixe actuel: ${STRIPE_PUBLISHABLE_KEY:0:10}..."
else
  echo "✅ ${STRIPE_PUBLISHABLE_KEY_NAME} est définie et a le bon format (${STRIPE_PUBLISHABLE_KEY:0:20}...)"
fi
echo ""

# Vérifier le déploiement
echo "4️⃣  Vérification du déploiement..."
DEPLOYMENT_NAME="diaspomoney-${ENV}"
if ! kubectl get deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE} >/dev/null 2>&1; then
  echo "⚠️  Le déploiement ${DEPLOYMENT_NAME} n'existe pas"
else
  echo "✅ Le déploiement ${DEPLOYMENT_NAME} existe"
  
  # Vérifier si STRIPE_SECRET_KEY est référencée dans le déploiement
  if kubectl get deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE} -o yaml | grep -q "STRIPE_SECRET_KEY"; then
    echo "✅ STRIPE_SECRET_KEY est référencée dans le déploiement"
  else
    echo "❌ STRIPE_SECRET_KEY n'est PAS référencée dans le déploiement"
    echo "   Vérifiez le fichier k8s/app/${ENV}/deployment.yaml"
  fi
fi
echo ""

# Vérifier les pods
echo "5️⃣  Vérification des pods..."
PODS=$(kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME} -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")

if [ -z "$PODS" ]; then
  echo "⚠️  Aucun pod trouvé pour ${DEPLOYMENT_NAME}"
else
  echo "📦 Pods trouvés:"
  for POD in $PODS; do
    echo "   - ${POD}"
    
    # Vérifier si la variable d'environnement est définie dans le pod
    echo "     Vérification de STRIPE_SECRET_KEY dans le pod..."
    POD_STRIPE_KEY=$(kubectl exec ${POD} -n ${NAMESPACE} -- env 2>/dev/null | grep "^STRIPE_SECRET_KEY=" | cut -d '=' -f2- || echo "")
    
    if [ -z "$POD_STRIPE_KEY" ]; then
      echo "     ❌ STRIPE_SECRET_KEY n'est PAS définie dans le pod ${POD}"
      echo "        Le pod doit être redémarré pour prendre en compte les nouvelles variables d'environnement"
      echo "        Utilisez: kubectl rollout restart deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}"
    else
      if [[ "$POD_STRIPE_KEY" =~ ^sk_(test_|live_) ]]; then
        echo "     ✅ STRIPE_SECRET_KEY est définie dans le pod (${POD_STRIPE_KEY:0:20}...)"
      else
        echo "     ⚠️  STRIPE_SECRET_KEY est définie mais a un format invalide (${POD_STRIPE_KEY:0:20}...)"
      fi
    fi
  done
fi
echo ""

# Résumé
echo "==============================================="
echo "📊 Résumé"
echo "==============================================="
echo ""

if [ -n "$STRIPE_SECRET_KEY" ] && [ -n "$STRIPE_PUBLISHABLE_KEY" ]; then
  if [ -n "$PODS" ]; then
    ALL_PODS_OK=true
    for POD in $PODS; do
      POD_STRIPE_KEY=$(kubectl exec ${POD} -n ${NAMESPACE} -- env 2>/dev/null | grep "^STRIPE_SECRET_KEY=" | cut -d '=' -f2- || echo "")
      if [ -z "$POD_STRIPE_KEY" ]; then
        ALL_PODS_OK=false
        break
      fi
    done
    
    if [ "$ALL_PODS_OK" = "true" ]; then
      echo "✅ Tous les secrets Stripe sont correctement configurés"
    else
      echo "⚠️  Les secrets existent mais ne sont pas encore dans les pods"
      echo "   Redémarrez les pods avec:"
      echo "   kubectl rollout restart deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}"
    fi
  else
    echo "⚠️  Les secrets existent mais aucun pod n'est en cours d'exécution"
  fi
else
  echo "❌ Certains secrets sont manquants"
fi

echo ""
