#!/bin/bash

# Script pour vérifier la configuration DNS et Let's Encrypt
# Usage: ./scripts/verify-letsencrypt.sh

set -e

NAMESPACE="kube-system"
DOMAINS=("dev.diaspomoney.fr" "rct.diaspomoney.fr" "app.diaspomoney.fr")

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

section "Vérification de la configuration Let's Encrypt"

# Vérifier que kubectl est disponible
if ! command -v kubectl &> /dev/null; then
    error "kubectl n'est pas installé"
    exit 1
fi

# Vérifier que Traefik est installé
if ! kubectl get deployment traefik -n "$NAMESPACE" > /dev/null 2>&1; then
    error "Traefik n'est pas installé dans le namespace $NAMESPACE"
    exit 1
fi

info "✅ Traefik est installé"

# Vérifier le ConfigMap
section "Vérification du ConfigMap Traefik"
if kubectl get configmap traefik-config -n "$NAMESPACE" > /dev/null 2>&1; then
    info "✅ ConfigMap traefik-config existe"
    config_content=$(kubectl get configmap traefik-config -n "$NAMESPACE" -o jsonpath='{.data.traefik\.yaml}')
    if echo "$config_content" | grep -q "certificatesResolvers"; then
        info "   └─ Configuration ACME trouvée"
        if echo "$config_content" | grep -q "httpChallenge"; then
            info "   └─ httpChallenge configuré"
        fi
        if echo "$config_content" | grep -q "tlsChallenge"; then
            info "   └─ tlsChallenge configuré"
        fi
    else
        warn "   └─ Configuration ACME non trouvée dans le ConfigMap"
    fi
else
    warn "⚠️  ConfigMap traefik-config n'existe pas"
fi

# Vérifier les arguments Traefik
section "Vérification des arguments Traefik"
traefik_pod=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=traefik -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$traefik_pod" ]; then
    info "Pod Traefik trouvé: $traefik_pod"
    if kubectl exec -n "$NAMESPACE" "$traefik_pod" -- cat /proc/1/cmdline 2>/dev/null | grep -q "certificatesresolvers.le"; then
        info "✅ Arguments ACME trouvés dans Traefik"
    else
        warn "⚠️  Arguments ACME non trouvés dans Traefik"
        info "   Exécutez: ./scripts/setup-letsencrypt.sh"
    fi
else
    error "❌ Aucun pod Traefik trouvé"
fi

# Vérifier les IngressRoutes
section "Vérification des IngressRoutes"
ingress_routes=$(kubectl get ingressroute -n diaspomoney -o name 2>/dev/null || echo "")
if [ -z "$ingress_routes" ]; then
    warn "Aucun IngressRoute trouvé dans le namespace diaspomoney"
else
    info "IngressRoutes trouvés:"
    uses_certresolver=false
    uses_secret=false
    while IFS= read -r ingress; do
        if [ -n "$ingress" ]; then
            ingress_name=$(echo "$ingress" | cut -d'/' -f2)
            cert_resolver=$(kubectl get "$ingress" -n diaspomoney -o jsonpath='{.spec.tls.certResolver}' 2>/dev/null || echo "")
            secret_ref=$(kubectl get "$ingress" -n diaspomoney -o jsonpath='{.spec.tls.secretName}' 2>/dev/null || echo "")
            
            if [ -n "$cert_resolver" ]; then
                info "   ✅ $ingress_name -> certResolver: $cert_resolver"
                uses_certresolver=true
            elif [ -n "$secret_ref" ]; then
                warn "   ⚠️  $ingress_name -> secretName: $secret_ref (utilise un secret manuel)"
                uses_secret=true
            else
                warn "   ⚠️  $ingress_name -> pas de TLS configuré"
            fi
        fi
    done <<< "$ingress_routes"
    
    if [ "$uses_certresolver" = true ] && [ "$uses_secret" = true ]; then
        warn "⚠️  Certains IngressRoutes utilisent certResolver, d'autres utilisent des secrets"
    elif [ "$uses_certresolver" = true ]; then
        info "✅ Tous les IngressRoutes utilisent certResolver (Let's Encrypt)"
    elif [ "$uses_secret" = true ]; then
        warn "⚠️  Tous les IngressRoutes utilisent des secrets manuels"
        info "   Pour utiliser Let's Encrypt, modifiez les IngressRoutes pour utiliser certResolver: le"
    fi
fi

# Vérifier le DNS
section "Vérification DNS"
info "Vérification que les domaines pointent vers ce serveur..."

# Obtenir l'adresse IP publique du serveur
server_ip=""
# Essayer plusieurs méthodes pour obtenir l'IP publique
if command -v curl &> /dev/null; then
    # Méthode 1: Service externe
    server_ip=$(curl -s --max-time 2 https://api.ipify.org 2>/dev/null || echo "")
fi
if [ -z "$server_ip" ] && command -v hostname &> /dev/null; then
    # Méthode 2: hostname -I (adresses IPv4)
    server_ip=$(hostname -I 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i !~ /^fe80:/ && $i !~ /^::1/ && $i !~ /^127\./) {print $i; exit}}' || echo "")
