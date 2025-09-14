#!/bin/bash

# Script de restauration de la base de données DiaspoMoney
# Usage: ./scripts/restore-db.sh [options] <backup_file>

set -e  # Arrêter en cas d'erreur

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
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
    echo "Script de restauration de la base de données DiaspoMoney"
    echo ""
    echo "Usage: $0 [options] <backup_file>"
    echo ""
    echo "Options:"
    echo "  -h, --help              Afficher cette aide"
    echo "  -d, --database          Nom de la base de données cible (défaut: $DB_NAME)"
    echo "  -c, --collections       Restaurer seulement certaines collections (séparées par des virgules)"
    echo "  -f, --force             Forcer la restauration sans confirmation"
    echo "  --drop                  Supprimer la base de données existante avant la restauration"
    echo "  --dry-run               Simulation sans exécuter la restauration"
    echo "  -v, --verbose           Mode verbeux"
    echo ""
    echo "Arguments:"
    echo "  backup_file             Fichier de backup à restaurer (.gz)"
    echo ""
    echo "Exemples:"
    echo "  $0 backup.gz                    # Restauration complète"
    echo "  $0 -d test_db backup.gz         # Restauration dans la base 'test_db'"
    echo "  $0 -c users,appointments backup.gz # Restauration partielle"
    echo "  $0 --drop backup.gz             # Restauration avec suppression de l'existant"
    echo "  $0 --dry-run backup.gz          # Simulation de restauration"
    echo ""
}

# Variables par défaut
TARGET_DB="$DB_NAME"
COLLECTIONS=""
FORCE=false
DROP_DB=false
DRY_RUN=false
VERBOSE=false

# Parsing des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--database)
            TARGET_DB="$2"
            shift 2
            ;;
        -c|--collections)
            COLLECTIONS="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        --drop)
            DROP_DB=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -*)
            log_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
        *)
            BACKUP_FILE="$1"
            shift
            ;;
    esac
done

# Vérifications préliminaires
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier si un fichier de backup a été spécifié
    if [ -z "$BACKUP_FILE" ]; then
        log_error "Aucun fichier de backup spécifié"
        show_help
        exit 1
    fi
    
    # Vérifier si le fichier de backup existe
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Le fichier de backup n'existe pas: $BACKUP_FILE"
        exit 1
    fi
    
    # Vérifier l'extension du fichier
    if [[ ! "$BACKUP_FILE" =~ \.gz$ ]]; then
        log_error "Le fichier de backup doit avoir l'extension .gz"
        exit 1
    fi
    
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
    
    log_success "Prérequis vérifiés"
}

# Fonction de confirmation
confirm_restore() {
    if [ "$FORCE" = true ]; then
        return
    fi
    
    echo ""
    log_warning "⚠️  ATTENTION: Cette opération va restaurer la base de données '$TARGET_DB'"
    if [ "$DROP_DB" = true ]; then
        log_warning "⚠️  La base de données existante sera SUPPRIMÉE avant la restauration"
    fi
    echo ""
    echo "Fichier de backup: $BACKUP_FILE"
    echo "Base de données cible: $TARGET_DB"
    if [ -n "$COLLECTIONS" ]; then
        echo "Collections à restaurer: $COLLECTIONS"
    fi
    echo ""
    
    read -p "Êtes-vous sûr de vouloir continuer ? (oui/non): " -r
    if [[ ! $REPLY =~ ^[Oo]ui$ ]]; then
        log_info "Restauration annulée"
        exit 0
    fi
}

# Fonction de sauvegarde de la base existante
backup_existing_db() {
    if [ "$DROP_DB" = true ]; then
        log_info "Sauvegarde de la base de données existante avant suppression..."
        
        local backup_file="backup_before_restore_$(date +%Y%m%d_%H%M%S).gz"
        
        if docker exec "$CONTAINER_NAME" mongodump \
            --db "$TARGET_DB" \
            --gzip \
            --archive="/tmp/$backup_file" \
            --quiet; then
            
            # Copier le fichier de backup du conteneur
            docker cp "$CONTAINER_NAME:/tmp/$backup_file" "$backup_file"
            
            # Nettoyer le fichier temporaire dans le conteneur
            docker exec "$CONTAINER_NAME" rm -f "/tmp/$backup_file"
            
            log_success "Sauvegarde de sécurité créée: $backup_file"
        else
            log_warning "Impossible de sauvegarder la base existante (peut-être vide)"
        fi
    fi
}

