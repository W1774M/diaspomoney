#!/bin/bash

# Configuration des scripts de base de données DiaspoMoney
# Ce fichier peut être modifié selon vos besoins

# ============================================================================
# CONFIGURATION DE LA BASE DE DONNÉES
# ============================================================================

# Nom de la base de données
export DB_NAME="diaspomoney"

# Nom du conteneur MongoDB
export CONTAINER_NAME="mongodb"

# Port MongoDB (par défaut)
export MONGODB_PORT="27017"

# URI de connexion MongoDB
export MONGODB_URI="mongodb://admin:admin123@localhost:27017/diaspomoney?authSource=admin"
export MONGODB_URI_CONTAINER="mongodb://admin:admin123@mongodb:27017/diaspomoney?authSource=admin"

# Utilisateurs MongoDB
export MONGO_ADMIN_USER="admin"
export MONGO_ADMIN_PASS="admin123"
export MONGO_APP_USER="diaspomoney_user"
export MONGO_APP_PASS="diaspomoney_pass"

# ============================================================================
# CONFIGURATION DES BACKUPS
# ============================================================================

# Répertoire de backup par défaut
export BACKUP_DIR="./backups"

# Nombre de jours de conservation des backups
export BACKUP_RETENTION_DAYS=30

# Compression des backups (gzip, bzip2, xz)
export BACKUP_COMPRESSION="gzip"

# Taille maximale des backups (en MB, 0 = illimité)
export MAX_BACKUP_SIZE=0

# ============================================================================
# CONFIGURATION DE LA MAINTENANCE
# ============================================================================

# Répertoire des logs
export LOG_DIR="./logs"

# Niveau de log (DEBUG, INFO, WARNING, ERROR)
export LOG_LEVEL="INFO"

# Rotation des logs (nombre de fichiers à conserver)
export LOG_ROTATION_COUNT=10

# Taille maximale des logs (en MB)
export MAX_LOG_SIZE=100

# ============================================================================
# CONFIGURATION DES ALERTES
# ============================================================================

# Seuil d'espace disque critique (en %)
export DISK_CRITICAL_THRESHOLD=80

# Seuil d'espace disque d'avertissement (en %)
export DISK_WARNING_THRESHOLD=70

# Seuil de performance des requêtes (en ms)
export QUERY_PERFORMANCE_THRESHOLD=100

# Seuil de connexions actives (en %)
export CONNECTION_THRESHOLD=80

# ============================================================================
# CONFIGURATION DE LA SÉCURITÉ
# ============================================================================

# Utilisateur pour exécuter les scripts
export SCRIPT_USER=""

# Groupe pour exécuter les scripts
export SCRIPT_GROUP=""

# Permissions des fichiers de backup
export BACKUP_PERMISSIONS="640"

# Chiffrement des backups (true/false)
export ENCRYPT_BACKUPS=false

# Clé de chiffrement (si chiffrement activé)
export ENCRYPTION_KEY=""

# ============================================================================
# CONFIGURATION DES NOTIFICATIONS
# ============================================================================

# Activer les notifications par email (true/false)
export EMAIL_NOTIFICATIONS=false

# Serveur SMTP
export SMTP_SERVER=""

# Port SMTP
export SMTP_PORT="587"

# Utilisateur SMTP
export SMTP_USER=""

# Mot de passe SMTP
export SMTP_PASSWORD=""

# Destinataire des notifications
export NOTIFICATION_EMAIL=""

# ============================================================================
# CONFIGURATION DU MONITORING
# ============================================================================

# Intervalle de monitoring (en secondes)
export MONITORING_INTERVAL=5

# Timeout des opérations (en secondes)
export OPERATION_TIMEOUT=300

# Nombre de tentatives pour les opérations
export MAX_RETRIES=3

# Délai entre les tentatives (en secondes)
export RETRY_DELAY=5

# ============================================================================
# CONFIGURATION DES PERFORMANCES
# ============================================================================

# Taille du buffer de lecture (en MB)
export READ_BUFFER_SIZE=16

# Taille du buffer d'écriture (en MB)
export WRITE_BUFFER_SIZE=16

# Nombre de threads pour les opérations parallèles
export MAX_THREADS=4

# ============================================================================
# CONFIGURATION DES COLLECTIONS
# ============================================================================

# Collections à exclure des backups
export EXCLUDED_COLLECTIONS=""

# Collections critiques (toujours sauvegardées)
export CRITICAL_COLLECTIONS="users,appointments,invoices"

# Taille maximale des collections (en MB, 0 = illimité)
export MAX_COLLECTION_SIZE=0

# ============================================================================
# CONFIGURATION DES INDEX
# ============================================================================

# Activer la maintenance des index (true/false)
export MAINTAIN_INDEXES=true

# Reconstruire les index défaillants (true/false)
export REBUILD_FAILED_INDEXES=true

# Analyser l'utilisation des index (true/false)
export ANALYZE_INDEX_USAGE=true

# ============================================================================
# CONFIGURATION DE LA RÉPLICATION
# ============================================================================

# Activer la sauvegarde des réplicas (true/false)
export BACKUP_REPLICAS=false

