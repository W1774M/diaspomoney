# Script PowerShell pour corriger les dépendances Diaspomoney

Write-Host "🔧 Correction des dépendances Diaspomoney..." -ForegroundColor Green

# Supprimer les répertoires copy restants
Write-Host "🗑️ Suppression des répertoires copy..." -ForegroundColor Yellow
if (Test-Path "components copy") { Remove-Item "components copy" -Recurse -Force }
if (Test-Path "models copy") { Remove-Item "models copy" -Recurse -Force }
if (Test-Path "types copy") { Remove-Item "types copy" -Recurse -Force }
if (Test-Path "hooks copy") { Remove-Item "hooks copy" -Recurse -Force }
if (Test-Path "lib copy") { Remove-Item "lib copy" -Recurse -Force }

# Supprimer node_modules et pnpm-lock.yaml
Write-Host "🧹 Nettoyage des dépendances..." -ForegroundColor Yellow
if (Test-Path "node_modules") { Remove-Item "node_modules" -Recurse -Force }
if (Test-Path "pnpm-lock.yaml") { Remove-Item "pnpm-lock.yaml" -Force }

# Installer les dépendances
Write-Host "📦 Installation des nouvelles dépendances..." -ForegroundColor Yellow
pnpm install

# Vérifier les imports
Write-Host "🔍 Vérification des imports..." -ForegroundColor Yellow
pnpm check-imports

Write-Host "✅ Correction terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Vous pouvez maintenant lancer :" -ForegroundColor Cyan
Write-Host "pnpm dev" -ForegroundColor White
