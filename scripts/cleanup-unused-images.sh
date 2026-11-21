#!/bin/bash

# Script pour trouver et supprimer les images non utilisées
# Usage: ./scripts/cleanup-unused-images.sh [--dry-run] [--delete]

DRY_RUN=true
DELETE=false

if [[ "$*" == *"--delete"* ]]; then
    DELETE=true
    DRY_RUN=false
fi

if [[ "$*" == *"--dry-run"* ]]; then
    DRY_RUN=true
fi

echo "🔍 Recherche des images non utilisées..."
echo ""

# Trouver toutes les images dans public (sauf uploads et img/users/providers)
IMAGES=$(find public -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" -o -name "*.svg" -o -name "*.ico" \) ! -path "public/uploads/*" ! -path "public/img/users/providers/*")

TOTAL=0
UNUSED=0
USED=0

echo "📸 Images trouvées:"
echo "$IMAGES" | while read -r image; do
    if [ -z "$image" ]; then
        continue
    fi
    
    TOTAL=$((TOTAL + 1))
    
    # Obtenir le nom du fichier et le chemin relatif depuis public
    RELATIVE_PATH="/${image#public/}"
    FILENAME=$(basename "$image")
    FILENAME_NO_EXT="${FILENAME%.*}"
    
    # Chercher les références dans le code
    FOUND=$(grep -r -l --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.md" --include="*.html" --include="*.css" \
        -e "$RELATIVE_PATH" \
        -e "${RELATIVE_PATH#/}" \
        -e "$FILENAME" \
        -e "$FILENAME_NO_EXT" \
        . 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v ".git")
    
    if [ -z "$FOUND" ]; then
        UNUSED=$((UNUSED + 1))
        echo "❌ NON UTILISÉE: $RELATIVE_PATH"
        if [ "$DELETE" = true ]; then
            echo "   🗑️  Suppression: $image"
            rm "$image"
        fi
    else
        USED=$((USED + 1))
        echo "✅ Utilisée: $RELATIVE_PATH"
    fi
done

echo ""
echo "📊 Résumé:"
echo "   Total: $TOTAL"
echo "   Utilisées: $USED"
echo "   Non utilisées: $UNUSED"

if [ "$DRY_RUN" = true ] && [ "$UNUSED" -gt 0 ]; then
    echo ""
    echo "💡 Pour supprimer les images non utilisées, exécutez:"
    echo "   ./scripts/cleanup-unused-images.sh --delete"
fi

