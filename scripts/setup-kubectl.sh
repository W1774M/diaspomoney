#!/bin/bash

# Script pour configurer kubectl pour K3s
# Usage: ./scripts/setup-kubectl.sh

set -e

K3S_CONFIG="/etc/rancher/k3s/k3s.yaml"
KUBE_CONFIG="$HOME/.kube/config"

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

info "Configuration de kubectl pour K3s"

# Vérifier que le fichier K3s existe
if [ ! -f "$K3S_CONFIG" ]; then
    error "Fichier $K3S_CONFIG non trouvé. K3s est-il installé?"
fi

# Créer le répertoire .kube si nécessaire
mkdir -p "$HOME/.kube"

# Copier le fichier de configuration
if [ -f "$KUBE_CONFIG" ]; then
    warn "Le fichier $KUBE_CONFIG existe déjà"
    read -p "Voulez-vous le sauvegarder et le remplacer? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp "$KUBE_CONFIG" "${KUBE_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
        info "Ancien fichier sauvegardé"
    else
        info "Configuration annulée"
        exit 0
    fi
fi

# Copier et ajuster les permissions
sudo cp "$K3S_CONFIG" "$KUBE_CONFIG"
sudo chown "$USER:$USER" "$KUBE_CONFIG"
chmod 600 "$KUBE_CONFIG"

# Remplacer localhost par 127.0.0.1 si nécessaire (pour certains cas)
if grep -q "server: https://127.0.0.1" "$KUBE_CONFIG"; then
    info "Configuration déjà correcte"
elif grep -q "server: https://localhost" "$KUBE_CONFIG"; then
    # Optionnel: remplacer localhost par 127.0.0.1
    sed -i 's|server: https://localhost|server: https://127.0.0.1|g' "$KUBE_CONFIG"
    info "Configuration ajustée (localhost -> 127.0.0.1)"
fi

# Tester la connexion
info "Test de la connexion au cluster..."
if kubectl cluster-info &> /dev/null; then
    info "✓ kubectl est maintenant configuré!"
    echo ""
    info "Informations du cluster:"
    kubectl cluster-info
    echo ""
    info "Noeuds disponibles:"
    kubectl get nodes
    echo ""
    info "Vous pouvez maintenant utiliser kubectl normalement"
else
    error "La connexion au cluster a échoué. Vérifiez que K3s est démarré: sudo systemctl status k3s"
fi

