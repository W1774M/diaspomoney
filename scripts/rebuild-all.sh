#!/bin/bash
# Script pour reconstruire et redéployer tous les environnements
# Usage: ./scripts/rebuild-all.sh [dev|rct|prod|all] [--use-existing]

set -e

ENV=${1:-all}
USE_EXISTING_FLAG=${2:-""}
REGISTRY=${REGISTRY:-localhost:5000}
IMAGE_NAME="diaspomoney"
NAMESPACE="diaspomoney"

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

# Vérifier qu'une image node est disponible
info "Vérification d'une image node disponible..."
NODE_IMAGE=""
DOCKERFILE_TO_USE="Dockerfile"

# Chercher node:20-alpine
if docker images | grep -q "node.*20.*alpine"; then
    NODE_IMAGE="node:20-alpine"
    info "✅ node:20-alpine disponible localement"
# Chercher une autre version de node
elif docker images | grep -qE "^node "; then
    NODE_IMAGE=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "^node:" | head -1)
    if [ -n "$NODE_IMAGE" ] && [ "$NODE_IMAGE" != "node:" ]; then
        warn "⚠️  node:20-alpine non disponible, utilisation de $NODE_IMAGE"
        warn "⚠️  Modification temporaire du Dockerfile..."
        # Créer une copie temporaire du Dockerfile avec l'image disponible
        sed "s|FROM node:20-alpine|FROM $NODE_IMAGE|g" Dockerfile > Dockerfile.tmp
        DOCKERFILE_TO_USE="Dockerfile.tmp"
    fi
# Vérifier si un fichier d'import existe
elif [ -f "/tmp/node-20-alpine.tar.gz" ]; then
    info "📥 Fichier d'import trouvé, import en cours..."
    if ./scripts/import-node-image.sh /tmp/node-20-alpine.tar.gz; then
        NODE_IMAGE="node:20-alpine"
    else
        error "Échec de l'import de node:20-alpine"
        exit 1
    fi
else
    warn "⚠️  Aucune image node disponible localement"
    
    if [ "$USE_EXISTING_FLAG" = "--use-existing" ]; then
        info "✅ Utilisation de l'image existante (flag --use-existing)"
        USE_EXISTING=true
    else
        echo ""
        echo "📋 Options disponibles :"
        echo ""
        echo "Option 1 : Utiliser l'image existante (sans modifs middleware)"
        echo "   L'image actuelle sera utilisée telle quelle"
        echo "   Utilisez : ./scripts/rebuild-all.sh $ENV --use-existing"
        echo ""
        echo "Option 2 : Importer depuis un autre serveur"
        echo "   Sur un serveur avec internet :"
        echo "     docker pull node:20-alpine"
        echo "     docker save node:20-alpine | gzip > /tmp/node-20-alpine.tar.gz"
        echo "     scp /tmp/node-20-alpine.tar.gz root@$(hostname -I | awk '{print $1}'):/tmp/"
        echo ""
        echo "   Puis réexécutez ce script :"
        echo "     ./scripts/rebuild-all.sh $ENV"
        exit 1
    fi
fi

# Fonction pour reconstruire un environnement
rebuild_env() {
    local env=$1
    local tag=$env
    
    if [ "${USE_EXISTING:-false}" = "true" ]; then
        info "📤 Push de l'image existante vers le registry..."
        if docker images | grep -q "${REGISTRY}/${IMAGE_NAME}:${tag}"; then
            docker push ${REGISTRY}/${IMAGE_NAME}:${tag} || warn "Image déjà dans le registry"
        else
            error "Image ${REGISTRY}/${IMAGE_NAME}:${tag} non trouvée"
            exit 1
        fi
    else
        info "🔨 Reconstruction de l'environnement: $env"
        docker build -t ${REGISTRY}/${IMAGE_NAME}:${tag} -f ${DOCKERFILE_TO_USE} .
        
        # Nettoyer le Dockerfile temporaire si créé
        if [ -f "Dockerfile.tmp" ]; then
            rm -f Dockerfile.tmp
        fi
        
        info "📤 Push vers le registry..."
        docker push ${REGISTRY}/${IMAGE_NAME}:${tag}
    fi
    
    info "🚀 Redéploiement dans Kubernetes..."
    kubectl rollout restart deployment diaspomoney-${env} -n ${NAMESPACE}
    kubectl rollout status deployment diaspomoney-${env} -n ${NAMESPACE} --timeout=120s
    
    info "✅ Environnement $env redéployé"
    echo ""
}

# Reconstruire selon l'environnement demandé
case $ENV in
    dev)
        rebuild_env dev
        ;;
    rct)
        rebuild_env rct
        ;;
    prod)
        rebuild_env app
        ;;
    all)
        rebuild_env dev
        rebuild_env rct
        rebuild_env app
        ;;
    *)
        error "Environnement invalide: $ENV. Utilisez: dev, rct, prod ou all"
        ;;
esac

info "✅ Tous les environnements ont été reconstruits et redéployés !"
echo ""
echo "🧪 Tests :"
echo "  curl -H 'Host: dev.diaspomoney.fr' http://localhost:30201/"
echo "  curl -H 'Host: app.diaspomoney.fr' http://localhost:30201/"
echo "  curl -H 'Host: rct.diaspomoney.fr' http://localhost:30201/"

