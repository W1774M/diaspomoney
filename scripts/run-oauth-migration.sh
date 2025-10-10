#!/bin/bash

# Script pour exécuter la migration des utilisateurs OAuth
echo "🔄 Début de la migration des utilisateurs OAuth..."

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier que TypeScript est disponible
if ! command -v npx &> /dev/null; then
    echo "❌ npx n'est pas disponible"
    exit 1
fi

# Exécuter la migration
echo "📦 Exécution de la migration..."
npx tsx scripts/migrate-oauth-users.ts

if [ $? -eq 0 ]; then
    echo "✅ Migration terminée avec succès"
else
    echo "❌ Erreur lors de la migration"
    exit 1
fi
