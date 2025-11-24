# Script PowerShell pour suivre les logs de l'application en temps réel
# Usage: .\scripts\watch-logs.ps1 [fichier_log]

param(
    [string]$LogFile = "logs\app.log"
)

$LogPath = Join-Path $PSScriptRoot "..\$LogFile"

if (-not (Test-Path $LogPath)) {
    Write-Host "⚠️  Le fichier de log n'existe pas encore: $LogPath" -ForegroundColor Yellow
    Write-Host "💡 Démarrez l'application avec LOG_FILE=true pour activer l'écriture des logs dans un fichier" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Exemple: `$env:LOG_FILE='true'; pnpm dev" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ou attendez que l'application crée le fichier..." -ForegroundColor Yellow
    Write-Host ""
    
    # Attendre que le fichier soit créé
    Write-Host "⏳ Attente de la création du fichier..." -ForegroundColor Cyan
    $timeout = 30
    $elapsed = 0
    while (-not (Test-Path $LogPath) -and $elapsed -lt $timeout) {
        Start-Sleep -Seconds 1
        $elapsed++
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    Write-Host ""
    
    if (-not (Test-Path $LogPath)) {
        Write-Host "❌ Le fichier n'a pas été créé après $timeout secondes" -ForegroundColor Red
        exit 1
    }
}

Write-Host "📋 Suivi des logs: $LogPath" -ForegroundColor Green
Write-Host "💡 Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Cyan
Write-Host ""

# Suivre le fichier en temps réel
Get-Content -Path $LogPath -Wait -Tail 50

