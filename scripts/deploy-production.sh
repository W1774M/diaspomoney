#!/bin/bash

# 🚀 Script de déploiement en production pour Diaspomoney
# Usage: ./scripts/deploy-production.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="diaspomoney"
DOCKER_COMPOSE_FILES="-f docker/docker-compose.yml -f docker/docker-compose.prod.yml"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    # Vérifier le fichier .env
    if [ ! -f ".env" ]; then
        log_error "Fichier .env manquant"
        exit 1
    fi
    
    # Vérifier les permissions
    if [ ! -w "docker/traefik/letsencrypt" ]; then
        log_warning "Création du répertoire letsencrypt..."
        mkdir -p docker/traefik/letsencrypt
        chmod 755 docker/traefik/letsencrypt
    fi
    
    log_success "Prérequis vérifiés"
}

# Création des volumes et répertoires
setup_directories() {
    log_info "Configuration des répertoires..."
    
    # Créer les répertoires nécessaires
    mkdir -p docker/traefik/letsencrypt
    mkdir -p docker/traefik/traefik_logs
    
    # Permissions pour ACME
    chmod 755 docker/traefik/letsencrypt
    chmod 755 docker/traefik/traefik_logs
    
    # Créer le fichier acme.json s'il n'existe pas
    if [ ! -f "docker/traefik/letsencrypt/acme.json" ]; then
        touch docker/traefik/letsencrypt/acme.json
        chmod 600 docker/traefik/letsencrypt/acme.json
        log_success "Fichier acme.json créé"
    fi
    
    log_success "Répertoires configurés"
}

# Construction des images
build_images() {
    log_info "Construction des images Docker..."
    
    # Construire l'image de l'application
    docker-compose $DOCKER_COMPOSE_FILES build app
    
    log_success "Images construites"
}

# Déploiement des services
deploy_services() {
    log_info "Déploiement des services..."
    
    # Arrêter les services existants
    log_info "Arrêt des services existants..."
    docker-compose $DOCKER_COMPOSE_FILES down --remove-orphans
    
    # Démarrer les services
    log_info "Démarrage des services..."
    docker-compose $DOCKER_COMPOSE_FILES up -d
    
    log_success "Services déployés"
}

# Vérification de la santé des services
health_check() {
    log_info "Vérification de la santé des services..."
    
    # Attendre que les services démarrent
    sleep 10
    
    # Vérifier les conteneurs
    if ! docker-compose $DOCKER_COMPOSE_FILES ps | grep -q "Up"; then
        log_error "Certains services ne sont pas démarrés"
        docker-compose $DOCKER_COMPOSE_FILES ps
        exit 1
    fi
    
    # Vérifier MongoDB
    log_info "Vérification de MongoDB..."
    if ! docker-compose $DOCKER_COMPOSE_FILES exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        log_warning "MongoDB n'est pas encore prêt, attente..."
        sleep 30
    fi
    
    # Vérifier l'application
    log_info "Vérification de l'application..."
    if ! docker-compose $DOCKER_COMPOSE_FILES exec -T app curl -f http://localhost:3000 &> /dev/null; then
        log_warning "L'application n'est pas encore prête"
    fi
    
    log_success "Vérification de santé terminée"
}

# Affichage des informations de déploiement
show_deployment_info() {
    log_info "Informations de déploiement:"
    
    echo ""
    echo "🌐 Services accessibles:"
    echo "  • Application: https://app.diaspomoney.fr"
    echo "  • Dashboard: https://dashboard.diaspomoney.fr"
    echo "  • MongoDB: https://mongo.diaspomoney.fr"
    echo ""
    
    echo "📊 Monitoring:"
    echo "  • Grafana: https://dashboard.diaspomoney.fr/grafana"
    echo "  • Prometheus: https://dashboard.diaspomoney.fr/prometheus"
    echo "  • Loki: https://dashboard.diaspomoney.fr/loki"
    echo ""
    
    echo "🔧 Commandes utiles:"
    echo "  • Logs: docker-compose $DOCKER_COMPOSE_FILES logs -f"
    echo "  • Status: docker-compose $DOCKER_COMPOSE_FILES ps"
    echo "  • Restart: docker-compose $DOCKER_COMPOSE_FILES restart"
    echo ""
    
    echo "📋 Prochaines étapes:"
    echo "  1. Vérifiez que vos domaines pointent vers cette IP"
    echo "  2. Attendez la génération des certificats SSL (1-2 minutes)"
    echo "  3. Testez l'accès HTTPS aux services"
    echo ""
}

# Nettoyage en cas d'erreur
cleanup_on_error() {
    log_error "Erreur détectée, nettoyage..."
    docker-compose $DOCKER_COMPOSE_FILES down --remove-orphans
    exit 1
}

# Fonction principale
main() {
    log_info "🚀 Déploiement en production de $PROJECT_NAME"
    log_info "Environnement: $ENVIRONMENT"
    echo ""
    
    # Configuration du trap pour le nettoyage
    trap cleanup_on_error ERR
    
    # Étapes de déploiement
    check_prerequisites
    setup_directories
    build_images
    deploy_services
    health_check
    show_deployment_info
    
    log_success "🎉 Déploiement terminé avec succès!"
    log_info "Les certificats SSL seront générés automatiquement lors de la première requête HTTPS"
}

# Exécution du script
main "$@"
