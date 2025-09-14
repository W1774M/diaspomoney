#!/bin/bash

# Script de maintenance et monitoring de la base de données DiaspoMoney
# Usage: ./scripts/db-maintenance.sh [options]

set -e  # Arrêter en cas d'erreur

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_NAME="diaspomoney"
CONTAINER_NAME="mongodb"
LOG_FILE="$PROJECT_DIR/logs/db-maintenance.log"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> "$LOG_FILE"
}

log_debug() {
    echo -e "${CYAN}[DEBUG]${NC} $1"
    if [ "$VERBOSE" = true ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') [DEBUG] $1" >> "$LOG_FILE"
    fi
}

# Fonction d'aide
show_help() {
    echo "Script de maintenance et monitoring de la base de données DiaspoMoney"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Afficher cette aide"
    echo "  -s, --status            Afficher le statut de la base de données"
    echo "  -m, --monitor           Monitoring en temps réel"
    echo "  -o, --optimize          Optimiser la base de données"
    echo "  -c, --cleanup           Nettoyer les données obsolètes"
    echo "  -r, --repair            Réparer la base de données"
    echo "  -i, --info              Informations détaillées sur la base"
    echo "  -v, --verbose           Mode verbeux"
    echo "  --health-check          Vérification de santé complète"
    echo "  --performance           Analyse des performances"
    echo ""
    echo "Exemples:"
    echo "  $0 -s                   # Statut de la base"
    echo "  $0 -m                   # Monitoring en temps réel"
    echo "  $0 -o                   # Optimisation"
    echo "  $0 --health-check       # Vérification de santé"
    echo "  $0 --performance        # Analyse des performances"
    echo ""
}

# Variables par défaut
VERBOSE=false
ACTION=""

# Parsing des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -s|--status)
            ACTION="status"
            shift
            ;;
        -m|--monitor)
            ACTION="monitor"
            shift
            ;;
        -o|--optimize)
            ACTION="optimize"
            shift
            ;;
        -c|--cleanup)
            ACTION="cleanup"
            shift
            ;;
        -r|--repair)
            ACTION="repair"
            shift
            ;;
        -i|--info)
            ACTION="info"
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --health-check)
            ACTION="health"
            shift
            ;;
        --performance)
            ACTION="performance"
            shift
            ;;
        *)
            log_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Créer le répertoire de logs
mkdir -p "$(dirname "$LOG_FILE")"

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
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

# Fonction de statut
show_status() {
    log_info "=== Statut de la base de données ==="
    
    # Statut du conteneur
    log_info "Statut du conteneur MongoDB:"
    docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # Connexion à la base
    log_info "Test de connexion à la base de données:"
    if docker exec "$CONTAINER_NAME" mongosh --quiet --eval "db.adminCommand('ping')" | grep -q "1"; then
        log_success "Connexion MongoDB OK"
    else
        log_error "Connexion MongoDB échouée"
        return 1
    fi
    
    # Informations sur la base
    log_info "Informations sur la base '$DB_NAME':"
    docker exec "$CONTAINER_NAME" mongosh --quiet --eval "
        use $DB_NAME;
        print('Base de données: ' + db.getName());
        print('Collections: ' + db.getCollectionNames().length);
        print('Taille totale: ' + (db.stats().dataSize / 1024 / 1024).toFixed(2) + ' MB');
    "
}

# Fonction de monitoring
monitor_database() {
    log_info "=== Monitoring en temps réel ==="
    log_info "Appuyez sur Ctrl+C pour arrêter"
    
    trap 'log_info "Monitoring arrêté"; exit 0' INT
    
    while true; do
        clear
        echo "=== Monitoring MongoDB - $(date) ==="
        echo ""
        
        # Statut du conteneur
        echo "📦 Conteneur:"
        docker ps --filter "name=$CONTAINER_NAME" --format "  {{.Names}}: {{.Status}}"
        echo ""
        
        # Statistiques de la base
        echo "🗄️  Base de données '$DB_NAME':"
        docker exec "$CONTAINER_NAME" mongosh --quiet --eval "
            use $DB_NAME;
            const stats = db.stats();
            print('  Collections: ' + stats.collections);
            print('  Documents: ' + stats.objects);
            print('  Taille des données: ' + (stats.dataSize / 1024 / 1024).toFixed(2) + ' MB');
            print('  Taille de stockage: ' + (stats.storageSize / 1024 / 1024).toFixed(2) + ' MB');
            print('  Index: ' + stats.indexes);
            print('  Taille des index: ' + (stats.indexSize / 1024 / 1024).toFixed(2) + ' MB');
        " | sed 's/^/  /'
        
        echo ""
        echo "⏱️  Mise à jour dans 5 secondes..."
        sleep 5
    done
}

