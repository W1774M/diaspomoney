#!/bin/bash

# Script pour supprimer les déclarations export const dynamic individuelles
# car elles sont maintenant définies globalement

echo "🗑️  Suppression des déclarations export const dynamic individuelles..."

# Trouver tous les fichiers route.ts avec export const dynamic
FILES=$(find app/api -name "route.ts" -type f -exec grep -l "export const dynamic" {} \;)

for file in $FILES; do
    echo "   Traitement: $file"
    # Supprimer les lignes export const dynamic et export const runtime
    # ainsi que les commentaires associés (avec ou sans espaces)
    sed -i '/^[[:space:]]*\/\/.*[Dd]ésactiver.*prerendering/d' "$file"
    sed -i '/^[[:space:]]*\/\/.*[Dd]isable.*prerendering/d' "$file"
    sed -i '/^[[:space:]]*export const dynamic/d' "$file"
    sed -i '/^[[:space:]]*export const runtime/d' "$file"
    # Supprimer les lignes vides multiples
    sed -i '/^$/N;/^\n$/d' "$file"
done

echo "✅ Terminé!"