fi
if [ -z "$server_ip" ] && command -v ip &> /dev/null; then
    # Méthode 3: ip addr show (première adresse IPv4 non locale)
    server_ip=$(ip addr show 2>/dev/null | grep -oP 'inet \K[\d.]+' | grep -v '^127\.' | head -1 || echo "")
fi

all_dns_ok=true
for domain in "${DOMAINS[@]}"; do
    if command -v dig &> /dev/null; then
        dns_result=$(dig +short "$domain" A 2>/dev/null | head -1 || echo "")
        if [ -n "$dns_result" ]; then
            if [ -n "$server_ip" ] && [ "$dns_result" = "$server_ip" ]; then
                info "   ✅ $domain -> $dns_result (correspond à l'IP du serveur)"
            elif [ -n "$server_ip" ]; then
                # Vérifier si c'est une adresse IPv4 valide (pas une erreur de détection)
                if echo "$server_ip" | grep -qE '^fe80:|^::|^127\.'; then
                    # L'IP détectée est locale, on ne compare pas
                    info "   ✅ $domain -> $dns_result (IP publique détectée)"
                else
                    warn "   ⚠️  $domain -> $dns_result (IP serveur détectée: $server_ip)"
                    info "      Si $dns_result est correct, ignorez cet avertissement"
                fi
            else
                info "   ✅ $domain -> $dns_result (IP publique détectée)"
            fi
        else
            error "   ❌ $domain -> pas de résolution DNS"
            all_dns_ok=false
        fi
    elif command -v nslookup &> /dev/null; then
        dns_result=$(nslookup "$domain" 2>/dev/null | grep -A 1 "Name:" | tail -1 | awk '{print $2}' || echo "")
        if [ -n "$dns_result" ]; then
            info "   ✅ $domain -> résolu"
        else
            error "   ❌ $domain -> pas de résolution DNS"
            all_dns_ok=false
        fi
    else
        warn "   ⚠️  dig et nslookup non disponibles, impossible de vérifier DNS"
        all_dns_ok=false
        break
    fi
done

if [ "$all_dns_ok" = false ]; then
    warn "⚠️  Problèmes DNS détectés"
    warn "   Les domaines doivent pointer vers ce serveur pour Let's Encrypt"
fi

# Vérifier les logs Traefik pour les certificats
section "Vérification des certificats Let's Encrypt"
info "Vérification des logs Traefik pour les certificats..."
if [ -n "$traefik_pod" ]; then
    cert_logs=$(kubectl logs -n "$NAMESPACE" "$traefik_pod" --tail=100 2>/dev/null | grep -i "certificate\|acme" | tail -10 || echo "")
    if [ -n "$cert_logs" ]; then
        echo "$cert_logs" | while IFS= read -r line; do
            if echo "$line" | grep -qi "error\|fail"; then
                error "   ❌ $line"
            elif echo "$line" | grep -qi "success\|obtained"; then
                info "   ✅ $line"
            else
                info "   ℹ️  $line"
            fi
        done
    else
        warn "   ⚠️  Aucun log de certificat trouvé"
        info "   Les certificats seront générés lors de la première requête HTTPS"
    fi
fi

# Vérifier les ports
section "Vérification des ports"
info "Vérification que les ports 80 et 443 sont accessibles..."
if command -v netstat &> /dev/null; then
    port80=$(netstat -tuln 2>/dev/null | grep ":80 " || echo "")
    port443=$(netstat -tuln 2>/dev/null | grep ":443 " || echo "")
    if [ -n "$port80" ]; then
        info "   ✅ Port 80 ouvert"
    else
        warn "   ⚠️  Port 80 non détecté (peut être géré par Traefik)"
    fi
    if [ -n "$port443" ]; then
        info "   ✅ Port 443 ouvert"
    else
        warn "   ⚠️  Port 443 non détecté (peut être géré par Traefik)"
    fi
fi

# Résumé
section "Résumé"
echo ""
if [ "$all_dns_ok" = true ] && [ "$uses_certresolver" = true ]; then
    info "✅ Configuration Let's Encrypt prête!"
    info "Les certificats seront générés automatiquement lors des premières requêtes HTTPS"
    echo ""
    info "Pour tester, exécutez:"
    echo "   curl -v https://dev.diaspomoney.fr"
    echo "   curl -v https://rct.diaspomoney.fr"
    echo "   curl -v https://app.diaspomoney.fr"
else
    if [ "$all_dns_ok" = false ]; then
        error "❌ Problèmes DNS détectés"
        info "   Configurez le DNS pour que les domaines pointent vers ce serveur"
    fi
    if [ "$uses_certresolver" = false ]; then
        error "❌ Les IngressRoutes n'utilisent pas certResolver"
        info "   Exécutez: kubectl apply -f k8s/app/*/ingress.yaml"
    fi
    echo ""
    info "Pour configurer Let's Encrypt, exécutez:"
    echo "   ./scripts/setup-letsencrypt.sh"
fi

