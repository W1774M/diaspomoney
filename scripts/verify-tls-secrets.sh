#!/bin/bash

# Script pour vérifier les secrets TLS dans Kubernetes
# Usage: ./scripts/verify-tls-secrets.sh

set -e

NAMESPACE=${NAMESPACE:-diaspomoney}
SECRETS=("dev-tls-cert" "rct-tls-cert" "app-tls-cert" "diaspomoney-tls")

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

section "Vérification des secrets TLS dans le namespace $NAMESPACE"

# Vérifier si le namespace existe
if ! kubectl get namespace "$NAMESPACE" > /dev/null 2>&1; then
    error "Le namespace $NAMESPACE n'existe pas"
    exit 1
fi

info "Namespace $NAMESPACE trouvé"

# Vérifier chaque secret
all_secrets_exist=true
for secret in "${SECRETS[@]}"; do
    if kubectl get secret "$secret" -n "$NAMESPACE" > /dev/null 2>&1; then
        info "✅ Secret $secret existe"
        
        # Vérifier que le secret contient les clés nécessaires
        if kubectl get secret "$secret" -n "$NAMESPACE" -o jsonpath='{.data.tls\.crt}' > /dev/null 2>&1 && \
           kubectl get secret "$secret" -n "$NAMESPACE" -o jsonpath='{.data.tls\.key}' > /dev/null 2>&1; then
            info "   └─ Contient tls.crt et tls.key"
            
            # Afficher les informations du certificat
            cert_info=$(kubectl get secret "$secret" -n "$NAMESPACE" -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -subject -dates 2>/dev/null || echo "Erreur lors de la lecture du certificat")
            if [[ "$cert_info" != *"Erreur"* ]]; then
                echo "   └─ Informations du certificat:"
                echo "$cert_info" | sed 's/^/      /'
            fi
        else
            warn "   └─ Le secret ne contient pas tls.crt ou tls.key"
        fi
    else
        error "❌ Secret $secret n'existe pas"
        all_secrets_exist=false
    fi
done

echo ""

# Vérifier les IngressRoutes
section "Vérification des IngressRoutes"
ingress_routes=$(kubectl get ingressroute -n "$NAMESPACE" -o name 2>/dev/null || echo "")
if [ -z "$ingress_routes" ]; then
    warn "Aucun IngressRoute trouvé dans le namespace $NAMESPACE"
else
    info "IngressRoutes trouvés:"
    while IFS= read -r ingress; do
        if [ -n "$ingress" ]; then
            ingress_name=$(echo "$ingress" | cut -d'/' -f2)
            secret_ref=$(kubectl get "$ingress" -n "$NAMESPACE" -o jsonpath='{.spec.tls.secretName}' 2>/dev/null || echo "")
            if [ -n "$secret_ref" ]; then
                if kubectl get secret "$secret_ref" -n "$NAMESPACE" > /dev/null 2>&1; then
                    info "   ✅ $ingress_name -> secret: $secret_ref (existe)"
                else
                    error "   ❌ $ingress_name -> secret: $secret_ref (n'existe pas)"
                    all_secrets_exist=false
                fi
            else
                warn "   ⚠️  $ingress_name -> pas de secret TLS configuré"
            fi
        fi
    done <<< "$ingress_routes"
fi

echo ""

# Résumé
section "Résumé"
if [ "$all_secrets_exist" = true ]; then
    info "✅ Tous les secrets TLS requis existent"
    info "Pour créer/mettre à jour les secrets, exécutez: ./scripts/create-tls-secret.sh"
else
    error "❌ Certains secrets TLS sont manquants"
    info "Pour créer les secrets manquants, exécutez: ./scripts/create-tls-secret.sh"
    exit 1
fi