# Fonction d'optimisation
optimize_database() {
    log_info "=== Optimisation de la base de données ==="
    
    # Vérifier l'espace disque
    log_info "Vérification de l'espace disque:"
    docker exec "$CONTAINER_NAME" df -h /data/db
    
    # Compacter les collections
    log_info "Compactage des collections..."
    docker exec "$CONTAINER_NAME" mongosh --quiet --eval "
        use $DB_NAME;
        const collections = db.getCollectionNames();
        collections.forEach(function(collName) {
            print('Compactage de: ' + collName);
            try {
                db.runCommand({compact: collName});
                print('  ✓ Compactage réussi');
            } catch(e) {
                print('  ✗ Erreur: ' + e.message);
            }
        });
    "
    
    # Mise à jour des statistiques
    log_info "Mise à jour des statistiques..."
    docker exec "$CONTAINER_NAME" mongosh --quiet --eval "
        use $DB_NAME;
        db.runCommand({dbStats: 1, scale: 1024*1024});
    "
    
    log_success "Optimisation terminée"
}

# Fonction de nettoyage
cleanup_database() {
    log_info "=== Nettoyage de la base de données ==="
    
    # Supprimer les documents obsolètes (exemple: plus de 1 an)
    log_info "Suppression des documents obsolètes..."
    
    # Supprimer les tokens expirés
    docker exec "$CONTAINER_NAME" mongosh --quiet --eval "
        use $DB_NAME;
        
        // Supprimer les tokens de vérification expirés
        const expiredTokens = db.emailverificationtokens.deleteMany({
            expiresAt: {\$lt: new Date()}
        });
        print('Tokens de vérification supprimés: ' + expiredTokens.deletedCount);
        
        // Supprimer les tokens de reset expirés
        const expiredResetTokens = db.passwordresettokens.deleteMany({
            expiresAt: {\$lt: new Date()}
        });
        print('Tokens de reset supprimés: ' + expiredResetTokens.deletedCount);
        
        // Supprimer les tokens de retry expirés
        const expiredRetryTokens = db.retrytokens.deleteMany({
            expiresAt: {\$lt: new Date()}
        });
        print('Tokens de retry supprimés: ' + expiredRetryTokens.deletedCount);
    "
    
    log_success "Nettoyage terminé"
}

# Fonction de réparation
repair_database() {
    log_info "=== Réparation de la base de données ==="
    
    # Vérifier l'intégrité
    log_info "Vérification de l'intégrité..."
    docker exec "$CONTAINER_NAME" mongosh --quiet --eval "
        use $DB_NAME;
        const result = db.runCommand({dbHash: 1});
        print('Hash de la base: ' + result.md5);
    "
    
    # Réparer les collections
    log_info "Réparation des collections..."
    docker exec "$CONTAINER_NAME" mongosh --quiet --eval "
        use $DB_NAME;
        const collections = db.getCollectionNames();
        collections.forEach(function(collName) {
            print('Réparation de: ' + collName);
            try {
                db.runCommand({repairDatabase: 1});
                print('  ✓ Réparation réussie');
            } catch(e) {
                print('  ✗ Erreur: ' + e.message);
            }
        });
    "
    
    log_success "Réparation terminée"
}

# Fonction d'informations détaillées
show_detailed_info() {
    log_info "=== Informations détaillées ==="
    
    # Informations système
    log_info "Informations système MongoDB:"
    docker exec "$CONTAINER_NAME" mongosh --quiet --eval "
        const buildInfo = db.runCommand({buildInfo: 1});
        print('Version: ' + buildInfo.version);
        print('Architecture: ' + buildInfo.bits + ' bits');
        print('OS: ' + buildInfo.os);
        print('JavaScript Engine: ' + buildInfo.jsEngine);
    " | sed 's/^/  /'
    
    # Statistiques détaillées
    log_info "Statistiques détaillées de la base '$DB_NAME':"
    docker exec "$CONTAINER_NAME" mongosh --quiet --eval "
        use $DB_NAME;
        const stats = db.stats();
        print('Collections: ' + stats.collections);
        print('Vues: ' + stats.views);
        print('Documents: ' + stats.objects);
        print('Taille des données: ' + (stats.dataSize / 1024 / 1024).toFixed(2) + ' MB');
        print('Taille de stockage: ' + (stats.storageSize / 1024 / 1024).toFixed(2) + ' MB');
        print('Index: ' + stats.indexes);
        print('Taille des index: ' + (stats.indexSize / 1024 / 1024).toFixed(2) + ' MB');
        print('Taille moyenne des documents: ' + (stats.avgObjSize / 1024).toFixed(2) + ' KB');
    " | sed 's/^/  /'
    
    # Collections et leurs tailles
    log_info "Détail des collections:"
    docker exec "$CONTAINER_NAME" mongosh --quiet --eval "
        use $DB_NAME;
        const collections = db.getCollectionNames();
        collections.forEach(function(collName) {
            const collStats = db.getCollection(collName).stats();
            print(collName + ':');
            print('  Documents: ' + collStats.count);
            print('  Taille: ' + (collStats.size / 1024 / 1024).toFixed(2) + ' MB');
            print('  Stockage: ' + (collStats.storageSize / 1024 / 1024).toFixed(2) + ' MB');
            print('  Index: ' + collStats.nindexes);
        });
    " | sed 's/^/  /'
}

