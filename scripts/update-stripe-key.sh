#!/bin/bash

# Script pour mettre à jour NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY dans le secret Kubernetes
# Usage: ./scripts/update-stripe-key.sh [namespace|env] [key-value]
#   Si un environnement est fourni (rct, prod, dev), utilise le namespace diaspomoney

set -e

INPUT=${1:-"diaspomoney"}
NEW_KEY=${2:-""}
SECRET_NAME="app-secrets"
KEY_NAME="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"

# Si l'input est un environnement connu, utiliser le namespace diaspomoney
if [[ "$INPUT" =~ ^(rct|prod|dev)$ ]]; then
  NAMESPACE="diaspomoney"
  ENV=$INPUT
else
  NAMESPACE=$INPUT
fi

if [ -z "$NEW_KEY" ]; then
  echo "❌ Erreur: Vous devez fournir la nouvelle clé"
  echo ""
  echo "Usage: $0 [namespace|env] [key-value]"
  echo ""
  echo "Exemples:"
  echo "  $0 diaspomoney pk_test_51S7G0dArnazXOChT..."
  echo "  $0 rct pk_test_51S7G0dArnazXOChT..."
  echo "  $0 prod pk_live_51S7G0dArnazXOChT..."
  exit 1
fi

# Nettoyer la clé (enlever les guillemets et espaces)
CLEANED_KEY=$(echo "$NEW_KEY" | tr -d '"' | tr -d "'" | xargs)

# Vérifier le format
if [[ ! "$CLEANED_KEY" =~ ^pk_(test_|live_) ]]; then
  echo "❌ Erreur: La clé doit commencer par pk_test_ ou pk_live_"
  echo "   Préfixe fourni: ${CLEANED_KEY:0:10}..."
  exit 1
fi

if [ -n "$ENV" ]; then
  echo "🔑 Mise à jour de ${KEY_NAME} pour l'environnement ${ENV} dans le namespace ${NAMESPACE}..."
else
  echo "🔑 Mise à jour de ${KEY_NAME} dans le namespace ${NAMESPACE}..."
fi
echo ""

# Vérifier si le secret existe
if ! kubectl get secret ${SECRET_NAME} -n ${NAMESPACE} > /dev/null 2>&1; then
  echo "📝 Création du secret ${SECRET_NAME}..."
  kubectl create secret generic ${SECRET_NAME} -n ${NAMESPACE} \
    --from-literal=${KEY_NAME}="${CLEANED_KEY}"
  echo "✅ Secret créé avec succès"
else
  echo "📝 Mise à jour du secret ${SECRET_NAME}..."
  
  # Vérifier si Python est disponible
  if command -v python3 >/dev/null 2>&1; then
    # Utiliser Python pour mettre à jour le secret de manière fiable
    TEMP_SCRIPT=$(mktemp)
    cat > "${TEMP_SCRIPT}" << 'PYTHON_EOF'
import sys
import json
import base64
import subprocess

namespace = sys.argv[1]
secret_name = sys.argv[2]
key_name = sys.argv[3]
new_value = sys.argv[4]

# Récupérer le secret existant
result = subprocess.run(
    ['kubectl', 'get', 'secret', secret_name, '-n', namespace, '-o', 'json'],
    capture_output=True,
    text=True
)

if result.returncode != 0:
    print(f"Erreur lors de la récupération du secret: {result.stderr}", file=sys.stderr)
    sys.exit(1)

secret = json.loads(result.stdout)

# Encoder la nouvelle valeur en base64
encoded_value = base64.b64encode(new_value.encode('utf-8')).decode('utf-8')

# Mettre à jour la clé
if 'data' not in secret:
    secret['data'] = {}
secret['data'][key_name] = encoded_value

# Supprimer les métadonnées qui ne doivent pas être présentes
if 'metadata' in secret:
    secret['metadata'].pop('resourceVersion', None)
    secret['metadata'].pop('uid', None)
    secret['metadata'].pop('creationTimestamp', None)
    secret['metadata'].pop('managedFields', None)

# Appliquer le secret mis à jour
apply_result = subprocess.run(
    ['kubectl', 'apply', '-f', '-'],
    input=json.dumps(secret),
    text=True,
    capture_output=True
)

if apply_result.returncode != 0:
    print(f"Erreur lors de l'application du secret: {apply_result.stderr}", file=sys.stderr)
    sys.exit(1)

print("Secret mis à jour avec succès")
PYTHON_EOF

    python3 "${TEMP_SCRIPT}" "${NAMESPACE}" "${SECRET_NAME}" "${KEY_NAME}" "${CLEANED_KEY}"
    PYTHON_EXIT_CODE=$?
    
    rm -f "${TEMP_SCRIPT}"
    
    if [ $PYTHON_EXIT_CODE -ne 0 ]; then
      echo "❌ Erreur lors de la mise à jour du secret avec Python"
      echo "   Tentative avec une méthode alternative..."
      # Fallback vers la méthode kubectl create
      PYTHON_AVAILABLE=false
    else
      PYTHON_AVAILABLE=true
    fi
  else
    PYTHON_AVAILABLE=false
  fi
  
  # Fallback : utiliser kubectl create avec toutes les clés existantes
  if [ "$PYTHON_AVAILABLE" = "false" ]; then
    echo "⚠️  Python non disponible, utilisation d'une méthode alternative..."
    echo "   Note: Cette méthode nécessite que toutes les valeurs du secret soient accessibles"
    
    # Méthode simple : utiliser kubectl patch avec une valeur base64 correctement encodée
    ENCODED_KEY=$(echo -n "${CLEANED_KEY}" | base64 -w 0 2>/dev/null || echo -n "${CLEANED_KEY}" | base64)
    
    # Utiliser kubectl patch avec un fichier JSON temporaire pour éviter les problèmes d'échappement
    TEMP_PATCH_FILE=$(mktemp)
    cat > "${TEMP_PATCH_FILE}" << EOF
[
  {
    "op": "replace",
    "path": "/data/${KEY_NAME}",
    "value": "${ENCODED_KEY}"
  }
]
EOF
    
    kubectl patch secret ${SECRET_NAME} -n ${NAMESPACE} \
      --type='json' \
      --patch-file="${TEMP_PATCH_FILE}"
    
    PATCH_EXIT_CODE=$?
    rm -f "${TEMP_PATCH_FILE}"
    
    if [ $PATCH_EXIT_CODE -ne 0 ]; then
      echo "❌ Erreur: Impossible de mettre à jour le secret"
      echo "   Veuillez installer Python 3 ou utiliser kubectl directement"
      exit 1
    fi
  fi
  
  echo "✅ Secret mis à jour avec succès"
fi

echo ""
echo "📋 Vérification de la clé mise à jour..."
UPDATED_KEY=$(kubectl get secret ${SECRET_NAME} -n ${NAMESPACE} -o jsonpath="{.data.${KEY_NAME}}" 2>/dev/null | base64 -d 2>/dev/null || echo "")

if [ "$UPDATED_KEY" = "$CLEANED_KEY" ]; then
  echo "✅ La clé a été correctement mise à jour"
  echo "   Aperçu: ${CLEANED_KEY:0:20}...${CLEANED_KEY: -10}"
else
  echo "⚠️  La clé mise à jour ne correspond pas à la clé fournie"
  echo "   Attendu: ${CLEANED_KEY:0:20}..."
  echo "   Obtenu: ${UPDATED_KEY:0:20}..."
fi

echo ""
echo "💡 Pour redémarrer les pods et appliquer la nouvelle clé:"
echo "   kubectl rollout restart deployment -n ${NAMESPACE}"