# Nombre de réplicas à sauvegarder
export REPLICA_COUNT=1

# ============================================================================
# CONFIGURATION DES ARCHIVES
# ============================================================================

# Activer l'archivage des anciens backups (true/false)
export ARCHIVE_OLD_BACKUPS=false

# Répertoire d'archivage
export ARCHIVE_DIR="./archives"

# Âge des backups à archiver (en jours)
export ARCHIVE_AGE_DAYS=90

# ============================================================================
# FONCTIONS UTILITAIRES
# ============================================================================

# Charger la configuration depuis un fichier personnalisé
load_custom_config() {
    local custom_config="$1"
    
    if [ -f "$custom_config" ]; then
        log_info "Chargement de la configuration personnalisée: $custom_config"
        source "$custom_config"
    fi
}

# Valider la configuration
validate_config() {
    log_info "Validation de la configuration..."
    
    # Vérifier les répertoires
    [ -d "$BACKUP_DIR" ] || mkdir -p "$BACKUP_DIR"
    [ -d "$LOG_DIR" ] || mkdir -p "$LOG_DIR"
    
    # Vérifier les valeurs numériques
    [ "$BACKUP_RETENTION_DAYS" -gt 0 ] || export BACKUP_RETENTION_DAYS=30
    [ "$DISK_CRITICAL_THRESHOLD" -gt 0 ] || export DISK_CRITICAL_THRESHOLD=80
    [ "$DISK_WARNING_THRESHOLD" -gt 0 ] || export DISK_WARNING_THRESHOLD=70
    
    # Vérifier les valeurs booléennes
    [ "$ENCRYPT_BACKUPS" = "true" ] || export ENCRYPT_BACKUPS=false
    [ "$EMAIL_NOTIFICATIONS" = "true" ] || export EMAIL_NOTIFICATIONS=false
    [ "$MAINTAIN_INDEXES" = "true" ] || export MAINTAIN_INDEXES=false
    
    log_success "Configuration validée"
}

# Afficher la configuration actuelle
show_config() {
    echo "=== Configuration des Scripts DiaspoMoney ==="
    echo ""
    echo "Base de données:"
    echo "  Nom: $DB_NAME"
    echo "  Conteneur: $CONTAINER_NAME"
    echo "  Port: $MONGODB_PORT"
    echo ""
    echo "Backups:"
    echo "  Répertoire: $BACKUP_DIR"
    echo "  Conservation: $BACKUP_RETENTION_DAYS jours"
    echo "  Compression: $BACKUP_COMPRESSION"
    echo "  Chiffrement: $ENCRYPT_BACKUPS"
    echo ""
    echo "Maintenance:"
    echo "  Logs: $LOG_DIR"
    echo "  Niveau: $LOG_LEVEL"
    echo "  Monitoring: ${MONITORING_INTERVAL}s"
    echo ""
    echo "Alertes:"
    echo "  Espace disque critique: $DISK_CRITICAL_THRESHOLD%"
    echo "  Espace disque avertissement: $DISK_WARNING_THRESHOLD%"
    echo "  Performance requêtes: ${QUERY_PERFORMANCE_THRESHOLD}ms"
    echo ""
    echo "Sécurité:"
    echo "  Utilisateur: ${SCRIPT_USER:-'système'}"
    echo "  Permissions: $BACKUP_PERMISSIONS"
    echo ""
}

# ============================================================================
# CHARGEMENT AUTOMATIQUE
# ============================================================================

# Charger la configuration personnalisée si elle existe
if [ -f "./scripts/config.local.sh" ]; then
    load_custom_config "./scripts/config.local.sh"
fi

# Valider la configuration
validate_config

# Exporter toutes les variables
export DB_NAME CONTAINER_NAME MONGODB_PORT
export BACKUP_DIR BACKUP_RETENTION_DAYS BACKUP_COMPRESSION MAX_BACKUP_SIZE
export LOG_DIR LOG_LEVEL LOG_ROTATION_COUNT MAX_LOG_SIZE
export DISK_CRITICAL_THRESHOLD DISK_WARNING_THRESHOLD
export QUERY_PERFORMANCE_THRESHOLD CONNECTION_THRESHOLD
export SCRIPT_USER SCRIPT_GROUP BACKUP_PERMISSIONS
export ENCRYPT_BACKUPS ENCRYPTION_KEY
export EMAIL_NOTIFICATIONS SMTP_SERVER SMTP_PORT SMTP_USER SMTP_PASSWORD NOTIFICATION_EMAIL
export MONITORING_INTERVAL OPERATION_TIMEOUT MAX_RETRIES RETRY_DELAY
export READ_BUFFER_SIZE WRITE_BUFFER_SIZE MAX_THREADS
export EXCLUDED_COLLECTIONS CRITICAL_COLLECTIONS MAX_COLLECTION_SIZE
export MAINTAIN_INDEXES REBUILD_FAILED_INDEXES ANALYZE_INDEX_USAGE
export BACKUP_REPLICAS REPLICA_COUNT
export ARCHIVE_OLD_BACKUPS ARCHIVE_DIR ARCHIVE_AGE_DAYS
