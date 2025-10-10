#!/bin/bash

set -e

# ============================================================================
# SCRIPT DE SAUVEGARDE DE BASE DE DONNÉES
# ============================================================================
# Ce script crée deux types de sauvegardes :
# 1. Export CSV/Excel envoyé par email
# 2. Backup MongoDB natif pour réintégration facile
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

# Configuration email (Resend API)
RESEND_API_KEY="${RESEND_API_KEY:-re_eB7EYahQ_38j5cShU5cch8M2AsegHBuHP}"
EMAIL_FROM="${EMAIL_FROM:-no-reply@diaspomoney.fr}"
EMAIL_TO="${EMAIL_TO:-b.malar@diaspomoney.fr}"

# Timestamp pour les noms de fichiers
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
USERNAME=$(whoami)
BACKUP_NAME="backup_manuel_${TIMESTAMP}_${USERNAME}"

echo "🗄️  DiaspoMoney - Sauvegarde de base de données"
echo "📅 Timestamp: $TIMESTAMP"
echo "👤 Utilisateur: $USERNAME"
echo "📧 Email de destination: $EMAIL_TO"

# Créer le répertoire backups s'il n'existe pas
mkdir -p "$BACKUPS_DIR"

# ============================================================================
# ÉTAPE 1: VÉRIFICATION DE LA CONNEXION MONGODB
# ============================================================================

echo "🔗 Vérification de la connexion MongoDB..."
if ! docker exec mongodb mongosh --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "❌ MongoDB n'est pas accessible. Démarrez d'abord les services avec ./scripts/start-dev.sh"
    exit 1
fi
echo "✅ MongoDB est accessible"

# ============================================================================
# ÉTAPE 2: EXPORT CSV/EXCEL POUR EMAIL
# ============================================================================

echo "📊 Export des données en format CSV/Excel..."

# Créer un répertoire temporaire pour les exports (sous backups pour compatibilité Linux/CI)
TEMP_DIR="$BACKUPS_DIR/run_$TIMESTAMP"
mkdir -p "$TEMP_DIR"

# Collections à exporter
COLLECTIONS=("users" "appointments" "invoices" "specialities" "partners" "providers" "transactions" "wallets" "notifications")

