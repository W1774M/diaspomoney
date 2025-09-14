#!/bin/bash

# Script de test des scripts de base de données DiaspoMoney
# Usage: ./scripts/test-all.sh

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fonctions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Test de la configuration
test_config() {
    log_info "=== Test de la Configuration ==="
    
    if [ -f "$SCRIPT_DIR/config.sh" ]; then
        log_success "Fichier de configuration trouvé"
        source "$SCRIPT_DIR/config.sh"
        
        if [ -n "$DB_NAME" ] && [ -n "$CONTAINER_NAME" ]; then
            log_success "Configuration valide"
            return 0
        else
            log_error "Variables manquantes"
            return 1
        fi
    else
        log_error "Configuration manquante"
        return 1
    fi
}

# Test des scripts
test_scripts() {
    log_info "=== Test des Scripts ==="
    
    local scripts=("backup-db.sh" "restore-db.sh" "db-maintenance.sh")
    local errors=0
    
    for script in "${scripts[@]}"; do
        if [ -f "$SCRIPT_DIR/$script" ]; then
            log_success "Script $script trouvé"
            
            if [ -x "$SCRIPT_DIR/$script" ]; then
                log_success "Script $script exécutable"
            else
                chmod +x "$SCRIPT_DIR/$script"
                log_info "Permissions corrigées pour $script"
            fi
            
            if bash -n "$SCRIPT_DIR/$script" 2>/dev/null; then
                log_success "Syntaxe $script OK"
            else
                log_error "Erreur syntaxe $script"
                ((errors++))
            fi
        else
            log_error "Script $script manquant"
            ((errors++))
        fi
    done
    
    return $errors
}

# Test des répertoires
test_dirs() {
    log_info "=== Test des Répertoires ==="
    
    local dirs=("backups" "logs" "archives")
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$PROJECT_DIR/$dir" ]; then
            mkdir -p "$PROJECT_DIR/$dir"
            log_info "Répertoire créé: $dir"
        fi
        
        if [ -w "$PROJECT_DIR/$dir" ]; then
            log_success "Répertoire $dir accessible"
        else
            log_error "Répertoire $dir non accessible"
        fi
    done
}

# Test de Docker
test_docker() {
    log_info "=== Test de Docker ==="
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker non installé"
        return 1
    fi
    
    log_success "Docker installé: $(docker --version)"
    
    if ! docker info &> /dev/null; then
        log_warning "Docker non démarré"
        return 1
    fi
    
    log_success "Docker démarré"
    
    if docker ps | grep -q mongodb; then
        log_success "Conteneur MongoDB actif"
        return 0
    else
        log_warning "Conteneur MongoDB non trouvé"
        return 1
    fi
}

# Test des scripts de base de données
test_db_scripts() {
    log_info "=== Test des Scripts DB ==="
    
    local errors=0
    
    # Test backup
    if ../scripts/backup-db.sh --dry-run &> /dev/null; then
        log_success "Script backup fonctionne"
    else
        log_error "Script backup échoue"
        ((errors++))
    fi
    
    # Test maintenance
    if ../scripts/db-maintenance.sh -s &> /dev/null; then
        log_success "Script maintenance fonctionne"
    else
        log_error "Script maintenance échoue"
        ((errors++))
    fi
    
    return $errors
}

# Fonction principale
main() {
    log_info "=== Test des Scripts DiaspoMoney ==="
    
    local exit_code=0
    
    test_config || exit_code=1
    test_scripts || exit_code=1
    test_dirs
    test_docker || exit_code=1
    test_db_scripts || exit_code=1
    
    echo ""
    if [ $exit_code -eq 0 ]; then
        log_success "=== Tous les tests sont passés ==="
    else
        log_warning "=== Certains tests ont échoué ==="
    fi
    
    return $exit_code
}

# Exécution
main "$@"
