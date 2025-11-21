#!/bin/bash

# Script pour configurer Let's Encrypt avec Traefik dans K3s
# Usage: ./scripts/setup-letsencrypt.sh [--staging]

set -e

USE_STAGING=false
if [[ "$1" == "--staging" ]]; then
    USE_STAGING=true
fi

NAMESPACE="kube-system"
EMAIL="contact@diaspomoney.fr"

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

section "Configuration de Let's Encrypt avec Traefik"

# Vérifier que kubectl est disponible
if ! command -v kubectl &> /dev/null; then
    error "kubectl n'est pas installé"
    exit 1
fi

# Vérifier que helm est disponible
if ! command -v helm &> /dev/null; then
    error "helm n'est pas installé"
    exit 1
fi

# Vérifier que Traefik est installé
if ! kubectl get deployment traefik -n "$NAMESPACE" > /dev/null 2>&1; then
    error "Traefik n'est pas installé dans le namespace $NAMESPACE"
    exit 1
fi

info "Traefik trouvé dans le namespace $NAMESPACE"

# Appliquer le ConfigMap Traefik
section "Application du ConfigMap Traefik"
if [ -f "k8s/traefik/traefik-config.yaml" ]; then
    info "Application du ConfigMap traefik-config..."
    kubectl apply -f k8s/traefik/traefik-config.yaml
    info "✅ ConfigMap appliqué"
else
    error "Fichier k8s/traefik/traefik-config.yaml non trouvé"
    exit 1
fi

# Vérifier que le ConfigMap est monté dans Traefik
section "Vérification de la configuration Traefik"
info "Vérification que Traefik utilise le ConfigMap..."

# Obtenir les valeurs Helm actuelles
info "Récupération de la configuration Helm actuelle..."
helm get values traefik -n "$NAMESPACE" > /tmp/traefik-values-current.yaml 2>&1 || {
    warn "Impossible de récupérer les valeurs Helm, Traefik pourrait être installé différemment"
}

# Préparer les arguments supplémentaires pour ACME
ACME_ARGS=""
if [ "$USE_STAGING" = true ]; then
    warn "⚠️  Mode STAGING activé - Les certificats ne seront pas valides pour la production"
    ACME_ARGS="--certificatesresolvers.le.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"
fi

ACME_ARGS="$ACME_ARGS --certificatesresolvers.le.acme.email=$EMAIL"
ACME_ARGS="$ACME_ARGS --certificatesresolvers.le.acme.storage=/data/acme.json"
ACME_ARGS="$ACME_ARGS --certificatesresolvers.le.acme.httpchallenge=true"
ACME_ARGS="$ACME_ARGS --certificatesresolvers.le.acme.httpchallenge.entrypoint=web"
ACME_ARGS="$ACME_ARGS --certificatesresolvers.le.acme.tlschallenge=true"

# Mettre à jour Traefik via Helm
section "Mise à jour de Traefik avec la configuration ACME"
info "Mise à jour de Traefik avec les arguments ACME..."

# Vérifier si Traefik a un volume pour /data
info "Vérification de la configuration des volumes..."

# Mettre à jour Traefik
if helm upgrade traefik traefik/traefik \
    --namespace "$NAMESPACE" \
    --set "additionalArguments={$ACME_ARGS}" \
    --reuse-values 2>&1 | tee /tmp/helm-upgrade.log; then
    info "✅ Traefik mis à jour avec succès"
else
    error "❌ Échec de la mise à jour de Traefik"
    error "Vérifiez les logs: cat /tmp/helm-upgrade.log"
    exit 1
fi

# Attendre que Traefik redémarre
section "Attente du redémarrage de Traefik"
info "Attente que Traefik soit prêt..."
kubectl rollout status deployment/traefik -n "$NAMESPACE" --timeout=120s || {
    warn "Le déploiement Traefik prend plus de temps que prévu"
}

# Vérifier les logs Traefik pour les erreurs ACME
section "Vérification des logs Traefik"
info "Vérification des logs Traefik pour les erreurs ACME..."
sleep 5
if kubectl logs -n "$NAMESPACE" -l app.kubernetes.io/name=traefik --tail=50 | grep -i "acme\|certificate\|error" | head -20; then
    info "Logs vérifiés"
else
    warn "Aucun log ACME trouvé (normal si c'est la première configuration)"
fi

# Instructions pour vérifier DNS
section "Vérification DNS requise"
warn "⚠️  IMPORTANT: Assurez-vous que les domaines pointent vers ce serveur:"
echo "   - dev.diaspomoney.fr"
echo "   - rct.diaspomoney.fr"
echo "   - app.diaspomoney.fr"
echo ""
info "Pour vérifier le DNS, exécutez:"
echo "   dig dev.diaspomoney.fr"
echo "   dig rct.diaspomoney.fr"
echo "   dig app.diaspomoney.fr"
echo ""
info "Les domaines doivent pointer vers l'adresse IP de ce serveur"

# Instructions pour vérifier les certificats
section "Vérification des certificats"
info "Pour vérifier que les certificats Let's Encrypt sont générés:"
echo "   kubectl logs -n $NAMESPACE -l app.kubernetes.io/name=traefik | grep -i certificate"
echo ""
info "Les certificats seront générés automatiquement lors de la première requête HTTPS"
if [ "$USE_STAGING" = true ]; then
    warn "⚠️  Mode STAGING: Les certificats ne seront pas reconnus par les navigateurs"
    warn "   Pour passer en production, relancez sans --staging"
else
    info "✅ Mode PRODUCTION: Les certificats seront valides"
fi

echo ""
info "✅ Configuration Let's Encrypt terminée!"
info "Les certificats seront générés automatiquement lors des premières requêtes HTTPS"

