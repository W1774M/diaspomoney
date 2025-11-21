#!/bin/bash

# Script pour attendre la génération des certificats Let's Encrypt
# Usage: ./scripts/wait-for-letsencrypt.sh [domain]

set -e

DOMAIN=${1:-"dev.diaspomoney.fr"}
NAMESPACE="kube-system"
MAX_WAIT=${MAX_WAIT:-300}  # 5 minutes par défaut

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

section() {
    echo -e "${BLUE}[SECTION]${NC} $1"
}

section "Attente de la génération du certificat Let's Encrypt pour $DOMAIN"

info "Surveillance des logs Traefik..."
info "Appuyez sur Ctrl+C pour arrêter"

start_time=$(date +%s)
last_log_time=$start_time

while true; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    if [ $elapsed -gt $MAX_WAIT ]; then
        error "Timeout après ${MAX_WAIT} secondes"
        exit 1
    fi
    
    # Vérifier les logs pour les certificats
    recent_logs=$(kubectl logs -n "$NAMESPACE" -l app.kubernetes.io/name=traefik --since=30s 2>/dev/null | grep -iE "certificate|obtain|acme|error" || echo "")
    
    if [ -n "$recent_logs" ]; then
        echo "$recent_logs" | while IFS= read -r line; do
            if echo "$line" | grep -qi "obtain.*certificate\|certificate.*obtained\|success"; then
                info "✅ $line"
            elif echo "$line" | grep -qi "error\|fail"; then
                error "❌ $line"
            else
                info "ℹ️  $line"
            fi
        done
        last_log_time=$current_time
    fi
    
    # Vérifier le certificat directement
    cert_info=$(curl -k -v "https://$DOMAIN" 2>&1 | grep -iE "issuer|subject" | head -2 || echo "")
    if echo "$cert_info" | grep -qi "Let's Encrypt\|R3\|DST Root CA"; then
        info ""
        info "✅ Certificat Let's Encrypt détecté!"
        echo "$cert_info"
        exit 0
    elif echo "$cert_info" | grep -qi "self-signed\|CN=$DOMAIN"; then
        if [ $((current_time - last_log_time)) -gt 10 ]; then
            warn "⏳ En attente de la génération du certificat... (${elapsed}s)"
            last_log_time=$current_time
        fi
    fi
    
    sleep 5
done

