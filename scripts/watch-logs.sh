#!/bin/bash
# Script bash pour suivre les logs de l'application en temps réel
# Usage: ./scripts/watch-logs.sh [fichier_log]

LOG_FILE="${1:-logs/app.log}"
LOG_PATH="$(dirname "$0")/../$LOG_FILE"

if [ ! -f "$LOG_PATH" ]; then
    echo "⚠️  Le fichier de log n'existe pas encore: $LOG_PATH"
    echo "💡 Démarrez l'application avec LOG_FILE=true pour activer l'écriture des logs dans un fichier"
    echo ""
    echo "Exemple: LOG_FILE=true pnpm dev"
    echo ""
    echo "Ou attendez que l'application crée le fichier..."
    echo ""
    
    # Attendre que le fichier soit créé
    echo "⏳ Attente de la création du fichier..."
    timeout=30
    elapsed=0
    while [ ! -f "$LOG_PATH" ] && [ $elapsed -lt $timeout ]; do
        sleep 1
        elapsed=$((elapsed + 1))
        echo -n "."
    done
    echo ""
    
    if [ ! -f "$LOG_PATH" ]; then
        echo "❌ Le fichier n'a pas été créé après ${timeout} secondes"
        exit 1
    fi
fi

echo "📋 Suivi des logs: $LOG_PATH"
echo "💡 Appuyez sur Ctrl+C pour arrêter"
echo ""

# Suivre le fichier en temps réel (tail -f)
tail -f "$LOG_PATH"

