#!/bin/bash

# Script de démarrage Docker pour DiaspoMoney
# Usage: ./scripts/start-docker.sh

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Couleurs pour l'affichage
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

# Vérifier si Docker est installé
check_docker() {
    log_info "Vérification de Docker..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    log_success "Docker est installé: $(docker --version)"
}

# Démarrer Docker Desktop (Windows)
start_docker_desktop() {
    log_info "Démarrage de Docker Desktop..."
    
    # Essayer de démarrer Docker Desktop
    if command -v "C:\Program Files\Docker\Docker\Docker Desktop.exe" &> /dev/null; then
        log_info "Lancement de Docker Desktop..."
        "C:\Program Files\Docker\Docker\Docker Desktop.exe" &
        sleep 10
    else
        log_warning "Docker Desktop.exe non trouvé, essayez de le démarrer manuellement"
    fi
    
    # Attendre que Docker soit prêt
    log_info "Attente que Docker soit prêt..."
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if docker info &> /dev/null; then
            log_success "Docker est prêt"
            return 0
        fi
        
        log_info "Tentative $((attempts + 1))/$max_attempts..."
        sleep 2
        ((attempts++))
    done
    
    log_error "Docker n'est pas prêt après $max_attempts tentatives"
    return 1
}

# Démarrer les conteneurs
start_containers() {
    log_info "Démarrage des conteneurs..."
    
    # Aller dans le répertoire docker
    cd "$PROJECT_DIR/docker"
    
    # Démarrer avec docker-compose
    if docker-compose up -d; then
        log_success "Conteneurs démarrés avec succès"
    else
        log_error "Échec du démarrage des conteneurs"
        return 1
    fi
    
    # Attendre que MongoDB soit prêt
    log_info "Attente que MongoDB soit prêt..."
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if docker exec mongodb mongosh --quiet --eval "db.adminCommand('ping')" &> /dev/null; then
            log_success "MongoDB est prêt"
            return 0
        fi
        
        log_info "Tentative $((attempts + 1))/$max_attempts..."
        sleep 2
        ((attempts++))
    done
    
    log_error "MongoDB n'est pas prêt après $max_attempts tentatives"
    return 1
}

# Vérifier le statut
check_status() {
    log_info "Vérification du statut..."
    
    echo ""
    echo "=== Statut des conteneurs ==="
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "=== Test de connexion MongoDB ==="
    if docker exec mongodb mongosh --quiet --eval "db.adminCommand('ping')" | grep -q "1"; then
        log_success "Connexion MongoDB OK"
    else
        log_error "Connexion MongoDB échouée"
        return 1
    fi
}

# Fonction principale
main() {
    log_info "=== Démarrage Docker DiaspoMoney ==="
    
    check_docker
    start_docker_desktop
    start_containers
    check_status
    
    log_success "=== Docker et conteneurs démarrés avec succès ==="
    log_info "Vous pouvez maintenant utiliser les scripts de backup et maintenance"
}

# Exécution du script
main "$@"

