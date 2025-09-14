#!/bin/bash

# Script de backup de la base de données DiaspoMoney
# Usage: ./scripts/backup-db.sh [options]

set -e  # Arrêter en cas d'erreur

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME="diaspomoney"
CONTAINER_NAME="mongodb"

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

# Fonction d'aide
show_help() {
    echo "Script de backup de la base de données DiaspoMoney"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Afficher cette aide"
    echo "  -f, --full              Backup complet (toutes les collections)"
    echo "  -c, --collections       Backup des collections spécifiques (séparées par des virgules)"
    echo "  -d, --directory         Répertoire de destination (défaut: ./backups)"
    echo "  -k, --keep-days         Garder les backups pendant X jours (défaut: 30)"
    echo "  -v, --verbose           Mode verbeux"
    echo "  --dry-run               Simulation sans exécuter le backup"
    echo ""
    echo "Exemples:"
    echo "  $0                      # Backup complet par défaut"
    echo "  $0 -f                   # Backup complet explicite"
    echo "  $0 -c users,appointments # Backup des collections users et appointments"
    echo "  $0 -d /tmp/backups      # Backup dans /tmp/backups"
    echo "  $0 -k 7                 # Garder les backups pendant 7 jours"
    echo ""
}

# Variables par défaut
FULL_BACKUP=true
COLLECTIONS=""
VERBOSE=false
DRY_RUN=false
KEEP_DAYS=30

# Parsing des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--full)
            FULL_BACKUP=true
            shift
            ;;
        -c|--collections)
            COLLECTIONS="$2"
            FULL_BACKUP=false
            shift 2
            ;;
        -d|--directory)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -k|--keep-days)
            KEEP_DAYS="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            log_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Vérifications préliminaires
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier si Docker est installé
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé ou n'est pas dans le PATH"
        exit 1
    fi
    
    # Vérifier si le conteneur MongoDB est en cours d'exécution
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        log_error "Le conteneur MongoDB '$CONTAINER_NAME' n'est pas en cours d'exécution"
        log_info "Démarrage du conteneur..."
        if ! docker start "$CONTAINER_NAME"; then
            log_error "Impossible de démarrer le conteneur MongoDB"
            exit 1
        fi
        # Attendre que MongoDB soit prêt
        log_info "Attente que MongoDB soit prêt..."
        sleep 10
    fi
    
    # Créer le répertoire de backup s'il n'existe pas
    mkdir -p "$BACKUP_DIR"
    
    log_success "Prérequis vérifiés"
}

