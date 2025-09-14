#!/bin/bash

# Script de test simplifié des scripts de base de données DiaspoMoney
# Usage: ./scripts/test-simple.sh

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

# Test de la configuration
test_configuration() {
    log_info "=== Test de la Configuration ==="
    
    if [ -f "$SCRIPT_DIR/config.sh" ]; then
        log_success "Fichier de configuration trouvé"
        
        # Charger la configuration
        source "$SCRIPT_DIR/config.sh"
        
        # Vérifier les variables essentielles
        if [ -n "$DB_NAME" ] && [ -n "$CONTAINER_NAME" ] && [ -n "$BACKUP_DIR" ]; then
            log_success "Configuration valide"
            log_info "DB_NAME: $DB_NAME"
            log_info "CONTAINER_NAME: $CONTAINER_NAME"
            log_info "BACKUP_DIR: $BACKUP_DIR"
        else
            log_error "Variables de configuration manquantes"
            return 1
        fi
    else
        log_error "Fichier de configuration manquant"
        return 1
    fi
}

# Test des scripts
test_scripts() {
    log_info "=== Test des Scripts ==="
    
    local scripts=("backup-db.sh" "restore-db.sh" "db-maintenance.sh" "start-docker.sh")
    local missing_scripts=()
    
    for script in "${scripts[@]}"; do
        if [ -f "$SCRIPT_DIR/$script" ]; then
            log_success "Script $script trouvé"
            
            # Vérifier les permissions
            if [ -x "$SCRIPT_DIR/$script" ]; then
                log_success "Script $script est exécutable"
            else
                log_warning "Script $script n'est pas exécutable"
            fi
            
            # Tester la syntaxe
            if bash -n "$SCRIPT_DIR/$script" 2>/dev/null; then
                log_success "Syntaxe du script $script valide"
            else
                log_error "Erreur de syntaxe dans $script"
            fi
        else
            missing_scripts+=("$script")
        fi
    done
    
    if [ ${#missing_scripts[@]} -gt 0 ]; then
        log_warning "Scripts manquants: ${missing_scripts[*]}"
    fi
}

# Test des répertoires
test_directories() {
    log_info "=== Test des Répertoires ==="
    
    local required_dirs=("backups" "logs" "archives")
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$PROJECT_DIR/$dir" ]; then
            mkdir -p "$PROJECT_DIR/$dir"
            log_info "Répertoire créé: $dir"
        else
            log_success "Répertoire existant: $dir"
        fi
        
        # Vérifier les permissions
        if [ -w "$PROJECT_DIR/$dir" ]; then
            log_success "Répertoire $dir accessible en écriture"
        else
            log_error "Répertoire $dir non accessible en écriture"
        fi
    done
}

# Test des dépendances
test_dependencies() {
    log_info "=== Test des Dépendances ==="
    
    local dependencies=("bash" "gzip" "find" "stat")
    local missing_deps=()
    
    for dep in "${dependencies[@]}"; do
        if command -v "$dep" &> /dev/null; then
            log_success "Dépendance $dep trouvée"
        else
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_warning "Dépendances manquantes: ${missing_deps[*]}"
    else
        log_success "Toutes les dépendances sont disponibles"
    fi
}

# Test de Docker
test_docker() {
    log_info "=== Test de Docker ==="
    
    # Vérifier si Docker est installé
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        return 1
    fi
    
    log_success "Docker est installé: $(docker --version)"
    
    # Vérifier si Docker est en cours d'exécution
    if ! docker info &> /dev/null; then
        log_warning "Docker n'est pas en cours d'exécution"
        log_info "Démarrez Docker Desktop manuellement"
        return 1
    fi
    
    log_success "Docker est en cours d'exécution"
    
    # Vérifier docker-compose
    if command -v docker-compose &> /dev/null; then
        log_success "docker-compose est installé: $(docker-compose --version)"
    else
        log_warning "docker-compose n'est pas installé"
    fi
}

# Test des fichiers de configuration
test_config_files() {
    log_info "=== Test des Fichiers de Configuration ==="
    
    # Vérifier docker-compose.yml
    if [ -f "$PROJECT_DIR/docker/docker-compose.yml" ]; then
        log_success "docker-compose.yml trouvé"
    else
        log_error "docker-compose.yml manquant"
    fi
    
    # Vérifier .env
    if [ -f "$PROJECT_DIR/.env" ]; then
        log_success "Fichier .env trouvé"
    else
        log_warning "Fichier .env manquant"
    fi
}

# Test de sécurité
test_security() {
    log_info "=== Test de Sécurité ==="
    
    # Vérifier les permissions des scripts
    local scripts=("backup-db.sh" "restore-db.sh" "db-maintenance.sh")
    
    for script in "${scripts[@]}"; do
        if [ -f "$SCRIPT_DIR/$script" ]; then
            local perms=$(stat -c %a "$SCRIPT_DIR/$script" 2>/dev/null || stat -f %Lp "$SCRIPT_DIR/$script" 2>/dev/null)
            local owner=$(stat -c %U "$SCRIPT_DIR/$script" 2>/dev/null || stat -f %Su "$SCRIPT_DIR/$script" 2>/dev/null)
            
            log_info "Script $script: permissions $perms, propriétaire $owner"
            
            # Vérifier que les permissions ne sont pas trop ouvertes
            if [ "$perms" = "777" ] || [ "$perms" = "666" ]; then
                log_warning "Permissions trop ouvertes pour $script"
            fi
        fi
    done
}

# Fonction principale
main() {
    log_info "=== Test Simplifié des Scripts DiaspoMoney ==="
    
    local exit_code=0
    
    # Exécuter les tests
    test_configuration || exit_code=1
    test_scripts || exit_code=1
    test_directories
    test_dependencies
    test_docker || exit_code=1
    test_config_files
    test_security
    
    # Résumé final
    echo ""
    if [ $exit_code -eq 0 ]; then
        log_success "=== Tous les tests sont passés ==="
        log_info "Vous pouvez maintenant utiliser les scripts de backup et maintenance"
    else
        log_warning "=== Certains tests ont échoué ==="
        log_info "Vérifiez les erreurs ci-dessus avant d'utiliser les scripts"
    fi
    
    return $exit_code
}

# Exécution du script
main "$@"
