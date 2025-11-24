# Script PowerShell pour suivre uniquement les erreurs et warnings
# Usage: .\scripts\watch-logs-errors.ps1

param(
    [string]$LogFile = "logs\app.log"
)

$LogPath = Join-Path $PSScriptRoot "..\$LogFile"

if (-not (Test-Path $LogPath)) {
    Write-Host "⚠️  Le fichier de log n'existe pas encore: $LogPath" -ForegroundColor Yellow
    Write-Host "💡 Démarrez l'application avec LOG_FILE=true pour activer l'écriture des logs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Exemple: `$env:LOG_FILE='true'; pnpm dev" -ForegroundColor Green
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

Write-Host "🔍 Suivi des ERREURS et WARNINGS: $LogPath" -ForegroundColor Yellow
Write-Host "💡 Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Cyan
Write-Host ""

# Suivre le fichier et filtrer les erreurs/warnings
Get-Content -Path $LogPath -Wait -Tail 0 | 
    Where-Object { 
        $line = $_
        $isError = $line -match "level.*error" -or $line -match "level.*fatal" -or $line -match "ERROR" -or $line -match "Error:"
        $isWarning = $line -match "level.*warn" -or $line -match "WARN" -or $line -match "WARNING" -or $line -match "Warning"
        $isLevel40Plus = $line -match "level.*(4[0-9]|5[0-9])"
        $isError -or $isWarning -or $isLevel40Plus
    } | 
    ForEach-Object {
        $line = $_
        if ($line -match "level.*error" -or $line -match "level.*fatal" -or $line -match "ERROR" -or $line -match "Error:") {
            Write-Host $line -ForegroundColor Red
        } elseif ($line -match "level.*warn" -or $line -match "WARN" -or $line -match "WARNING" -or $line -match "Warning") {
            Write-Host $line -ForegroundColor Yellow
        } else {
            Write-Host $line
        }
    }
