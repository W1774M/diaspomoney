#!/bin/bash

echo "🧹 Nettoyage du projet Diaspomoney..."

# Supprimer les dossiers de build et cache
echo "📁 Suppression des dossiers de build..."
rm -rf .next
rm -rf out
rm -rf dist
rm -rf build
rm -rf coverage
rm -rf node_modules
rm -rf .turbo

# Supprimer les fichiers de cache
echo "🗑️ Suppression des fichiers de cache..."
rm -f .eslintcache
rm -f .prettierignore
rm -f tsconfig.tsbuildinfo
rm -f pnpm-lock.yaml

# Nettoyer le cache npm/pnpm
echo "🧽 Nettoyage du cache pnpm..."
pnpm store prune

# Réinstaller les dépendances
echo "📦 Réinstallation des dépendances..."
pnpm install

# Vérifier les imports
echo "🔍 Vérification des imports..."
pnpm check-imports

# Vérifier la qualité du code
echo "✅ Vérification de la qualité du code..."
pnpm quality:check

echo "🎉 Nettoyage et installation terminés !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Copier env.example vers .env.local"
echo "2. Configurer les variables d'environnement"
echo "3. Lancer le serveur de développement : pnpm dev"
