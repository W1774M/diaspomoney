#!/bin/bash

# Script pour gérer l'environnement Docker local de DiaspoMoney

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_message() {
    echo -e "${BLUE}[DiaspoMoney]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[DiaspoMoney]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[DiaspoMoney]${NC} $1"
}

print_error() {
    echo -e "${RED}[DiaspoMoney]${NC} $1"
}

# Fonction d'aide
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start       Démarrer tous les services"
    echo "  stop        Arrêter tous les services"
    echo "  restart     Redémarrer tous les services"
    echo "  logs        Afficher les logs de l'application"
    echo "  logs-all    Afficher les logs de tous les services"
    echo "  clean       Nettoyer les volumes et conteneurs"
    echo "  status      Afficher le statut des services"
    echo "  shell       Ouvrir un shell dans le conteneur app"
    echo "  db          Ouvrir un shell MongoDB"
    echo "  redis       Ouvrir un shell Redis"
    echo "  monitoring  Démarrer avec le monitoring (Prometheus + Grafana)"
    echo "  help        Afficher cette aide"
}

# Vérifier si Docker est installé
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé. Veuillez installer Docker d'abord."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
        exit 1
    fi
}

# Démarrer les services
start_services() {
    print_message "Démarrage des services DiaspoMoney..."
    
    # Vérifier si le fichier .env.local existe
    if [ ! -f ".env.local" ]; then
        print_warning "Fichier .env.local non trouvé. Copie de env.local.example..."
        cp env.local.example .env.local
        print_warning "Veuillez configurer les variables d'environnement dans .env.local"
    fi
    
    docker-compose -f docker-compose.local.yml up -d
    print_success "Services démarrés avec succès!"
    print_message "Application disponible sur: http://localhost:3000"
    print_message "MongoDB disponible sur: localhost:27017"
    print_message "Redis disponible sur: localhost:6379"
}

# Arrêter les services
stop_services() {
    print_message "Arrêt des services DiaspoMoney..."
    docker-compose -f docker-compose.local.yml down
    print_success "Services arrêtés avec succès!"
}

# Redémarrer les services
restart_services() {
    print_message "Redémarrage des services DiaspoMoney..."
    stop_services
    start_services
}

# Afficher les logs
show_logs() {
    docker-compose -f docker-compose.local.yml logs -f app
}

# Afficher tous les logs
show_logs_all() {
    docker-compose -f docker-compose.local.yml logs -f
}

# Nettoyer l'environnement
clean_environment() {
    print_warning "Nettoyage de l'environnement Docker..."
    docker-compose -f docker-compose.local.yml down -v
    docker system prune -f
    print_success "Environnement nettoyé!"
}

# Afficher le statut
show_status() {
    print_message "Statut des services:"
    docker-compose -f docker-compose.local.yml ps
}

# Ouvrir un shell dans l'app
open_shell() {
    docker-compose -f docker-compose.local.yml exec app sh
}

# Ouvrir un shell MongoDB
open_db_shell() {
    docker-compose -f docker-compose.local.yml exec mongodb mongosh -u admin -p password123 --authenticationDatabase admin
}

# Ouvrir un shell Redis
open_redis_shell() {
    docker-compose -f docker-compose.local.yml exec redis redis-cli -a redis123
}

# Démarrer avec monitoring
start_with_monitoring() {
    print_message "Démarrage avec monitoring..."
    docker-compose -f docker-compose.local.yml --profile monitoring up -d
    print_success "Services démarrés avec monitoring!"
    print_message "Application: http://localhost:3000"
    print_message "Prometheus: http://localhost:9090"
    print_message "Grafana: http://localhost:3001 (admin/admin123)"
}

# Script principal
main() {
    check_docker

    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs
            ;;
        logs-all)
            show_logs_all
            ;;
        clean)
            clean_environment
            ;;
        status)
            show_status
            ;;
        shell)
            open_shell
            ;;
        db)
            open_db_shell
            ;;
        redis)
            open_redis_shell
            ;;
        monitoring)
            start_with_monitoring
            ;;
        help|*)
            show_help
            ;;
    esac
}

main "$@"