# Exporter chaque collection en CSV
for collection in "${COLLECTIONS[@]}"; do
    echo "📋 Export de la collection: $collection"
    
    # Vérifier si la collection existe et contient des données
    count=$(docker exec mongodb mongosh --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin --eval "db.$collection.countDocuments()" diaspomoney --quiet)
    
    if [ "$count" -gt 0 ]; then
        # Export JSON (array) dans le container puis copie sur l'hôte
        if docker exec mongodb mongoexport --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin --db "$DB_NAME" --collection "$collection" --out "/tmp/${collection}.json" --jsonArray >/dev/null 2>&1; then
            docker cp "mongodb:/tmp/${collection}.json" "$TEMP_DIR/${collection}.json"
            docker exec mongodb rm -f "/tmp/${collection}.json" >/dev/null 2>&1 || true
        else
            echo "⚠️  Échec d'export JSON via mongoexport pour $collection"
            continue
        fi
        
        # Convertir JSON en CSV (approche simple)
        if [ -s "$TEMP_DIR/${collection}.json" ]; then
            # Utiliser mongoexport directement en CSV si possible
            if docker exec mongodb mongoexport --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin --db diaspomoney --collection "$collection" --type csv --out "/tmp/${collection}.csv" >/dev/null 2>&1; then
                docker cp "mongodb:/tmp/${collection}.csv" "$TEMP_DIR/"
                docker exec mongodb rm -f "/tmp/${collection}.csv"
                echo "✅ CSV créé pour $collection"
            else
                # Fallback: conversion manuelle JSON vers CSV
                node -e "
                    const fs = require('fs');
                    try {
                        const content = fs.readFileSync('$TEMP_DIR/${collection}.json', 'utf8');
                        const lines = content.trim().split('\n').filter(line => line.trim());
                        if (lines.length === 0) {
                            console.log('⚠️  Fichier JSON vide pour $collection');
                            process.exit(0);
                        }
                        
                        const data = lines.map(line => {
                            try { return JSON.parse(line); } 
                            catch(e) { return null; }
                        }).filter(item => item !== null);
                        
                        if (data.length === 0) {
                            console.log('⚠️  Aucune donnée valide pour $collection');
                            process.exit(0);
                        }
                        
                        const keys = Object.keys(data[0]);
                        const csv = [keys.join(',')];
                        
                        data.forEach(row => {
                            const values = keys.map(key => {
                                const val = row[key];
                                if (val === null || val === undefined) return '';
                                if (typeof val === 'object') return '\"' + JSON.stringify(val).replace(/\"/g, '\"\"') + '\"';
                                return '\"' + String(val).replace(/\"/g, '\"\"') + '\"';
                            });
                            csv.push(values.join(','));
                        });
                        
                        fs.writeFileSync('$TEMP_DIR/${collection}.csv', csv.join('\n'));
                        console.log('✅ CSV créé pour $collection');
                    } catch (error) {
                        console.log('⚠️  Erreur conversion CSV pour $collection:', error.message);
                    }
                " 2>/dev/null || echo "⚠️  Échec de conversion CSV pour $collection"
            fi
        fi
    else
        echo "⚠️  Collection $collection vide, ignorée"
    fi
done

# Créer un fichier Excel si possible (avec LibreOffice ou Python)
echo "📈 Création du fichier Excel..."
if command -v python3 >/dev/null 2>&1; then
    python3 -c "
import pandas as pd
import os
import glob

csv_files = glob.glob('$TEMP_DIR/*.csv')
if csv_files:
    with pd.ExcelWriter('$TEMP_DIR/backup_diaspomoney.xlsx', engine='openpyxl') as writer:
        for csv_file in csv_files:
            collection_name = os.path.basename(csv_file).replace('.csv', '')
            try:
                df = pd.read_csv(csv_file)
                df.to_excel(writer, sheet_name=collection_name[:31], index=False)
                print(f'✅ Ajouté {collection_name} au fichier Excel')
            except Exception as e:
                print(f'⚠️  Erreur avec {collection_name}: {e}')
    print('✅ Fichier Excel créé: backup_diaspomoney.xlsx')
else
    print('⚠️  Python3 non disponible, création Excel ignorée')
" 2>/dev/null || echo "⚠️  Impossible de créer le fichier Excel"
fi

# ============================================================================
# ÉTAPE 3: ENVOI PAR EMAIL
# ============================================================================

echo "📧 Envoi des données par email..."

# Zipper les CSV pour l'email
EMAIL_ZIP="$BACKUPS_DIR/csv_export_${TIMESTAMP}.zip"
if command -v zip >/dev/null 2>&1; then
    echo "📦 Création du ZIP avec zip..."
    (cd "$TEMP_DIR" && zip -q -r "$EMAIL_ZIP" *.csv 2>/dev/null || true)
elif command -v powershell >/dev/null 2>&1; then
    echo "📦 Création du ZIP avec PowerShell..."
    EMAIL_ZIP="$BACKUPS_DIR/csv_export_${TIMESTAMP}.zip"
    powershell -Command "Compress-Archive -Path '$TEMP_DIR/*.csv' -DestinationPath '$EMAIL_ZIP' -Force" 2>/dev/null || echo "Erreur PowerShell"
else
    EMAIL_ZIP="$BACKUPS_DIR/csv_export_${TIMESTAMP}.tar.gz"
    echo "📦 Création du TAR.GZ avec tar..."
    echo "📁 Répertoire source: $TEMP_DIR"
    echo "📁 Fichiers CSV disponibles:"
    ls -la "$TEMP_DIR"/*.csv 2>/dev/null || echo "Aucun fichier CSV trouvé"
    (cd "$TEMP_DIR" && tar -czf "$EMAIL_ZIP" *.csv 2>/dev/null || echo "Erreur tar")
fi

echo "📁 Archive créée: $EMAIL_ZIP"
if [ -f "$EMAIL_ZIP" ]; then
    echo "✅ Archive créée avec succès"
    ls -la "$EMAIL_ZIP" 2>/dev/null || echo "Archive trouvée mais ls échoue"
else
    echo "❌ Archive non créée"
fi

EMAIL_SENT=0

if [ -f "$EMAIL_ZIP" ] && [ -n "$RESEND_API_KEY" ]; then
    echo "📤 Envoi via Resend API..."
    
    # Encoder le fichier zip en base64
    ZIP_B64=$(base64 -w 0 "$EMAIL_ZIP" 2>/dev/null || base64 -b 0 "$EMAIL_ZIP" 2>/dev/null)
    
    if [ -n "$ZIP_B64" ]; then
        # Créer un fichier JSON temporaire
        JSON_FILE="/tmp/resend_$$.json"
        cat > "$JSON_FILE" <<EOF
{
  "from": "$EMAIL_FROM",
  "to": ["$EMAIL_TO"],
  "subject": "Sauvegarde DiaspoMoney - $TIMESTAMP",
  "html": "<h2>Sauvegarde DiaspoMoney</h2><p>Bonjour,</p><p>Voici la sauvegarde CSV de la base DiaspoMoney.</p><ul><li><strong>Utilisateur:</strong> $USERNAME</li><li><strong>Base:</strong> $DB_NAME</li><li><strong>Collections:</strong> ${COLLECTIONS[*]}</li><li><strong>Date:</strong> $TIMESTAMP</li></ul><p>Les fichiers CSV sont joints à cet email.</p>",
  "attachments": [
    {
      "filename": "$(basename "$EMAIL_ZIP")",
      "content": "$ZIP_B64",
      "type": "application/zip"
    }
  ]
}
EOF
        
        # Envoyer via curl
        RESPONSE=$(curl -s -k -w "%{http_code}" -X POST "https://api.resend.com/emails" \
            -H "Authorization: Bearer $RESEND_API_KEY" \
            -H "Content-Type: application/json" \
            -d @"$JSON_FILE")
        
        # Nettoyer le fichier temporaire
        rm -f "$JSON_FILE"
        
        HTTP_CODE="${RESPONSE: -3}"
        
        if [ "$HTTP_CODE" = "200" ]; then
            EMAIL_SENT=1
            echo "✅ Email envoyé avec succès à $EMAIL_TO"
        else
            echo "⚠️  Erreur Resend API (HTTP $HTTP_CODE)"
            echo "Réponse: ${RESPONSE%???}"
        fi
    else
        echo "⚠️  Impossible d'encoder le fichier zip"
    fi
else
    if [ ! -f "$EMAIL_ZIP" ]; then
        echo "⚠️  Archive CSV absente, envoi ignoré"
    else
        echo "⚠️  RESEND_API_KEY non configuré, envoi ignoré"
    fi
fi

# ============================================================================
# ÉTAPE 4: BACKUP RÉIMPORTABLE (JSON + métadonnées)
# ============================================================================

echo "💾 Préparation du backup réimportable (JSON)..."

BACKUP_PATH="$BACKUPS_DIR/$BACKUP_NAME"
mkdir -p "$BACKUP_PATH/$DB_NAME"

# Copier les exports JSON dans le dossier de backup
cp "$TEMP_DIR"/*.json "$BACKUP_PATH/$DB_NAME/" 2>/dev/null || true

# Créer un fichier de métadonnées
cat > "$BACKUP_PATH/metadata.json" << EOF
{
  "backup_date": "$(date -Iseconds)",
  "backup_name": "$BACKUP_NAME",
  "user": "$USERNAME",
  "database": "$DB_NAME",
  "mongodb_uri": "$MONGODB_URI_EFFECTIVE",
  "collections": [$(printf '"%s",' "${COLLECTIONS[@]}" | sed 's/,$//')],
  "restore_command": "for f in ./$DB_NAME/*.json; do c=\$(basename \"$f\" .json); mongoimport --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin --db $DB_NAME --collection \"$c\" --file \"$f\" --jsonArray; done"
}
EOF

# Compresser le backup
echo "🗜️  Compression du backup..."
cd "$BACKUPS_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"
echo "✅ Backup compressé: ${BACKUP_NAME}.tar.gz"

# ============================================================================
# ÉTAPE 5: NETTOYAGE ET RÉSUMÉ
# ============================================================================

# Nettoyer les fichiers temporaires
rm -rf "$TEMP_DIR"

echo ""
echo "🎉 Sauvegarde terminée avec succès !"
echo ""
echo "📋 Résumé :"
echo "   • Backup natif: $BACKUPS_DIR/${BACKUP_NAME}.tar.gz"
if [ "$EMAIL_SENT" -eq 1 ]; then
    echo "   • Email envoyé à: $EMAIL_TO"
else
    echo "   • Email non envoyé (Python3 indisponible ou RESEND_API_KEY manquant)"
fi
echo "   • Collections sauvegardées: ${COLLECTIONS[*]}"
echo ""
echo "🔄 Pour restaurer le backup :"
echo "   cd $BACKUPS_DIR"
echo "   tar -xzf ${BACKUP_NAME}.tar.gz"
echo "   mongorestore --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin --db $DB_NAME ./$DB_NAME"
echo ""
