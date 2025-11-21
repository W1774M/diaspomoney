#!/bin/bash

# Script d'initialisation du cluster K3s pour DiaspoMoney
# Usage: ./scripts/init-k8s.sh

set -e

NAMESPACE=${NAMESPACE:-diaspomoney}

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

info "Initialisation du cluster K3s pour DiaspoMoney"

# Vérifier que kubectl est disponible
if ! command -v kubectl &> /dev/null; then
    error "kubectl n'est pas installé ou n'est pas dans le PATH"
fi

# 1. Créer le namespace
info "1. Création du namespace $NAMESPACE..."
if kubectl get namespace "$NAMESPACE" &> /dev/null; then
    warn "Le namespace $NAMESPACE existe déjà"
else
    kubectl create namespace "$NAMESPACE"
    info "✓ Namespace $NAMESPACE créé"
fi

# 2. Vérifier/créer la configuration du registry
info "2. Vérification de la configuration du registry..."
if [ ! -f "/etc/rancher/k3s/registries.yaml" ]; then
    warn "Fichier /etc/rancher/k3s/registries.yaml non trouvé"
    info "Création de la configuration..."
    sudo mkdir -p /etc/rancher/k3s
    sudo cp k8s/registries.yaml.example /etc/rancher/k3s/registries.yaml
    info "✓ Configuration créée. Éditez /etc/rancher/k3s/registries.yaml si nécessaire"
    warn "Redémarrez K3s après modification: sudo systemctl restart k3s"
else
    info "✓ Configuration du registry trouvée"
fi

# 3. Vérifier que Traefik est installé
info "3. Vérification de Traefik..."
if kubectl get pods -n kube-system | grep -q traefik; then
    info "✓ Traefik est installé"
else
    warn "Traefik n'est pas détecté dans kube-system"
    warn "Assurez-vous que Traefik est installé pour les Ingress"
fi

# 4. Vérifier les ressources nécessaires
info "4. Vérification des ressources nécessaires..."

# MongoDB
if kubectl get deployment mongodb -n "$NAMESPACE" &> /dev/null || \
   kubectl get statefulset mongodb -n "$NAMESPACE" &> /dev/null; then
    info "✓ MongoDB trouvé"
else
    warn "MongoDB non trouvé dans le namespace $NAMESPACE"
    warn "Déployez MongoDB avant de déployer l'application"
fi

# Redis
if kubectl get deployment redis -n "$NAMESPACE" &> /dev/null || \
   kubectl get statefulset redis -n "$NAMESPACE" &> /dev/null; then
    info "✓ Redis trouvé"
else
    warn "Redis non trouvé dans le namespace $NAMESPACE"
    warn "Déployez Redis avant de déployer l'application"
fi

# 5. Afficher le résumé
info "5. Résumé de l'initialisation:"
echo ""
echo "Namespace: $NAMESPACE"
kubectl get namespace "$NAMESPACE" 2>/dev/null || error "Namespace non accessible"
echo ""
echo "Pods dans le namespace:"
kubectl get pods -n "$NAMESPACE" 2>/dev/null || echo "Aucun pod"
echo ""
echo "Services dans le namespace:"
kubectl get svc -n "$NAMESPACE" 2>/dev/null || echo "Aucun service"
echo ""

info "Initialisation terminée!"
info ""
info "Prochaines étapes:"
info "1. Vérifier le registry: ./scripts/check-registry.sh"
info "2. Build et push l'image: pnpm k8s:dev"
info "3. Déployer l'application: ./scripts/deploy.sh dev"