# Fonction de restauration
perform_restore() {
    log_info "Début de la restauration..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Simulation de restauration de $BACKUP_FILE vers $TARGET_DB"
        return
    fi
    
    # Copier le fichier de backup dans le conteneur
    local container_backup="/tmp/restore_backup.gz"
    docker cp "$BACKUP_FILE" "$CONTAINER_NAME:$container_backup"
    
    # Supprimer la base de données existante si demandé
    if [ "$DROP_DB" = true ]; then
        log_info "Suppression de la base de données existante '$TARGET_DB'..."
        docker exec "$CONTAINER_NAME" mongosh --quiet --eval "use $TARGET_DB; db.dropDatabase();"
    fi
    
    # Restaurer la base de données
    if [ -n "$COLLECTIONS" ]; then
        log_info "Restauration des collections: $COLLECTIONS"
        
        # Restauration partielle des collections
        local collections_array=(${COLLECTIONS//,/ })
        for collection in "${collections_array[@]}"; do
            log_info "Restauration de la collection: $collection"
            if ! docker exec "$CONTAINER_NAME" mongorestore \
                --db "$TARGET_DB" \
                --collection "$collection" \
                --gzip \
                --archive="$container_backup"; then
                log_error "Échec de la restauration de la collection: $collection"
                exit 1
            fi
        done
    else
        log_info "Restauration complète de la base de données..."
        if ! docker exec "$CONTAINER_NAME" mongorestore \
            --db "$TARGET_DB" \
            --gzip \
            --archive="$container_backup"; then
            log_error "Échec de la restauration complète"
            exit 1
        fi
    fi
    
    # Nettoyer le fichier temporaire dans le conteneur
    docker exec "$CONTAINER_NAME" rm -f "$container_backup"
    
    log_success "Restauration terminée avec succès"
}

# Fonction de vérification
verify_restore() {
    if [ "$DRY_RUN" = true ]; then
        return
    fi
    
    log_info "Vérification de la restauration..."
    
    # Vérifier que la base de données existe
    if docker exec "$CONTAINER_NAME" mongosh --quiet --eval "use $TARGET_DB; db.getName();" | grep -q "$TARGET_DB"; then
        log_success "Base de données '$TARGET_DB' créée avec succès"
    else
        log_error "La base de données '$TARGET_DB' n'a pas été créée"
        exit 1
    fi
    
    # Lister les collections
    log_info "Collections dans la base '$TARGET_DB':"
    docker exec "$CONTAINER_NAME" mongosh --quiet --eval "use $TARGET_DB; db.getCollectionNames();" | grep -v "^$" | sed 's/^/  - /'
    
    # Compter les documents dans chaque collection
    log_info "Nombre de documents par collection:"
    docker exec "$CONTAINER_NAME" mongosh --quiet --eval "use $TARGET_DB; db.getCollectionNames().forEach(function(collName) { print(collName + ': ' + db.getCollection(collName).countDocuments()); });" | grep -v "^$" | sed 's/^/  - /'
}

# Fonction principale
main() {
    log_info "=== Script de Restauration DiaspoMoney ==="
    log_info "Date: $(date)"
    log_info "Fichier de backup: $BACKUP_FILE"
    log_info "Base de données cible: $TARGET_DB"
    log_info "Mode: $([ -n "$COLLECTIONS" ] && echo "Partiel: $COLLECTIONS" || echo "Complet")"
    
    if [ "$DROP_DB" = true ]; then
        log_warning "Mode DROP activé - la base existante sera supprimée"
    fi
    
    if [ "$DRY_RUN" = true ]; then
        log_warning "MODE DRY RUN - Aucune action ne sera effectuée"
    fi
    
    check_prerequisites
    confirm_restore
    backup_existing_db
    perform_restore
    verify_restore
    
    log_success "=== Restauration terminée avec succès ==="
}

# Exécution du script
main "$@"
