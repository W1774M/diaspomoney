#!/bin/bash

# Script pour vérifier que NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY est correctement définie
# Usage: ./scripts/check-stripe-key.sh [namespace|env]
#   Si un environnement est fourni (rct, prod, dev), utilise le namespace diaspomoney

set -e

INPUT=${1:-"diaspomoney"}
SECRET_NAME="app-secrets"
KEY_NAME="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"

# Si l'input est un environnement connu, utiliser le namespace diaspomoney
if [[ "$INPUT" =~ ^(rct|prod|dev)$ ]]; then
  NAMESPACE="diaspomoney"
  ENV=$INPUT
  echo "🔍 Vérification de ${KEY_NAME} pour l'environnement ${ENV} dans le namespace ${NAMESPACE}..."
else
  NAMESPACE=$INPUT
  echo "🔍 Vérification de ${KEY_NAME} dans le namespace ${NAMESPACE}..."
fi

echo ""

# Vérifier si le secret existe
if ! kubectl get secret ${SECRET_NAME} -n ${NAMESPACE} > /dev/null 2>&1; then
  echo "❌ Erreur: Le secret ${SECRET_NAME} n'existe pas dans le namespace ${NAMESPACE}"
  echo ""
  echo "Pour créer le secret, utilisez:"
  echo "  kubectl create secret generic ${SECRET_NAME} -n ${NAMESPACE} \\"
  echo "    --from-literal=${KEY_NAME}='pk_test_...'"
  exit 1
fi

# Récupérer la valeur de la clé
echo "📋 Récupération de la clé depuis le secret..."
STRIPE_KEY=$(kubectl get secret ${SECRET_NAME} -n ${NAMESPACE} -o jsonpath="{.data.${KEY_NAME}}" 2>/dev/null | base64 -d 2>/dev/null || echo "")

if [ -z "$STRIPE_KEY" ]; then
  echo "❌ Erreur: ${KEY_NAME} n'est pas définie dans le secret ${SECRET_NAME}"
  echo ""
  echo "Pour ajouter la clé au secret, utilisez:"
  echo "  kubectl patch secret ${SECRET_NAME} -n ${NAMESPACE} \\"
  echo "    --type='json' \\"
  echo "    -p='[{\"op\": \"add\", \"path\": \"/data/${KEY_NAME}\", \"value\": \"'$(echo -n 'pk_test_...' | base64)'\"}]'"
  exit 1
fi

# Nettoyer la clé (enlever les guillemets et espaces)
CLEANED_KEY=$(echo "$STRIPE_KEY" | tr -d '"' | tr -d "'" | xargs)

echo "✅ Clé trouvée dans le secret"
echo ""

# Vérifier le format
echo "🔎 Vérification du format..."

# Vérifier la longueur
KEY_LENGTH=${#CLEANED_KEY}
ORIGINAL_LENGTH=${#STRIPE_KEY}
if [ $KEY_LENGTH -lt 50 ]; then
  echo "⚠️  Avertissement: La clé semble trop courte (${KEY_LENGTH} caractères)"
fi

# Vérifier les guillemets
HAS_QUOTES=false
if [[ "$STRIPE_KEY" =~ ^[\"'] ]] || [[ "$STRIPE_KEY" =~ [\"']$ ]]; then
  HAS_QUOTES=true
  echo "⚠️  ATTENTION: La clé contient des guillemets !"
  echo "   Longueur originale: ${ORIGINAL_LENGTH} caractères"
  echo "   Longueur nettoyée: ${KEY_LENGTH} caractères"
  echo "   Valeur brute (premiers 30 chars): ${STRIPE_KEY:0:30}..."
  echo "   Valeur nettoyée (premiers 30 chars): ${CLEANED_KEY:0:30}..."
  echo ""
  echo "   💡 Il est recommandé de mettre à jour la clé sans guillemets"
fi

# Vérifier le préfixe
if [[ "$CLEANED_KEY" =~ ^pk_test_ ]]; then
  echo "✅ Mode: TEST (pk_test_)"
  MODE="test"
elif [[ "$CLEANED_KEY" =~ ^pk_live_ ]]; then
  echo "✅ Mode: LIVE (pk_live_)"
  MODE="live"
else
  echo "❌ Erreur: La clé ne commence pas par pk_test_ ou pk_live_"
  echo "   Préfixe actuel: ${CLEANED_KEY:0:10}..."
  exit 1
fi

# Afficher un aperçu de la clé (sans révéler la clé complète)
echo ""
echo "📝 Aperçu de la clé:"
echo "   ${CLEANED_KEY:0:20}...${CLEANED_KEY: -10}"
echo "   Longueur: ${KEY_LENGTH} caractères"
echo ""

# Vérifier dans les deployments
echo "🔍 Vérification dans les deployments..."
DEPLOYMENTS=$(kubectl get deployments -n ${NAMESPACE} -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")

if [ -z "$DEPLOYMENTS" ]; then
  echo "⚠️  Aucun deployment trouvé dans le namespace ${NAMESPACE}"
else
  for DEPLOYMENT in $DEPLOYMENTS; do
    if kubectl get deployment ${DEPLOYMENT} -n ${NAMESPACE} -o yaml | grep -q "${KEY_NAME}"; then
      echo "✅ ${DEPLOYMENT}: ${KEY_NAME} est référencée"
    else
      echo "⚠️  ${DEPLOYMENT}: ${KEY_NAME} n'est pas référencée"
    fi
  done
fi

echo ""
echo "✅ Vérification terminée!"
echo ""
echo "💡 Pour mettre à jour la clé:"
echo "   kubectl create secret generic ${SECRET_NAME} -n ${NAMESPACE} \\"
echo "     --from-literal=${KEY_NAME}='${CLEANED_KEY}' \\"
echo "     --dry-run=client -o yaml | kubectl apply -f -"
echo ""

