#!/bin/bash

set -e

ENV=$1
NO_CACHE=${2:-""}  # Option pour forcer un rebuild sans cache

# Vérifier que l'environnement est fourni
if [ -z "$ENV" ]; then
  echo "❌ Erreur: Vous devez spécifier un environnement"
  echo "   Usage: $0 <env> [--no-cache]"
  echo "   Exemples: $0 rct, $0 prod, $0 dev"
  exit 1
fi

# Vérifier que l'environnement est valide
if [ ! -d "k8s/app/${ENV}" ]; then
  echo "❌ Erreur: L'environnement ${ENV} n'existe pas"
  echo "   Environnements disponibles: $(ls -1 k8s/app/ 2>/dev/null | tr '\n' ' ' || echo 'aucun')"
  exit 1
fi

BUILD_DATE=$(date +'%Y%m%d-%H%M%S')
IMAGE_TAG="localhost:5000/diaspomoney:${ENV}-${BUILD_DATE}"
LATEST_TAG="localhost:5000/diaspomoney:${ENV}-latest"
NAMESPACE="diaspomoney"
SECRETS_FILE="k8s/secrets.yaml"

echo "==============================================="
echo "🚀 Déploiement ${ENV}"
echo "📦 Image : ${IMAGE_TAG}"
echo "📁 Namespace : ${NAMESPACE}"
echo "==============================================="

# S'assurer que le namespace existe avant d'appliquer quoi que ce soit
echo "🧩 Vérification du namespace ${NAMESPACE}..."
if ! kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1; then
  echo "📦 Création du namespace ${NAMESPACE}..."
  kubectl create namespace "${NAMESPACE}"
fi

# Appliquer les secrets Kubernetes (si le fichier existe)
# NOTE: ce fichier contient des placeholders "CHANGE_ME_*" par défaut.
# Il doit être rempli avant usage (ou remplacé via un mécanisme interne de ton infra).
if [ -f "${SECRETS_FILE}" ]; then
  echo "🔐 Application des secrets depuis ${SECRETS_FILE}..."
  kubectl apply -f "${SECRETS_FILE}" -n "${NAMESPACE}"
else
  echo "⚠️  Aucun fichier de secrets trouvé (${SECRETS_FILE})."
  echo "   Le déploiement continuera, mais les secrets doivent exister dans Kubernetes."
fi

# Récupérer la clé Stripe depuis le secret Kubernetes
echo "🔑 Récupération de la clé Stripe depuis le secret Kubernetes..."
STRIPE_KEY=$(kubectl get secret app-secrets -n ${NAMESPACE} -o jsonpath='{.data.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}' 2>/dev/null | base64 -d 2>/dev/null)

