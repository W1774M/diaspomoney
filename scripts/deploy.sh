#!/bin/bash

# Ne pas arrêter immédiatement en cas d'erreur pour pouvoir afficher les détails
set +e

ENV=$1
NO_CACHE=${2:-""}

# Variables globales pour la progression
TOTAL_STEPS=8
CURRENT_STEP=0

# Variable pour le spinner
SPINNER_COUNTER=0

# Fonction pour afficher une barre de progression dynamique avec animation
show_progress() {
  local step_name="$1"
  # Calculer le pourcentage pour l'étape en cours (CURRENT_STEP + 1)
  local step_num=$((CURRENT_STEP + 1))
  local percent=$((step_num * 100 / TOTAL_STEPS))
  
  # Calculer le nombre de caractères remplis
  local filled=$((percent / 5))
  local empty=$((20 - filled))
  
  # Animation spinner avec caractères ASCII simples (compatibles avec tous les terminaux)
  local spinner_chars=("|" "/" "-" "\\")
  SPINNER_COUNTER=$((SPINNER_COUNTER + 1))
  local spinner_idx=$((SPINNER_COUNTER % ${#spinner_chars[@]}))
  local spinner=${spinner_chars[$spinner_idx]}
  
  # Afficher sur la même ligne avec retour chariot
  printf "\r%s [%3d%%] %-35s [" "$spinner" "$percent" "$step_name"
  # Utiliser des caractères ASCII simples pour la barre
  printf "%${filled}s" | tr ' ' '#'
  printf "%${empty}s" | tr ' ' '.'
  printf "]"
  
  # Forcer l'affichage immédiat
  printf ""
}

# Fonction pour compléter la barre et passer à la ligne suivante
complete_step() {
  CURRENT_STEP=$((CURRENT_STEP + 1))
  local step_name="$1"
  local percent=$((CURRENT_STEP * 100 / TOTAL_STEPS))
  
  # Compléter la barre avec un checkmark
  printf "\r✓ [%3d%%] %-35s [" "$percent" "$step_name"
  printf "%20s" | tr ' ' '#'
  printf "]"
  echo ""
}

show_success() {
  echo "✅ $1"
}

show_error() {
  echo "❌ $1" >&2
}

# Fonction pour afficher les détails d'une erreur
show_error_details() {
  local error_msg="$1"
  local exit_code="${2:-1}"
  local command="${3:-}"
  local output="${4:-}"
  
  echo "" >&2
  echo "═══════════════════════════════════════════════════════════" >&2
  echo "❌ ERREUR: $error_msg" >&2
  echo "═══════════════════════════════════════════════════════════" >&2
  echo "Code de sortie: $exit_code" >&2
  
  if [ -n "$command" ]; then
    echo "Commande exécutée: $command" >&2
  fi
  
  if [ -n "$output" ]; then
    echo "" >&2
    echo "Sortie de la commande:" >&2
    echo "───────────────────────────────────────────────────────────" >&2
    echo "$output" >&2
    echo "───────────────────────────────────────────────────────────" >&2
  fi
  
  echo "═══════════════════════════════════════════════════════════" >&2
  echo "" >&2
}

show_warning() {
  echo "⚠️  $1"
}

show_info() {
  echo "ℹ️  $1"
}

# Vérifier que l'environnement est fourni
if [ -z "$ENV" ]; then
  show_error "Vous devez spécifier un environnement"
  echo ""
  echo "   Usage: $0 <env> [--no-cache]"
  echo "   Exemples: $0 rct | $0 prod | $0 dev"
  exit 1
fi

# Valider le format de l'environnement
if [[ ! "$ENV" =~ ^[a-z0-9-]+$ ]]; then
  show_error "Format d'environnement invalide: '${ENV}'"
  exit 1
fi

# Vérifier que l'environnement existe
if [ ! -d "k8s/app/${ENV}" ]; then
  show_error "L'environnement '${ENV}' n'existe pas"
  exit 1
fi

BUILD_DATE=$(date +'%Y%m%d-%H%M%S')
IMAGE_TAG="localhost:5000/diaspomoney:${ENV}-${BUILD_DATE}"
LATEST_TAG="localhost:5000/diaspomoney:${ENV}-latest"
NAMESPACE="diaspomoney"
SECRETS_FILE="k8s/app/secrets.yaml"

echo "==============================================="
echo "🚀 Déploiement ${ENV}"
echo "📦 ${IMAGE_TAG}"
echo "==============================================="
echo ""

# Étape 1: Vérification du namespace
show_progress "Vérification du namespace"
KUBECTL_OUTPUT=$(kubectl get namespace "${NAMESPACE}" 2>&1)
KUBECTL_EXIT=$?

if [ $KUBECTL_EXIT -ne 0 ]; then
  CREATE_OUTPUT=$(kubectl create namespace "${NAMESPACE}" 2>&1)
  CREATE_EXIT=$?
  if [ $CREATE_EXIT -ne 0 ]; then
    complete_step "Vérification du namespace"
    show_error_details "Impossible de créer le namespace ${NAMESPACE}" "$CREATE_EXIT" "kubectl create namespace ${NAMESPACE}" "$CREATE_OUTPUT"
    exit 1
  fi
fi
complete_step "Vérification du namespace"
show_success "Namespace ${NAMESPACE} prêt"

# Étape 2: Application des secrets
show_progress "Application des secrets"
if [ -f "${SECRETS_FILE}" ]; then
  KUBECTL_OUTPUT=$(kubectl apply -f "${SECRETS_FILE}" -n "${NAMESPACE}" 2>&1)
  KUBECTL_EXIT=$?
  if [ $KUBECTL_EXIT -ne 0 ]; then
    complete_step "Application des secrets"
    show_error_details "Échec de l'application des secrets" "$KUBECTL_EXIT" "kubectl apply -f ${SECRETS_FILE} -n ${NAMESPACE}" "$KUBECTL_OUTPUT"
    exit 1
  fi
  complete_step "Application des secrets"
  show_success "Secrets appliqués"
else
  complete_step "Application des secrets"
  show_warning "Fichier de secrets non trouvé (continuation)"
fi

# Déterminer quelle clé Stripe utiliser
if [ "${ENV}" = "prod" ]; then
  STRIPE_KEY_NAME="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_PROD"
  EXPECTED_PREFIX="pk_live_"
  ENV_TYPE="production"
else
  STRIPE_KEY_NAME="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  EXPECTED_PREFIX="pk_test_"
  ENV_TYPE="test"
fi

# Étape 3: Récupération de la clé Stripe
show_progress "Récupération de la clé Stripe (${ENV_TYPE})"
STRIPE_KEY=$(kubectl get secret app-secrets -n ${NAMESPACE} -o jsonpath="{.data.${STRIPE_KEY_NAME}}" 2>/dev/null | base64 -d 2>/dev/null)

if [ -z "$STRIPE_KEY" ]; then
  if [ -f ".env" ]; then
    STRIPE_KEY=$(grep "^${STRIPE_KEY_NAME}=" ".env" | cut -d '=' -f2- | tr -d '"' | tr -d "'" 2>/dev/null || true)
  fi
  
  if [ -z "$STRIPE_KEY" ] && [ "${ENV}" != "prod" ]; then
    if [ -f ".env" ]; then
      STRIPE_KEY=$(grep "^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" ".env" | cut -d '=' -f2- | tr -d '"' | tr -d "'" 2>/dev/null || true)
    fi
  fi
fi

if [ -z "$STRIPE_KEY" ]; then
  complete_step "Récupération de la clé Stripe (${ENV_TYPE})"
  show_error "Impossible de récupérer ${STRIPE_KEY_NAME}"
  exit 1
fi

STRIPE_KEY=$(echo "$STRIPE_KEY" | tr -d '"' | tr -d "'" | xargs)
complete_step "Récupération de la clé Stripe (${ENV_TYPE})"

# Vérifier le format de la clé
if [[ ! "$STRIPE_KEY" =~ ^${EXPECTED_PREFIX} ]]; then
  if [ "${ENV}" = "prod" ] && [[ "$STRIPE_KEY" =~ ^pk_test_ ]]; then
    show_error "ERREUR: Clé TEST en PRODUCTION!"
    read -p "   Continuer? (oui/non): " -r
    if [[ ! $REPLY =~ ^[Oo][Uu][Ii]$ ]]; then
      exit 1
    fi
  elif [ "${ENV}" != "prod" ] && [[ "$STRIPE_KEY" =~ ^pk_live_ ]]; then
    show_warning "Clé LIVE en ${ENV_TYPE}!"
    read -p "   Continuer? (oui/non): " -r
    if [[ ! $REPLY =~ ^[Oo][Uu][Ii]$ ]]; then
      exit 1
    fi
  fi
fi

show_success "Clé Stripe récupérée (${STRIPE_KEY:0:20}...)"

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

# Étape 4: Construction de l'image Docker
show_progress "Construction de l'image Docker"
BUILD_ARGS="--build-arg ENV=${ENV} \
  --build-arg NODE_ENV=production \
  --build-arg NEXTAUTH_URL=${APP_URL} \
  --build-arg APP_URL=${APP_URL} \
  --build-arg API_URL=${APP_URL}/api \
  --build-arg NEXT_PUBLIC_APP_URL=${APP_URL} \
  --build-arg NEXT_PUBLIC_API_URL=${APP_URL}/api \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${STRIPE_KEY} \
  -t ${IMAGE_TAG} \
  -t ${LATEST_TAG} \
  -f Dockerfile"

if [ "${NO_CACHE}" = "--no-cache" ] || [ "${NO_CACHE}" = "no-cache" ]; then
  BUILD_ARGS="--no-cache ${BUILD_ARGS}"
fi

# Construire l'image avec progression dynamique
# Afficher une animation pendant le build
(
  docker build --progress=plain ${BUILD_ARGS} . >/tmp/docker-build.log 2>&1 &
  DOCKER_PID=$!
  
  # Animation pendant le build
  while kill -0 $DOCKER_PID 2>/dev/null; do
    show_progress "Construction de l'image Docker"
    sleep 0.3
  done
  
  wait $DOCKER_PID
  BUILD_EXIT=$?
  
  if [ $BUILD_EXIT -ne 0 ]; then
    complete_step "Construction de l'image Docker"
    BUILD_LOG=$(cat /tmp/docker-build.log 2>/dev/null || echo "Impossible de lire le log de build")
    # Afficher la commande sur une seule ligne pour éviter les répétitions
    BUILD_CMD="docker build --build-arg ENV=${ENV} --build-arg NODE_ENV=production --build-arg NEXTAUTH_URL=${APP_URL} --build-arg APP_URL=${APP_URL} --build-arg API_URL=${APP_URL}/api --build-arg NEXT_PUBLIC_APP_URL=${APP_URL} --build-arg NEXT_PUBLIC_API_URL=${APP_URL}/api --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=\${STRIPE_KEY} -t ${IMAGE_TAG} -t ${LATEST_TAG} -f Dockerfile ."
    show_error_details "Échec de la construction de l'image Docker" "$BUILD_EXIT" "$BUILD_CMD" "$BUILD_LOG"
    exit 1
  fi
)

DOCKER_IMAGES_OUTPUT=$(docker images ${IMAGE_TAG} --format "{{.Repository}}:{{.Tag}}" 2>&1)
DOCKER_IMAGES_EXIT=$?
if [ $DOCKER_IMAGES_EXIT -ne 0 ] || ! echo "$DOCKER_IMAGES_OUTPUT" | grep -q "${ENV}-${BUILD_DATE}"; then
  complete_step "Construction de l'image Docker"
  ALL_IMAGES=$(docker images localhost:5000/diaspomoney --format "{{.Repository}}:{{.Tag}}" 2>&1)
  show_error_details "L'image ${IMAGE_TAG} n'a pas été créée" "$DOCKER_IMAGES_EXIT" "docker images ${IMAGE_TAG}" "$DOCKER_IMAGES_OUTPUT\n\nImages disponibles:\n$ALL_IMAGES"
  exit 1
fi

complete_step "Construction de l'image Docker"
show_success "Image créée: ${IMAGE_TAG}"

# Étape 5: Push des images
show_progress "Envoi des images vers le registry"
(
  docker push ${IMAGE_TAG} >/tmp/docker-push1.log 2>&1 &
  PUSH1_PID=$!
  while kill -0 $PUSH1_PID 2>/dev/null; do
    show_progress "Envoi de l'image (tagged)"
    sleep 0.3
  done
  wait $PUSH1_PID
  PUSH1_EXIT=$?
  
  if [ $PUSH1_EXIT -ne 0 ]; then
    PUSH1_LOG=$(cat /tmp/docker-push1.log 2>/dev/null || echo "Impossible de lire le log")
    complete_step "Envoi des images vers le registry"
    show_error_details "Échec de l'envoi de l'image ${IMAGE_TAG}" "$PUSH1_EXIT" "docker push ${IMAGE_TAG}" "$PUSH1_LOG"
  exit 1
fi

  docker push ${LATEST_TAG} >/tmp/docker-push2.log 2>&1 &
  PUSH2_PID=$!
  while kill -0 $PUSH2_PID 2>/dev/null; do
    show_progress "Envoi de l'image (latest)"
    sleep 0.3
  done
  wait $PUSH2_PID
  PUSH2_EXIT=$?
  
  if [ $PUSH2_EXIT -ne 0 ]; then
    PUSH2_LOG=$(cat /tmp/docker-push2.log 2>/dev/null || echo "Impossible de lire le log")
    complete_step "Envoi des images vers le registry"
    show_error_details "Échec de l'envoi de l'image ${LATEST_TAG}" "$PUSH2_EXIT" "docker push ${LATEST_TAG}" "$PUSH2_LOG"
    exit 1
  fi
)
complete_step "Envoi des images vers le registry"
show_success "Images envoyées"

# Étape 6: Préparation du déploiement
show_progress "Préparation du déploiement"
DEPLOYMENT_FILE="k8s/app/${ENV}/deployment.yaml"
SERVICE_FILE="k8s/app/${ENV}/service.yaml"
INGRESS_FILE="k8s/app/${ENV}/ingress.yaml"

if [ ! -f "${DEPLOYMENT_FILE}" ]; then
  complete_step "Préparation du déploiement"
  show_error_details "Le fichier ${DEPLOYMENT_FILE} n'existe pas" "1" "test -f ${DEPLOYMENT_FILE}" "Fichier introuvable: ${DEPLOYMENT_FILE}"
  exit 1
fi

DEPLOYMENT_NAME_FROM_YAML=$(grep "^  name:" "${DEPLOYMENT_FILE}" 2>&1 | head -1 | awk '{print $2}' || echo "")
if [ -z "$DEPLOYMENT_NAME_FROM_YAML" ]; then
  complete_step "Préparation du déploiement"
  FILE_CONTENT=$(head -20 "${DEPLOYMENT_FILE}" 2>&1 || echo "Impossible de lire le fichier")
  show_error_details "Impossible d'extraire le nom du deployment" "1" "grep '^  name:' ${DEPLOYMENT_FILE}" "Contenu du fichier (20 premières lignes):\n$FILE_CONTENT"
  exit 1
fi

complete_step "Préparation du déploiement"
show_success "Deployment: ${DEPLOYMENT_NAME_FROM_YAML}"

# Étape 7: Application du déploiement
show_progress "Application du déploiement"
  TEMP_DEPLOYMENT_FILE=$(mktemp)
  cp "${DEPLOYMENT_FILE}" "${TEMP_DEPLOYMENT_FILE}"
  sed -i "s|image: localhost:5000/diaspomoney:.*|image: ${IMAGE_TAG}|g" "${TEMP_DEPLOYMENT_FILE}"

KUBECTL_GET_OUTPUT=$(kubectl get deployment ${DEPLOYMENT_NAME_FROM_YAML} -n ${NAMESPACE} 2>&1)
KUBECTL_GET_EXIT=$?

if [ $KUBECTL_GET_EXIT -eq 0 ]; then
  # Déploiement existe, mise à jour
  KUBECTL_APPLY_OUTPUT=$(kubectl apply -f "${TEMP_DEPLOYMENT_FILE}" -n "${NAMESPACE}" 2>&1)
  KUBECTL_APPLY_EXIT=$?
  if [ $KUBECTL_APPLY_EXIT -ne 0 ]; then
    complete_step "Application du déploiement"
    show_error_details "Échec de la mise à jour du déploiement" "$KUBECTL_APPLY_EXIT" "kubectl apply -f ${TEMP_DEPLOYMENT_FILE} -n ${NAMESPACE}" "$KUBECTL_APPLY_OUTPUT"
  rm -f "${TEMP_DEPLOYMENT_FILE}"
    exit 1
  fi
  complete_step "Application du déploiement"
  show_success "Déploiement mis à jour"
else
  # Nouveau déploiement
  KUBECTL_APPLY_OUTPUT=$(kubectl apply -f "${TEMP_DEPLOYMENT_FILE}" -n "${NAMESPACE}" 2>&1)
  KUBECTL_APPLY_EXIT=$?
  if [ $KUBECTL_APPLY_EXIT -ne 0 ]; then
    complete_step "Application du déploiement"
    show_error_details "Échec de la création du déploiement" "$KUBECTL_APPLY_EXIT" "kubectl apply -f ${TEMP_DEPLOYMENT_FILE} -n ${NAMESPACE}" "$KUBECTL_APPLY_OUTPUT"
  rm -f "${TEMP_DEPLOYMENT_FILE}"
    exit 1
  fi
  
  if [ -f "${SERVICE_FILE}" ]; then
    KUBECTL_SVC_OUTPUT=$(kubectl apply -f "${SERVICE_FILE}" -n "${NAMESPACE}" 2>&1)
    KUBECTL_SVC_EXIT=$?
    if [ $KUBECTL_SVC_EXIT -ne 0 ]; then
      show_warning "Échec de l'application du service: $KUBECTL_SVC_OUTPUT"
  fi
  fi
  if [ -f "${INGRESS_FILE}" ]; then
    KUBECTL_ING_OUTPUT=$(kubectl apply -f "${INGRESS_FILE}" -n "${NAMESPACE}" 2>&1)
    KUBECTL_ING_EXIT=$?
    if [ $KUBECTL_ING_EXIT -ne 0 ]; then
      show_warning "Échec de l'application de l'ingress: $KUBECTL_ING_OUTPUT"
    fi
  fi
  complete_step "Application du déploiement"
  show_success "Déploiement créé"
fi

# Nettoyer le fichier temporaire
rm -f "${TEMP_DEPLOYMENT_FILE}"

# Étape 8: Attente du rollout avec progression dynamique
show_progress "Attente du déploiement"
# Afficher la progression du rollout avec animation
(
  kubectl rollout status deployment/${DEPLOYMENT_NAME_FROM_YAML} -n ${NAMESPACE} --timeout=300s >/dev/null 2>&1 &
  ROLLOUT_PID=$!
  
  # Animation pendant l'attente
  while kill -0 $ROLLOUT_PID 2>/dev/null; do
    show_progress "Attente du déploiement"
    sleep 0.5
  done
  
  wait $ROLLOUT_PID
  ROLLOUT_EXIT=$?
  
  if [ $ROLLOUT_EXIT -ne 0 ]; then
    complete_step "Attente du déploiement"
    ROLLOUT_DESCRIBE=$(kubectl describe deployment/${DEPLOYMENT_NAME_FROM_YAML} -n ${NAMESPACE} 2>&1 | tail -30)
    ROLLOUT_PODS=$(kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME_FROM_YAML} 2>&1)
    ROLLOUT_EVENTS=$(kubectl get events -n ${NAMESPACE} --sort-by='.lastTimestamp' 2>&1 | tail -10)
    show_error_details "Le déploiement a échoué ou a pris trop de temps" "$ROLLOUT_EXIT" "kubectl rollout status deployment/${DEPLOYMENT_NAME_FROM_YAML} -n ${NAMESPACE}" "Description du déploiement:\n$ROLLOUT_DESCRIBE\n\nPods:\n$ROLLOUT_PODS\n\nÉvénements récents:\n$ROLLOUT_EVENTS"
  exit 1
  fi
)
complete_step "Attente du déploiement"

# Vérification rapide de l'image
sleep 5
POD_IMAGES=$(kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME_FROM_YAML} -o jsonpath='{.items[*].status.containerStatuses[0].image}' 2>/dev/null | tr ' ' '\n' | sort -u)
IMAGE_TAG_SHORT=$(echo "${IMAGE_TAG}" | sed 's|localhost:5000/diaspomoney:||')
POD_USES_EXPECTED_IMAGE=false
for pod_image in ${POD_IMAGES}; do
  if echo "${pod_image}" | grep -q "${IMAGE_TAG_SHORT}"; then
    POD_USES_EXPECTED_IMAGE=true
    break
  fi
done

if [ "${POD_USES_EXPECTED_IMAGE}" != "true" ]; then
  show_warning "Redémarrage des pods pour forcer la nouvelle image"
  kubectl rollout restart deployment/${DEPLOYMENT_NAME_FROM_YAML} -n ${NAMESPACE} >/dev/null 2>&1
  kubectl rollout status deployment/${DEPLOYMENT_NAME_FROM_YAML} -n ${NAMESPACE} --timeout=120s >/dev/null 2>&1 || true
fi

echo ""
echo "==============================================="
show_success "Déploiement terminé: ${IMAGE_TAG}"
echo "==============================================="
echo ""
show_info "Statut des pods:"
kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME_FROM_YAML} --no-headers 2>/dev/null | head -3 || true
