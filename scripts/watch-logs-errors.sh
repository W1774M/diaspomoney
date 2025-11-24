#!/bin/bash
# Script bash pour suivre uniquement les erreurs et warnings
# Usage: ./scripts/watch-logs-errors.sh [fichier_log]

LOG_FILE="${1:-logs/app.log}"
LOG_PATH="$(dirname "$0")/../$LOG_FILE"

if [ ! -f "$LOG_PATH" ]; then
    echo "⚠️  Le fichier de log n'existe pas encore: $LOG_PATH"
    echo "💡 Démarrez l'application avec LOG_FILE=true pour activer l'écriture des logs"
    echo ""
    echo "Exemple: LOG_FILE=true pnpm dev"
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

echo "🔍 Suivi des ERREURS et WARNINGS: $LOG_PATH"
echo "💡 Appuyez sur Ctrl+C pour arrêter"
echo ""

# Suivre le fichier et filtrer les erreurs/warnings
tail -f "$LOG_PATH" | grep --line-buffered -E "level.*(4[0-9]|5[0-9])|level.*warn|level.*error|level.*fatal|ERROR|WARN|WARNING|Error:|Warning" | while IFS= read -r line; do
    # Coloriser selon le type
    if echo "$line" | grep -qE "level.*error|level.*fatal|ERROR|Error:"; then
        echo -e "\033[31m$line\033[0m"  # Rouge pour les erreurs
    elif echo "$line" | grep -qE "level.*warn|WARN|WARNING|Warning"; then
        echo -e "\033[33m$line\033[0m"  # Jaune pour les warnings
    else
        echo "$line"
    fi
done