if [ -z "$STRIPE_KEY" ]; then
  echo "⚠️  Attention: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY non trouvée dans le secret Kubernetes"
  echo "   Vérifiez que le secret app-secrets existe et contient NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  echo "   Tentative de récupération depuis .env.local ou .env..."
  
  # Essayer de récupérer depuis un fichier .env local
  if [ -f ".env" ]; then
    STRIPE_KEY=$(grep "^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" ".env" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
  fi
fi

if [ -z "$STRIPE_KEY" ]; then
  echo "❌ Erreur: Impossible de récupérer NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  echo "   Veuillez la définir dans le secret Kubernetes ou dans un fichier .env"
  exit 1
fi

# Nettoyer la clé (enlever les guillemets et espaces)
STRIPE_KEY=$(echo "$STRIPE_KEY" | tr -d '"' | tr -d "'" | xargs)

# Vérifier le format de la clé
if [[ ! "$STRIPE_KEY" =~ ^pk_(test_|live_) ]]; then
  echo "⚠️  Avertissement: La clé Stripe ne commence pas par pk_test_ ou pk_live_"
  echo "   Préfixe actuel: ${STRIPE_KEY:0:10}..."
fi

echo "✅ Clé Stripe récupérée et nettoyée (${STRIPE_KEY:0:20}...)"

# Construire l'URL selon l'environnement
if [ "${ENV}" = "rct" ]; then
  APP_URL="https://rct.diaspomoney.fr"
elif [ "${ENV}" = "prod" ]; then
  APP_URL="https://diaspomoney.fr"
elif [ "${ENV}" = "dev" ]; then
  APP_URL="https://dev.diaspomoney.fr"
else
  APP_URL="https://${ENV}.diaspomoney.fr"
fi

# Build with proper build args
# Note: Ne pas mettre de guillemets autour de STRIPE_KEY car Docker les inclurait dans la valeur
echo "🏗️  Construction de l'image Docker..."
BUILD_ARGS="--build-arg ENV=${ENV} \
  --build-arg NODE_ENV=production \
  --build-arg NEXT_PUBLIC_APP_URL=\"${APP_URL}\" \
  --build-arg NEXT_PUBLIC_API_URL=\"${APP_URL}/api\" \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${STRIPE_KEY} \
  -t ${IMAGE_TAG} \
  -t ${LATEST_TAG} \
  -f Dockerfile"

# Ajouter --no-cache si demandé
if [ "${NO_CACHE}" = "--no-cache" ] || [ "${NO_CACHE}" = "no-cache" ]; then
  echo "⚠️  Rebuild sans cache (--no-cache activé)"
  BUILD_ARGS="--no-cache ${BUILD_ARGS}"
fi

# Vérifier les fichiers modifiés récemment avant le build
echo "🔍 Vérification des fichiers modifiés récemment..."
ONE_HOUR_AGO=$(date -d '1 hour ago' +'%Y-%m-%d %H:%M:%S' 2>/dev/null || date -v-1H +'%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "")
if [ -n "$ONE_HOUR_AGO" ]; then
  RECENT_FILES=$(find app components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec stat -c "%y %n" {} \; 2>/dev/null | awk -v cutoff="$ONE_HOUR_AGO" '$1 " " $2 > cutoff' | wc -l)
  if [ "$RECENT_FILES" -gt 0 ]; then
    echo "⚠️  ${RECENT_FILES} fichier(s) modifié(s) récemment - le build inclura ces modifications"
  fi
fi

docker build --progress=plain ${BUILD_ARGS} .

# Vérifier que l'image a été créée avec succès
if ! docker images ${IMAGE_TAG} --format "{{.Repository}}:{{.Tag}}" | grep -q "${ENV}-${BUILD_DATE}"; then
  echo "❌ Erreur: L'image ${IMAGE_TAG} n'a pas été créée"
  exit 1
fi

echo "✅ Image créée avec succès: ${IMAGE_TAG}"

# Push images
docker push ${IMAGE_TAG}
docker push ${LATEST_TAG}

# Vérifier que les images ont été poussées
if ! docker images ${LATEST_TAG} --format "{{.Repository}}:{{.Tag}}" | grep -q "${ENV}-latest"; then
  echo "❌ Erreur: L'image ${LATEST_TAG} n'a pas été trouvée localement"
  exit 1
fi

echo "✅ Images poussées vers le registry"

# Vérifier que les fichiers de déploiement existent
DEPLOYMENT_FILE="k8s/app/${ENV}/deployment.yaml"
SERVICE_FILE="k8s/app/${ENV}/service.yaml"
INGRESS_FILE="k8s/app/${ENV}/ingress.yaml"

if [ ! -f "${DEPLOYMENT_FILE}" ]; then
  echo "❌ Erreur: Le fichier ${DEPLOYMENT_FILE} n'existe pas"
  echo "   Vérifiez que l'environnement ${ENV} est correct (rct, prod, dev)"
  exit 1
fi

# Extraire le nom du deployment depuis le fichier YAML
DEPLOYMENT_NAME_FROM_YAML=$(grep "^  name:" "${DEPLOYMENT_FILE}" | head -1 | awk '{print $2}' || echo "")
if [ -z "$DEPLOYMENT_NAME_FROM_YAML" ]; then
  echo "❌ Erreur: Impossible d'extraire le nom du deployment depuis ${DEPLOYMENT_FILE}"
  exit 1
fi

echo "📋 Nom du deployment: ${DEPLOYMENT_NAME_FROM_YAML}"

# Check if deployment exists
if kubectl get deployment ${DEPLOYMENT_NAME_FROM_YAML} -n ${NAMESPACE} &>/dev/null; then
  echo "🔄 Mise à jour du déploiement existant..."
  # IMPORTANT:
  # - kubectl set image met à jour UNIQUEMENT l'image. Si des env vars changent dans le YAML
  #   (ex: NEXT_PUBLIC_APP_URL), elles ne seront PAS prises en compte.
  # - On applique donc le deployment.yaml (avec l'image taggée) pour garantir que la spec complète
  #   est synchronisée (image + env + resources + etc.).

  # Créer une copie temporaire du fichier pour modification
  TEMP_DEPLOYMENT_FILE=$(mktemp)
  cp "${DEPLOYMENT_FILE}" "${TEMP_DEPLOYMENT_FILE}"

  # Update image in deployment file temporarily (tag immuable pour forcer le rollout)
  sed -i "s|image: localhost:5000/diaspomoney:.*|image: ${IMAGE_TAG}|g" "${TEMP_DEPLOYMENT_FILE}"
  kubectl apply -f "${TEMP_DEPLOYMENT_FILE}" -n "${NAMESPACE}"

  # Nettoyer le fichier temporaire
  rm -f "${TEMP_DEPLOYMENT_FILE}"
else
  echo "📦 Création du déploiement (première fois)..."
  
  # Créer une copie temporaire du fichier pour modification
  TEMP_DEPLOYMENT_FILE=$(mktemp)
  cp "${DEPLOYMENT_FILE}" "${TEMP_DEPLOYMENT_FILE}"
  
    # Update image in deployment file temporarily
  sed -i "s|image: localhost:5000/diaspomoney:.*|image: ${IMAGE_TAG}|g" "${TEMP_DEPLOYMENT_FILE}"
  kubectl apply -f "${TEMP_DEPLOYMENT_FILE}" -n "${NAMESPACE}"
  
  # Nettoyer le fichier temporaire
  rm -f "${TEMP_DEPLOYMENT_FILE}"
  
  if [ -f "${SERVICE_FILE}" ]; then
    kubectl apply -f "${SERVICE_FILE}" -n "${NAMESPACE}"
  fi
  
  if [ -f "${INGRESS_FILE}" ]; then
    kubectl apply -f "${INGRESS_FILE}" -n "${NAMESPACE}"
  fi
fi

# Verify rollout
echo "⏳ Attente du déploiement..."
kubectl rollout status deployment/${DEPLOYMENT_NAME_FROM_YAML} -n ${NAMESPACE} --timeout=300s || {
  echo "⚠️  Le déploiement prend plus de temps que prévu"
  echo "   Vérifiez le statut avec: kubectl get pods -n ${NAMESPACE}"
  exit 1
}

# Vérifier que les pods utilisent bien la nouvelle image
echo "🔍 Vérification que les pods utilisent la nouvelle image..."
sleep 10
POD_IMAGES=$(kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME_FROM_YAML} -o jsonpath='{.items[*].status.containerStatuses[0].image}' 2>/dev/null | tr ' ' '\n' | sort -u)
POD_IMAGE_IDS=$(kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME_FROM_YAML} -o jsonpath='{.items[*].status.containerStatuses[0].imageID}' 2>/dev/null | tr ' ' '\n' | sort -u)