# Fonction de vérification de santé
health_check() {
    log_info "=== Vérification de santé complète ==="
    
    local health_score=0
    local total_checks=0
    
    # Vérification 1: Connexion
    log_info "1. Test de connexion..."
    if docker exec "$CONTAINER_NAME" mongosh --quiet --eval "db.adminCommand('ping')" | grep -q "1"; then
        log_success "✓ Connexion OK"
        ((health_score++))
    else
        log_error "✗ Connexion échouée"
    fi
    ((total_checks++))
    
    # Vérification 2: Espace disque
    log_info "2. Vérification de l'espace disque..."
    local disk_usage=$(docker exec "$CONTAINER_NAME" df /data/db | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 80 ]; then
        log_success "✓ Espace disque OK ($disk_usage%)"
        ((health_score++))
    else
        log_warning "⚠ Espace disque critique ($disk_usage%)"
    fi
    ((total_checks++))
    
    # Vérification 3: Performance des requêtes
    log_info "3. Test de performance..."
    local query_time=$(docker exec "$CONTAINER_NAME" mongosh --quiet --eval "
        use $DB_NAME;
        const start = Date.now();
        db.users.findOne();
        const end = Date.now();
        print(end - start);
    ")
    if [ "$query_time" -lt 100 ]; then
        log_success "✓ Performance OK (${query_time}ms)"
        ((health_score++))
    else
        log_warning "⚠ Performance lente (${query_time}ms)"
    fi
    ((total_checks++))
    
    # Vérification 4: Intégrité des données
    log_info "4. Vérification de l'intégrité..."
    if docker exec "$CONTAINER_NAME" mongosh --quiet --eval "use $DB_NAME; db.runCommand({dbHash: 1})" > /dev/null 2>&1; then
        log_success "✓ Intégrité OK"
        ((health_score++))
    else
        log_error "✗ Problème d'intégrité détecté"
    fi
    ((total_checks++))
    
    # Score final
    local percentage=$((health_score * 100 / total_checks))
    echo ""
    log_info "Score de santé: $health_score/$total_checks ($percentage%)"
    
    if [ "$percentage" -ge 80 ]; then
        log_success "État de santé: EXCELLENT"
    elif [ "$percentage" -ge 60 ]; then
        log_warning "État de santé: BON"
    elif [ "$percentage" -ge 40 ]; then
        log_warning "État de santé: MOYEN"
    else
        log_error "État de santé: CRITIQUE"
    fi
}

# Fonction d'analyse des performances
analyze_performance() {
    log_info "=== Analyse des performances ==="
    
    # Statistiques des opérations
    log_info "Statistiques des opérations:"
    docker exec "$CONTAINER_NAME" mongosh --quiet --eval "
        const stats = db.adminCommand({serverStatus: 1});
        print('Opérations par seconde:');
        print('  Inserts: ' + stats.opcounters.insert);
        print('  Queries: ' + stats.opcounters.query);
        print('  Updates: ' + stats.opcounters.update);
        print('  Deletes: ' + stats.opcounters.delete);
        print('  GetMores: ' + stats.opcounters.getmore);
        print('');
        print('Connexions:');
        print('  Actives: ' + stats.connections.active);
        print('  Disponibles: ' + stats.connections.available);
        print('  En cours: ' + stats.connections.current);
    " | sed 's/^/  /'
    
    # Index utilisés
    log_info "Analyse des index:"
    docker exec "$CONTAINER_NAME" mongosh --quiet --eval "
        use $DB_NAME;
        const collections = db.getCollectionNames();
        collections.forEach(function(collName) {
            const collStats = db.getCollection(collName).stats();
            if (collStats.nindexes > 1) {
                print(collName + ':');
                const indexes = db.getCollection(collName).getIndexes();
                indexes.forEach(function(idx) {
                    print('  - ' + idx.name + ' (' + Object.keys(idx.key).join(', ') + ')');
                });
            }
        });
    " | sed 's/^/  /'
    
    # Recommandations
    log_info "Recommandations d'optimisation:"
    echo "  - Vérifiez que les index correspondent aux requêtes fréquentes"
    echo "  - Surveillez la taille des collections et des index"
    echo "  - Utilisez la projection pour limiter les données retournées"
    echo "  - Considérez la pagination pour les grandes collections"
}

# Fonction principale
main() {
    log_info "=== Script de Maintenance DiaspoMoney ==="
    log_info "Date: $(date)"
    
    check_prerequisites
    
    case $ACTION in
        "status")
            show_status
            ;;
        "monitor")
            monitor_database
            ;;
        "optimize")
            optimize_database
            ;;
        "cleanup")
            cleanup_database
            ;;
        "repair")
            repair_database
            ;;
        "info")
            show_detailed_info
            ;;
        "health")
            health_check
            ;;
        "performance")
            analyze_performance
            ;;
        "")
            log_error "Aucune action spécifiée"
            show_help
            exit 1
            ;;
        *)
            log_error "Action inconnue: $ACTION"
            exit 1
            ;;
    esac
    
    log_success "=== Opération terminée ==="
}

# Exécution du script
main "$@"
