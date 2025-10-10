#!/bin/bash

set -e

# ============================================================================
# SCRIPT DE RESTAURATION DE BASE DE DONNÉES
# ============================================================================
# Ce script restaure un backup MongoDB créé par backup-db.sh
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUPS_DIR="$PROJECT_DIR/backups"

# Charger les variables d'environnement
if [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$PROJECT_DIR/.env"
    set +a
fi

# Configuration MongoDB
MONGODB_URI_EFFECTIVE="${MONGODB_URI:-mongodb://admin:admin123@localhost:27017/diaspomoney?authSource=admin}"
DB_NAME="diaspomoney"

echo "🔄 DiaspoMoney - Restauration de base de données"

# Lister les backups disponibles
echo "📁 Backups disponibles :"
ls -la "$BACKUPS_DIR"/*.tar.gz 2>/dev/null | while read -r line; do
    echo "   $line"
done

# Demander le backup à restaurer
echo ""
read -p "📝 Entrez le nom du backup à restaurer (sans .tar.gz) : " BACKUP_NAME

if [ -z "$BACKUP_NAME" ]; then
    echo "❌ Nom de backup requis"
    exit 1
fi

BACKUP_FILE="$BACKUPS_DIR/${BACKUP_NAME}.tar.gz"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Fichier de backup non trouvé: $BACKUP_FILE"
    exit 1
fi

echo "🔍 Backup trouvé: $BACKUP_FILE"

# Vérifier la connexion MongoDB
echo "🔗 Vérification de la connexion MongoDB..."
if ! docker exec mongodb mongosh --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "❌ MongoDB n'est pas accessible. Démarrez d'abord les services avec ./scripts/start-dev.sh"
    exit 1
fi
echo "✅ MongoDB est accessible"

# Confirmation avant restauration
echo ""
echo "⚠️  ATTENTION: Cette opération va écraser la base de données actuelle !"
read -p "Êtes-vous sûr de vouloir continuer ? (oui/non) : " CONFIRM

if [ "$CONFIRM" != "oui" ]; then
    echo "❌ Restauration annulée"
    exit 0
fi

# Extraire le backup
echo "📦 Extraction du backup..."
TEMP_RESTORE="/tmp/restore_$$"
mkdir -p "$TEMP_RESTORE"

if tar -xzf "$BACKUP_FILE" -C "$TEMP_RESTORE"; then
    echo "✅ Backup extrait dans $TEMP_RESTORE"
else
    echo "❌ Erreur lors de l'extraction"
    rm -rf "$TEMP_RESTORE"
    exit 1
fi

# Vérifier la structure du backup
echo "📁 Contenu du répertoire extrait:"
ls -la "$TEMP_RESTORE"

# Chercher le dossier de la base de données
DB_DIR=""
if [ -d "$TEMP_RESTORE/$DB_NAME" ]; then
    DB_DIR="$TEMP_RESTORE/$DB_NAME"
    echo "✅ Structure directe trouvée: $DB_DIR"
elif [ -d "$TEMP_RESTORE/backup_manuel_"*"/$DB_NAME" ]; then
    DB_DIR=$(find "$TEMP_RESTORE" -name "$DB_NAME" -type d | head -1)
    echo "✅ Structure imbriquée trouvée: $DB_DIR"
else
    echo "❌ Structure de backup invalide"
    echo "📁 Recherche du dossier $DB_NAME..."
    find "$TEMP_RESTORE" -name "$DB_NAME" -type d
    rm -rf "$TEMP_RESTORE"
    exit 1
fi

# Lire les métadonnées si disponibles
METADATA_FILE=""
if [ -f "$TEMP_RESTORE/metadata.json" ]; then
    METADATA_FILE="$TEMP_RESTORE/metadata.json"
elif [ -f "$(dirname "$DB_DIR")/metadata.json" ]; then
    METADATA_FILE="$(dirname "$DB_DIR")/metadata.json"
fi

if [ -n "$METADATA_FILE" ] && [ -f "$METADATA_FILE" ]; then
    echo "📋 Métadonnées du backup :"
    cat "$METADATA_FILE" | python3 -m json.tool 2>/dev/null || cat "$METADATA_FILE"
fi

# Vider la base actuelle (optionnel)
echo "🗑️  Vidage de la base de données actuelle..."
docker exec mongodb mongosh --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin --eval "db.dropDatabase()" "$DB_NAME" >/dev/null 2>&1 || true

# Restaurer avec mongoimport (plus fiable)
echo "🔄 Restauration des données..."

# Restaurer avec mongoimport pour chaque collection
for json_file in "$DB_DIR"/*.json; do
    if [ -f "$json_file" ]; then
        collection_name=$(basename "$json_file" .json)
        echo "📋 Import de la collection: $collection_name"
        
        # Copier le fichier dans le container
        docker cp "$json_file" "mongodb:/tmp/$collection_name.json"
        
        # Importer avec mongoimport
        docker exec mongodb mongoimport --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin --db "$DB_NAME" --collection "$collection_name" --file "/tmp/$collection_name.json" --jsonArray >/dev/null 2>&1 || \
        docker exec mongodb mongoimport --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin --db "$DB_NAME" --collection "$collection_name" --file "/tmp/$collection_name.json" >/dev/null 2>&1
        
        # Nettoyer
        docker exec mongodb rm -f "/tmp/$collection_name.json"
        echo "✅ Collection $collection_name importée"
    fi
done

# Nettoyer
rm -rf "$TEMP_RESTORE"

# Vérifier la restauration
echo "🔍 Vérification de la restauration..."
collections_count=$(docker exec mongodb mongosh --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin --eval "db.getCollectionNames().length" "$DB_NAME" --quiet)
echo "✅ $collections_count collections restaurées"

echo ""
echo "🎉 Restauration terminée avec succès !"
echo "🔗 Base de données: $DB_NAME"
echo "📊 Collections: $collections_count"