# Fonction de backup
perform_backup() {
    local backup_file=""
    
    if [ "$FULL_BACKUP" = true ]; then
        log_info "Début du backup complet de la base de données '$DB_NAME'..."
        backup_file="$BACKUP_DIR/${DB_NAME}_full_${DATE}.gz"
        
        if [ "$DRY_RUN" = true ]; then
            log_info "DRY RUN: Backup complet vers $backup_file"
            return
        fi
        
        # Backup complet avec mongodump
        if docker exec "$CONTAINER_NAME" mongodump \
            --db "$DB_NAME" \
            --gzip \
            --archive="/tmp/backup.gz" \
            --quiet; then
            
            # Copier le fichier de backup du conteneur
            docker cp "$CONTAINER_NAME:/tmp/backup.gz" "$backup_file"
            
            # Nettoyer le fichier temporaire dans le conteneur
            docker exec "$CONTAINER_NAME" rm -f /tmp/backup.gz
            
            log_success "Backup complet réussi: $backup_file"
        else
            log_error "Échec du backup complet"
            exit 1
        fi
    else
        if [ -z "$COLLECTIONS" ]; then
            log_error "Aucune collection spécifiée pour le backup partiel"
            exit 1
        fi
        
        log_info "Début du backup des collections: $COLLECTIONS"
        backup_file="$BACKUP_DIR/${DB_NAME}_collections_${DATE}.gz"
        
        if [ "$DRY_RUN" = true ]; then
            log_info "DRY RUN: Backup des collections vers $backup_file"
            return
        fi
        
        # Backup des collections spécifiques
        local collections_array=(${COLLECTIONS//,/ })
        local collection_args=""
        
        for collection in "${collections_array[@]}"; do
            collection_args="$collection_args --collection $collection"
        done
        
        if docker exec "$CONTAINER_NAME" mongodump \
            --db "$DB_NAME" \
            $collection_args \
            --gzip \
            --archive="/tmp/backup.gz" \
            --quiet; then
            
            # Copier le fichier de backup du conteneur
            docker cp "$CONTAINER_NAME:/tmp/backup.gz" "$backup_file"
            
            # Nettoyer le fichier temporaire dans le conteneur
            docker exec "$CONTAINER_NAME" rm -f /tmp/backup.gz
            
            log_success "Backup des collections réussi: $backup_file"
        else
            log_error "Échec du backup des collections"
            exit 1
        fi
    fi
    
    # Afficher la taille du fichier de backup
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        log_info "Taille du backup: $size"
    fi
}

# Fonction de nettoyage des anciens backups
cleanup_old_backups() {
    log_info "Nettoyage des backups de plus de $KEEP_DAYS jours..."
    
    local deleted_count=0
    local current_time=$(date +%s)
    local cutoff_time=$((current_time - KEEP_DAYS * 24 * 60 * 60))
    
    for backup_file in "$BACKUP_DIR"/*.gz; do
        if [ -f "$backup_file" ]; then
            local file_time=$(stat -c %Y "$backup_file" 2>/dev/null || stat -f %m "$backup_file" 2>/dev/null)
            if [ "$file_time" -lt "$cutoff_time" ]; then
                if [ "$DRY_RUN" = true ]; then
                    log_info "DRY RUN: Suppression de $backup_file"
                else
                    rm -f "$backup_file"
                    log_info "Supprimé: $backup_file"
                fi
                ((deleted_count++))
            fi
        fi
    done
    
    if [ "$deleted_count" -gt 0 ]; then
        log_success "$deleted_count ancien(s) backup(s) supprimé(s)"
    else
        log_info "Aucun ancien backup à supprimer"
    fi
}

# Fonction de vérification de l'intégrité
verify_backup() {
    if [ "$DRY_RUN" = true ]; then
        return
    fi
    
    log_info "Vérification de l'intégrité du backup..."
    
    # Trouver le fichier de backup le plus récent
    local latest_backup=$(find "$BACKUP_DIR" -name "*.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -z "$latest_backup" ]; then
        log_warning "Aucun fichier de backup trouvé pour la vérification"
        return
    fi
    
    log_info "Vérification de: $latest_backup"
    
    # Vérifier que le fichier n'est pas corrompu
    if gzip -t "$latest_backup" 2>/dev/null; then
        log_success "Le fichier de backup est valide"
    else
        log_error "Le fichier de backup est corrompu: $latest_backup"
        exit 1
    fi
}

# Fonction principale
main() {
    log_info "=== Script de Backup DiaspoMoney ==="
    log_info "Date: $(date)"
    log_info "Répertoire de backup: $BACKUP_DIR"
    log_info "Mode: $([ "$FULL_BACKUP" = true ] && echo "Complet" || echo "Partiel: $COLLECTIONS")"
    log_info "Conservation: $KEEP_DAYS jours"
    
    if [ "$DRY_RUN" = true ]; then
        log_warning "MODE DRY RUN - Aucune action ne sera effectuée"
    fi
    
    check_prerequisites
    perform_backup
    cleanup_old_backups
    verify_backup
    
    log_success "=== Backup terminé avec succès ==="
    
    # Afficher un résumé
    local total_backups=$(find "$BACKUP_DIR" -name "*.gz" -type f | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
    log_info "Total des backups: $total_backups"
    log_info "Espace utilisé: $total_size"
}

# Exécution du script
main "$@"
