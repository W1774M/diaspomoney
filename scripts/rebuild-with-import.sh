#!/bin/bash
# Script pour importer node:20-alpine et reconstruire l'image
# Usage: ./scripts/rebuild-with-import.sh [chemin_vers_fichier.tar.gz] [env]

set -e

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

# Paramètres
IMPORT_FILE="${1:-/tmp/node-20-alpine.tar.gz}"
ENV="${2:-dev}"

info "🔨 Reconstruction avec import de node:20-alpine"
echo ""

# Vérifier si le fichier existe
if [ ! -f "$IMPORT_FILE" ]; then
    error "❌ Fichier non trouvé : $IMPORT_FILE"
    echo ""
    echo "📋 Pour obtenir le fichier :"
    echo "   Sur un serveur avec accès Docker Hub :"
    echo "     docker pull node:20-alpine"
    echo "     docker save node:20-alpine | gzip > node-20-alpine.tar.gz"
    echo ""
    echo "   Puis transférez-le :"
    echo "     scp node-20-alpine.tar.gz root@217.154.22.202:/tmp/"
    exit 1
fi

# Étape 1 : Importer l'image
info "📥 Étape 1/4 : Import de node:20-alpine..."
if docker load < "$IMPORT_FILE" 2>&1 | grep -q "node:20-alpine"; then
    info "✅ Image importée avec succès"
else
    warn "⚠️  Vérification de l'import..."
    if docker images | grep -q "node.*20.*alpine"; then
        info "✅ Image déjà présente"
    else
        error "❌ Échec de l'import"
        exit 1
    fi
fi

# Étape 2 : Construire l'image
info "🔨 Étape 2/4 : Construction de l'image..."
if docker build -t "localhost:5000/diaspomoney:${ENV}" -f Dockerfile .; then
    info "✅ Image construite avec succès"
else
    error "❌ Échec de la construction"
    exit 1
fi

# Étape 3 : Pousser vers le registry
info "📤 Étape 3/4 : Push vers le registry..."
if docker push "localhost:5000/diaspomoney:${ENV}"; then
    info "✅ Image poussée avec succès"
else
    error "❌ Échec du push"
    exit 1
fi

# Étape 4 : Redémarrer le déploiement
info "🔄 Étape 4/4 : Redémarrage du déploiement..."
if kubectl rollout restart "deployment/diaspomoney-${ENV}" -n diaspomoney; then
    info "✅ Déploiement redémarré"
    echo ""
    info "⏳ Attente du rollout..."
    if kubectl rollout status "deployment/diaspomoney-${ENV}" -n diaspomoney --timeout=120s; then
        info "✅ Rollout terminé avec succès"
    else
        warn "⚠️  Rollout en cours ou timeout"
    fi
else
    error "❌ Échec du redémarrage"
    exit 1
fi

echo ""
info "✅ Reconstruction terminée !"
echo ""
info "🧪 Testez avec :"
echo "   curl http://${ENV}.diaspomoney.fr/"
echo "   curl -k https://${ENV}.diaspomoney.fr/"

