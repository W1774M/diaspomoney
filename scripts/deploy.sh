#!/bin/bash

# Script de déploiement automatisé pour DiaspoMoney sur K3s
# Usage: ./scripts/deploy.sh [dev|rct|prod] [image-tag]

set -e

ENV=${1:-dev}
TAG=${2:-${ENV}}
REGISTRY=${REGISTRY:-localhost:5000}
NAMESPACE=${NAMESPACE:-diaspomoney}
IMAGE_NAME="diaspomoney"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Vérifier que l'environnement est valide
if [[ ! "$ENV" =~ ^(dev|rct|prod)$ ]]; then
    error "Environnement invalide: $ENV. Utilisez: dev, rct ou prod"
fi

info "Déploiement de DiaspoMoney - Environnement: $ENV"
info "Registry: $REGISTRY"
info "Image: $REGISTRY/$IMAGE_NAME:$TAG"

# Vérifier que kubectl est disponible
if ! command -v kubectl &> /dev/null; then
    error "kubectl n'est pas installé ou n'est pas dans le PATH"
fi

# Vérifier que le namespace existe
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    warn "Le namespace $NAMESPACE n'existe pas. Création..."
    kubectl create namespace "$NAMESPACE"
fi

# Vérifier que l'image existe dans le registry
info "Vérification de l'image dans le registry..."
if ! curl -s "http://$REGISTRY/v2/$IMAGE_NAME/tags/list" | grep -q "$TAG"; then
    warn "L'image $REGISTRY/$IMAGE_NAME:$TAG n'a pas été trouvée dans le registry"
    read -p "Voulez-vous builder et pusher l'image maintenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Build de l'image..."
        docker build -f Dockerfile -t "$REGISTRY/$IMAGE_NAME:$TAG" .
        info "Push de l'image..."
        docker push "$REGISTRY/$IMAGE_NAME:$TAG"
    else
        error "L'image doit être disponible dans le registry pour continuer"
    fi
fi

# Déterminer les fichiers de manifest selon l'environnement
case $ENV in
    dev)
        DEPLOYMENT_FILE="k8s/app/dev/deployment.yaml"
        SERVICE_FILE="k8s/app/dev/service.yaml"
        INGRESS_FILE="k8s/app/dev/ingress.yaml"
        APP_NAME="diaspomoney-dev"
        ;;
    rct)
        DEPLOYMENT_FILE="k8s/app/rct/deployment.yaml"
        SERVICE_FILE="k8s/app/rct/service.yaml"
        INGRESS_FILE="k8s/app/rct/ingress.yaml"
        APP_NAME="diaspomoney-rct"
        ;;
    prod)
        DEPLOYMENT_FILE="k8s/app/prod/deployment.yaml"
        SERVICE_FILE="k8s/app/prod/service.yaml"
        INGRESS_FILE="k8s/app/prod/ingress.yaml"
        APP_NAME="diaspomoney-app"
        ;;
esac

# Mettre à jour l'image dans le deployment
info "Mise à jour de l'image dans le deployment..."
if kubectl get deployment "$APP_NAME" -n "$NAMESPACE" &> /dev/null; then
    kubectl set image deployment/"$APP_NAME" \
        "$APP_NAME=$REGISTRY/$IMAGE_NAME:$TAG" \
        -n "$NAMESPACE"
else
    info "Création du deployment..."
    # Remplacer l'image dans le fichier temporairement
    sed "s|localhost:5000/diaspomoney:$ENV|$REGISTRY/$IMAGE_NAME:$TAG|g" "$DEPLOYMENT_FILE" | \
        kubectl apply -f -
fi

# Appliquer le service
info "Application du service..."
kubectl apply -f "$SERVICE_FILE"

# Appliquer l'ingress
info "Application de l'ingress..."
kubectl apply -f "$INGRESS_FILE"

# Attendre que le deployment soit prêt
info "Attente du rollout..."
kubectl rollout status deployment/"$APP_NAME" -n "$NAMESPACE" --timeout=5m

# Afficher le statut
info "Statut du déploiement:"
kubectl get pods -n "$NAMESPACE" -l app="$APP_NAME"
kubectl get svc -n "$NAMESPACE" | grep "$APP_NAME"
kubectl get ingress -n "$NAMESPACE" | grep "$APP_NAME"

info "Déploiement terminé avec succès!"
info "Pour voir les logs: kubectl logs -l app=$APP_NAME -n $NAMESPACE --tail=200"
