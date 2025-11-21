#!/bin/bash

# Script de vérification du registry Docker pour K3s
# Usage: ./scripts/check-registry.sh [registry-url]

# Ne pas arrêter le script en cas d'erreur (on veut continuer même si kubectl n'est pas configuré)
set +e

REGISTRY=${1:-localhost:5000}
NAMESPACE=${NAMESPACE:-diaspomoney}
IMAGE_NAME="diaspomoney"

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
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

info "Vérification du registry: $REGISTRY"

# 1. Vérifier que le registry est accessible
info "1. Test de connectivité au registry..."
if curl -s --max-time 5 "http://$REGISTRY/v2/" > /dev/null; then
    info "✓ Registry accessible"
else
    error "✗ Registry non accessible à http://$REGISTRY"
    exit 1
fi

# 2. Lister les tags disponibles
info "2. Liste des tags disponibles pour $IMAGE_NAME..."
TAGS=$(curl -s "http://$REGISTRY/v2/$IMAGE_NAME/tags/list" 2>/dev/null | grep -o '\[.*\]' | tr -d '[]' | tr ',' '\n' | tr -d '"' || echo "")
if [ -z "$TAGS" ]; then
    warn "Aucun tag trouvé pour $IMAGE_NAME"
else
    info "Tags disponibles:"
    echo "$TAGS" | sed 's/^/  - /'
fi

# 3. Vérifier la configuration K3s
info "3. Vérification de la configuration K3s..."
if [ -f "/etc/rancher/k3s/registries.yaml" ]; then
    info "✓ Fichier registries.yaml trouvé:"
    cat /etc/rancher/k3s/registries.yaml
else
    warn "Fichier /etc/rancher/k3s/registries.yaml non trouvé"
    info "Création d'un exemple de configuration..."
    cat <<EOF
# Exemple de configuration pour /etc/rancher/k3s/registries.yaml
mirrors:
  $REGISTRY:
    endpoint:
      - "http://$REGISTRY"
EOF
fi

# 4. Vérifier la configuration kubectl
info "4. Vérification de la configuration kubectl..."
if ! kubectl cluster-info &> /dev/null; then
    warn "kubectl n'est pas configuré ou ne peut pas se connecter au cluster"
    if [ -f "/etc/rancher/k3s/k3s.yaml" ]; then
        info "Fichier kubeconfig K3s trouvé. Pour configurer kubectl:"
        echo "  export KUBECONFIG=/etc/rancher/k3s/k3s.yaml"
        echo "  ou"
        echo "  mkdir -p ~/.kube"
        echo "  sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config"
        echo "  sudo chown \$USER:\$USER ~/.kube/config"
    else
        warn "Fichier kubeconfig K3s non trouvé dans /etc/rancher/k3s/k3s.yaml"
    fi
    warn "Les tests kubectl seront ignorés"
    SKIP_KUBECTL=true
else
    info "✓ kubectl est configuré"
    SKIP_KUBECTL=false
fi

# 5. Créer le namespace s'il n'existe pas
if [ "$SKIP_KUBECTL" = false ]; then
    info "5. Vérification du namespace..."
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        warn "Le namespace $NAMESPACE n'existe pas. Création..."
        kubectl create namespace "$NAMESPACE" && info "✓ Namespace $NAMESPACE créé" || warn "Impossible de créer le namespace (peut-être existe-t-il déjà)"
    else
        info "✓ Namespace $NAMESPACE existe"
    fi
fi

# 6. Test avec kubectl
if [ "$SKIP_KUBECTL" = false ]; then
    info "6. Test de pull d'image avec kubectl..."
    if command -v kubectl &> /dev/null; then
    # Créer un pod de test
    TEST_POD="registry-test-$(date +%s)"
    info "Création d'un pod de test: $TEST_POD"
    
    kubectl run "$TEST_POD" \
        --image="$REGISTRY/$IMAGE_NAME:dev" \
        --restart=Never \
        --namespace="$NAMESPACE" \
        --image-pull-policy=IfNotPresent \
        --command -- sh -c "echo 'Registry OK' && sleep 10" 2>&1 || true
    
    sleep 5
    
    # Vérifier le statut
    STATUS=$(kubectl get pod "$TEST_POD" -n "$NAMESPACE" -o jsonpath='{.status.phase}' 2>/dev/null || echo "NotFound")
    
    if [ "$STATUS" == "Running" ] || [ "$STATUS" == "Succeeded" ]; then
        info "✓ Pod de test créé avec succès"
        kubectl logs "$TEST_POD" -n "$NAMESPACE" 2>/dev/null || true
    elif [ "$STATUS" == "ImagePullBackOff" ] || [ "$STATUS" == "ErrImagePull" ]; then
        error "✗ Erreur lors du pull de l'image"
        kubectl describe pod "$TEST_POD" -n "$NAMESPACE" 2>/dev/null | grep -A 10 "Events:" || true
        warn "Vérifiez la configuration du registry dans /etc/rancher/k3s/registries.yaml"
    elif [ "$STATUS" == "Pending" ]; then
        warn "Pod en attente, vérification en cours..."
        sleep 5
        STATUS=$(kubectl get pod "$TEST_POD" -n "$NAMESPACE" -o jsonpath='{.status.phase}' 2>/dev/null || echo "NotFound")
        if [ "$STATUS" == "Running" ] || [ "$STATUS" == "Succeeded" ]; then
            info "✓ Pod de test créé avec succès"
            kubectl logs "$TEST_POD" -n "$NAMESPACE" 2>/dev/null || true
        else
            warn "Statut du pod: $STATUS"
            kubectl describe pod "$TEST_POD" -n "$NAMESPACE" 2>/dev/null | tail -20 || true
        fi
    else
        warn "Statut du pod: $STATUS"
        kubectl describe pod "$TEST_POD" -n "$NAMESPACE" 2>/dev/null | tail -20 || true
    fi
    
    # Nettoyer
    kubectl delete pod "$TEST_POD" -n "$NAMESPACE" --ignore-not-found=true &> /dev/null || true
    else
        warn "kubectl non disponible, test de pull ignoré"
    fi
else
    warn "Tests kubectl ignorés (kubectl non configuré)"
fi

info "Vérification terminée!"

