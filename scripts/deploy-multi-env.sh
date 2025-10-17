#!/bin/bash
set -e

echo "🚀 Déploiement Multi-Environnement - DiaspoMoney"
echo "================================================"

# Configuration
ENVIRONMENT=${1:-dev}
IMAGE_TAG=${2:-latest}
REGISTRY="ghcr.io/diaspomoney"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Fonction pour déployer un environnement
deploy_environment() {
    local env=$1
    local namespace="diaspomoney-$env"
    local url=""
    
    case $env in
        "dev")
            url="https://dev.diaspomoney.fr"
            ;;
        "rct")
            url="https://rct.diaspomoney.fr"
            ;;
        "prod")
            url="https://app.diaspomoney.fr"
            ;;
        *)
            log_error "Environnement non supporté: $env"
            exit 1
            ;;
    esac
    
    log_info "Déploiement de l'environnement: $env"
    log_info "Namespace: $namespace"
    log_info "URL: $url"
    
    # Créer le namespace
    log_info "Création du namespace..."
    kubectl apply -f "k8s/environments/${env}-namespace.yaml"
    
    # Déployer l'infrastructure
    log_info "Déploiement de l'infrastructure..."
    kubectl apply -f k8s/redis/redis-cluster.yaml -n "$namespace-infra"
    kubectl apply -f k8s/kafka/kafka-cluster.yaml -n "$namespace-infra"
    kubectl apply -f k8s/mongodb/mongodb-cluster.yaml -n "$namespace-infra"
    
    # Attendre que l'infrastructure soit prête
    log_info "Attente de l'infrastructure..."
    kubectl wait --for=condition=ready pod -l app=mongodb -n "$namespace-infra" --timeout=300s
    kubectl wait --for=condition=ready pod -l app=redis-cluster -n "$namespace-infra" --timeout=300s
    kubectl wait --for=condition=ready pod -l app=kafka-cluster -n "$namespace-infra" --timeout=300s
    
    # Déployer l'application
    log_info "Déploiement de l'application..."
    kubectl apply -f k8s/app/diaspomoney-deployment.yaml -n "$namespace"
    
    # Mettre à jour l'image
    log_info "Mise à jour de l'image..."
    kubectl set image deployment/diaspomoney-app \
        diaspomoney-app="$REGISTRY/diaspomoney:$env-$IMAGE_TAG" \
        -n "$namespace"
    
    # Attendre le déploiement
    log_info "Attente du déploiement..."
    kubectl rollout status deployment/diaspomoney-app -n "$namespace" --timeout=600s
    
    # Déployer l'ingress
    log_info "Déploiement de l'ingress..."
    kubectl apply -f k8s/ingress/environments-ingress.yaml
    
    # Tests de santé
    log_info "Tests de santé..."
    kubectl run smoke-test --image=curlimages/curl:latest --rm -i --restart=Never \
        -- curl -f "$url/api/health"
    
    log_success "Déploiement $env terminé avec succès!"
    log_info "URL: $url"
}

# Fonction pour afficher le statut
show_status() {
    local env=$1
    local namespace="diaspomoney-$env"
    
    log_info "Statut de l'environnement $env:"
    echo ""
    kubectl get pods -n "$namespace"
    echo ""
    kubectl get services -n "$namespace"
    echo ""
    kubectl get ingress -n "$namespace"
}

# Fonction pour nettoyer un environnement
cleanup_environment() {
    local env=$1
    local namespace="diaspomoney-$env"
    
    log_warning "Nettoyage de l'environnement $env..."
    
    # Supprimer l'application
    kubectl delete deployment diaspomoney-app -n "$namespace" --ignore-not-found=true
    
    # Supprimer l'ingress
    kubectl delete ingress diaspomoney-$env-ingress -n "$namespace" --ignore-not-found=true
    
    # Supprimer l'infrastructure
    kubectl delete namespace "$namespace-infra" --ignore-not-found=true
    
    # Supprimer le namespace
    kubectl delete namespace "$namespace" --ignore-not-found=true
    
    log_success "Environnement $env nettoyé"
}

# Fonction pour lister les environnements
list_environments() {
    log_info "Environnements disponibles:"
    echo ""
    echo "🔧 DEV (dev.diaspomoney.fr)"
    echo "   - Namespace: diaspomoney-dev"
    echo "   - Infrastructure: diaspomoney-dev-infra"
    echo ""
    echo "🧪 RCT (rct.diaspomoney.fr)"
    echo "   - Namespace: diaspomoney-rct"
    echo "   - Infrastructure: diaspomoney-rct-infra"
    echo ""
    echo "🚀 PROD (app.diaspomoney.fr)"
    echo "   - Namespace: diaspomoney-prod"
    echo "   - Infrastructure: diaspomoney-prod-infra"
    echo ""
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [COMMAND] [ENVIRONMENT] [IMAGE_TAG]"
    echo ""
    echo "Commands:"
    echo "  deploy     Déployer un environnement"
    echo "  status      Afficher le statut d'un environnement"
    echo "  cleanup     Nettoyer un environnement"
    echo "  list        Lister les environnements"
    echo "  help        Afficher cette aide"
    echo ""
    echo "Environments:"
    echo "  dev         Environnement de développement"
    echo "  rct         Environnement de recette"
    echo "  prod        Environnement de production"
    echo ""
    echo "Examples:"
    echo "  $0 deploy dev latest"
    echo "  $0 status prod"
    echo "  $0 cleanup rct"
    echo "  $0 list"
}

# Fonction principale
main() {
    case $1 in
        "deploy")
            if [ -z "$2" ]; then
                log_error "Environnement requis pour le déploiement"
                exit 1
            fi
            deploy_environment "$2"
            ;;
        "status")
            if [ -z "$2" ]; then
                log_error "Environnement requis pour le statut"
                exit 1
            fi
            show_status "$2"
            ;;
        "cleanup")
            if [ -z "$2" ]; then
                log_error "Environnement requis pour le nettoyage"
                exit 1
            fi
            cleanup_environment "$2"
            ;;
        "list")
            list_environments
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Commande non reconnue: $1"
            show_help
            exit 1
            ;;
    esac
}

# Vérifier les prérequis
if ! command -v kubectl &> /dev/null; then
    log_error "kubectl n'est pas installé"
    exit 1
fi

if ! kubectl cluster-info &> /dev/null; then
    log_error "kubectl n'est pas connecté à un cluster"
    exit 1
fi

# Exécuter la fonction principale
main "$@"
