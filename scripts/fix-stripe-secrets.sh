#!/bin/bash

# Script pour appliquer les secrets Stripe et redémarrer les pods
# Usage: ./scripts/fix-stripe-secrets.sh [env]
#   env: rct, prod, dev (défaut: rct)

set -e

ENV=${1:-"rct"}
NAMESPACE="diaspomoney"
SECRETS_FILE="k8s/app/secrets.yaml"
DEPLOYMENT_NAME="diaspomoney-${ENV}"

echo "==============================================="
echo "🔧 Correction des secrets Stripe"
echo "📁 Environnement: ${ENV}"
echo "📦 Namespace: ${NAMESPACE}"
echo "==============================================="
echo ""

# Vérifier si le namespace existe
if ! kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1; then
  echo "📦 Création du namespace ${NAMESPACE}..."
  kubectl create namespace "${NAMESPACE}"
fi

# Appliquer les secrets
if [ -f "${SECRETS_FILE}" ]; then
  echo "🔐 Application des secrets depuis ${SECRETS_FILE}..."
  kubectl apply -f "${SECRETS_FILE}" -n "${NAMESPACE}"
  echo "✅ Secrets appliqués"
else
  echo "❌ Erreur: Le fichier ${SECRETS_FILE} n'existe pas"
  exit 1
fi
echo ""

# Vérifier si le déploiement existe
if ! kubectl get deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE} >/dev/null 2>&1; then
  echo "⚠️  Le déploiement ${DEPLOYMENT_NAME} n'existe pas"
  echo "   Déployez d'abord l'application avec: ./scripts/deploy.sh ${ENV}"
  exit 1
fi

# Vérifier les variables d'environnement dans le déploiement
echo "🔍 Vérification des variables d'environnement dans le déploiement..."
DEPLOYMENT_YAML="k8s/app/${ENV}/deployment.yaml"

if [ ! -f "${DEPLOYMENT_YAML}" ]; then
  echo "❌ Erreur: Le fichier ${DEPLOYMENT_YAML} n'existe pas"
  exit 1
fi

# Vérifier si STRIPE_SECRET_KEY est référencée
if grep -q "STRIPE_SECRET_KEY" "${DEPLOYMENT_YAML}"; then
  echo "✅ STRIPE_SECRET_KEY est référencée dans ${DEPLOYMENT_YAML}"
else
  echo "❌ STRIPE_SECRET_KEY n'est PAS référencée dans ${DEPLOYMENT_YAML}"
  echo "   Vous devez l'ajouter manuellement ou utiliser le déploiement mis à jour"
  exit 1
fi
echo ""

# Redémarrer les pods pour prendre en compte les nouveaux secrets
echo "🔄 Redémarrage des pods pour appliquer les nouveaux secrets..."
kubectl rollout restart deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}

echo "⏳ Attente du redémarrage..."
kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE} --timeout=300s || {
  echo "⚠️  Le redémarrage prend plus de temps que prévu"
  echo "   Vérifiez avec: kubectl get pods -n ${NAMESPACE}"
}

echo ""
echo "✅ Redémarrage terminé"
echo ""

# Vérifier que les variables sont maintenant disponibles dans les pods
echo "🔍 Vérification finale..."
sleep 5
PODS=$(kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME} -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")

if [ -n "$PODS" ]; then
  ALL_OK=true
  for POD in $PODS; do
    POD_STRIPE_KEY=$(kubectl exec ${POD} -n ${NAMESPACE} -- env 2>/dev/null | grep "^STRIPE_SECRET_KEY=" | cut -d '=' -f2- || echo "")
    if [ -z "$POD_STRIPE_KEY" ]; then
      echo "❌ STRIPE_SECRET_KEY n'est toujours pas définie dans le pod ${POD}"
      ALL_OK=false
    else
      echo "✅ STRIPE_SECRET_KEY est définie dans le pod ${POD} (${POD_STRIPE_KEY:0:20}...)"
    fi
  done
  
  if [ "$ALL_OK" = "true" ]; then
    echo ""
    echo "✅ Tous les pods ont maintenant accès à STRIPE_SECRET_KEY"
  else
    echo ""
    echo "⚠️  Certains pods n'ont toujours pas accès à STRIPE_SECRET_KEY"
    echo "   Vérifiez les logs avec: kubectl logs -n ${NAMESPACE} <pod-name>"
  fi
else
  echo "⚠️  Aucun pod trouvé"
fi

echo ""
echo "==============================================="
echo "✅ Correction terminée"
echo "==============================================="
