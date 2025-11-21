#!/bin/bash

# Script pour configurer la redirection de ports 80/443 vers Traefik K3s
# Usage: ./scripts/setup-port-redirect.sh

set -e

HTTP_NODEPORT=30201
HTTPS_NODEPORT=31337

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

info "Configuration de la redirection de ports pour Traefik K3s"

# Vérifier que nous sommes root
if [ "$EUID" -ne 0 ]; then 
    error "Ce script doit être exécuté en tant que root (sudo)"
fi

# Vérifier que les nodePorts sont accessibles
info "Vérification des nodePorts Traefik..."
if ! netstat -tln 2>/dev/null | grep -q ":${HTTP_NODEPORT}" && \
   ! ss -tln 2>/dev/null | grep -q ":${HTTP_NODEPORT}"; then
    warn "Le nodePort ${HTTP_NODEPORT} n'est pas accessible"
    warn "Vérifiez que Traefik est bien déployé dans K3s"
fi

# Ajouter les règles iptables pour rediriger le trafic
info "Ajout des règles iptables..."

# Redirection HTTP (80 -> 30201)
iptables -t nat -C PREROUTING -p tcp --dport 80 -j REDIRECT --to-port ${HTTP_NODEPORT} 2>/dev/null || \
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port ${HTTP_NODEPORT}

# Redirection HTTPS (443 -> 31337)
iptables -t nat -C PREROUTING -p tcp --dport 443 -j REDIRECT --to-port ${HTTPS_NODEPORT} 2>/dev/null || \
iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port ${HTTPS_NODEPORT}

# Pour le trafic local aussi
iptables -t nat -C OUTPUT -p tcp --dport 80 -j REDIRECT --to-port ${HTTP_NODEPORT} 2>/dev/null || \
iptables -t nat -A OUTPUT -p tcp --dport 80 -j REDIRECT --to-port ${HTTP_NODEPORT}

iptables -t nat -C OUTPUT -p tcp --dport 443 -j REDIRECT --to-port ${HTTPS_NODEPORT} 2>/dev/null || \
iptables -t nat -A OUTPUT -p tcp --dport 443 -j REDIRECT --to-port ${HTTPS_NODEPORT}

info "✅ Redirection configurée :"
info "   Port 80 -> ${HTTP_NODEPORT}"
info "   Port 443 -> ${HTTPS_NODEPORT}"

warn "⚠️  Ces règles iptables seront perdues au redémarrage"
warn "⚠️  Pour les rendre permanentes, installez iptables-persistent :"
warn "   sudo apt-get install iptables-persistent"
warn "   sudo netfilter-persistent save"

# Tester la redirection
info "Test de la redirection..."
sleep 1
if curl -s -k -m 2 http://localhost/ > /dev/null 2>&1; then
    info "✅ Redirection HTTP fonctionne"
else
    warn "⚠️  Redirection HTTP non testable (peut nécessiter un service qui écoute)"
fi

info "Configuration terminée !"

