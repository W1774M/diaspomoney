#!/bin/bash

echo "🔧 Correction des dépendances Diaspomoney..."

# Supprimer les répertoires copy restants
echo "🗑️ Suppression des répertoires copy..."
rm -rf "components copy" "models copy" "types copy" "hooks copy" "lib copy" 2>/dev/null || true

# Supprimer node_modules et pnpm-lock.yaml
echo "🧹 Nettoyage des dépendances..."
rm -rf node_modules
rm -f pnpm-lock.yaml

# Installer les dépendances
echo "📦 Installation des nouvelles dépendances..."
pnpm install

# Vérifier les imports
echo "🔍 Vérification des imports..."
pnpm check-imports

echo "✅ Correction terminée !"
echo ""
echo "🚀 Vous pouvez maintenant lancer :"
echo "pnpm dev"
