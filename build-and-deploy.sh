#!/bin/bash

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Build et déploiement de DiaspoMoney RCT ===${NC}\n"

# Variables
IMAGE_NAME="diaspomoney-rct"
IMAGE_TAG="latest"
REGISTRY="localhost:5000"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
NAMESPACE="diaspomoney"

# Étape 1: Build de l'image Docker
echo -e "${YELLOW}[1/4] Construction de l'image Docker...${NC}"
docker build -t ${FULL_IMAGE} .

# Étape 2: Push vers le registry
echo -e "${YELLOW}[2/4] Envoi de l'image vers le registry...${NC}"
docker push ${FULL_IMAGE}

# Étape 3: Application des ressources Kubernetes
echo -e "${YELLOW}[3/4] Déploiement des ressources Kubernetes...${NC}"
kubectl apply -f k8s/app/rct/middleware-security.yaml
kubectl apply -f k8s/tls-options.yaml
kubectl apply -f k8s/app/rct/deployment.yaml
kubectl apply -f k8s/app/rct/service.yaml
kubectl apply -f k8s/app/rct/ingress.yaml
kubectl apply -f k8s/app/rct/ingress-acme.yaml

# Forcer le redéploiement pour s'assurer que la nouvelle image est utilisée
echo -e "${YELLOW}Forçage du redéploiement avec la nouvelle image...${NC}"
kubectl rollout restart deployment/diaspomoney-rct -n ${NAMESPACE}

# Étape 4: Vérification du déploiement
echo -e "${YELLOW}[4/4] Vérification du déploiement...${NC}"
kubectl rollout status deployment/diaspomoney-rct -n ${NAMESPACE} --timeout=60s

echo -e "\n${GREEN}✓ Déploiement terminé avec succès !${NC}"
echo -e "${GREEN}La page diaspomoney-rct est maintenant accessible sur https://rct.diaspomoney.fr${NC}\n"

# Affichage des informations utiles
echo -e "${BLUE}Commandes utiles:${NC}"
echo "  - Voir les pods: kubectl get pods -n ${NAMESPACE} -l app=diaspomoney-rct"
echo "  - Voir les logs: kubectl logs -n ${NAMESPACE} -l app=diaspomoney-rct -f"
echo "  - Voir le service: kubectl get svc -n ${NAMESPACE} diaspomoney-rct-service"
echo "  - Voir l'ingress: kubectl get ingressroute -n ${NAMESPACE} diaspomoney-rct-ingressroute-https"