IMAGE_TAG_SHORT=$(echo "${IMAGE_TAG}" | sed 's|localhost:5000/diaspomoney:||')

# Vérifier que l'image attendue (tag immuable) est bien utilisée
POD_USES_EXPECTED_IMAGE=false
for pod_image in ${POD_IMAGES}; do
  if echo "${pod_image}" | grep -q "${IMAGE_TAG_SHORT}"; then
    POD_USES_EXPECTED_IMAGE=true
    break
  fi
done

if [ "${POD_USES_EXPECTED_IMAGE}" = "true" ]; then
  echo "✅ Les pods utilisent bien la nouvelle image: ${IMAGE_TAG}"
else
  echo "⚠️  Attention: Les pods peuvent ne pas utiliser la dernière image"
  echo "   Images des pods: ${POD_IMAGES}"
  echo "   Image attendue: ${IMAGE_TAG} (tag: ${IMAGE_TAG_SHORT})"
  echo "   imageID observés: ${POD_IMAGE_IDS}"
  echo "   Forcer un redémarrage..."
  kubectl rollout restart deployment/${DEPLOYMENT_NAME_FROM_YAML} -n ${NAMESPACE}
  echo "   Attente du redémarrage..."
  kubectl rollout status deployment/${DEPLOYMENT_NAME_FROM_YAML} -n ${NAMESPACE} --timeout=120s || true
fi

# Afficher le statut final
echo ""
echo "📊 Statut final des pods:"
kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME_FROM_YAML} -o wide

echo ""
echo "✅ Déploiement terminé: ${IMAGE_TAG}"
