# Script de backup de la base de données DiaspoMoney pour Windows
# Usage: .\scripts\backup-db.ps1 [options]

param(
    [switch]$Help,
    [switch]$Full,
    [string]$Collections,
    [string]$Directory,
    [int]$KeepDays = 30,
    [switch]$Verbose,
    [switch]$DryRun
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$BackupDir = if ($Directory) { $Directory } else { Join-Path $ProjectDir "backups" }
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$DBName = "diaspomoney"
$ContainerName = "mongodb"

# Fonctions utilitaires
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Fonction d'aide
function Show-Help {
    Write-Host "Script de backup de la base de données DiaspoMoney pour Windows" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\scripts\backup-db.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -Help                 Afficher cette aide" -ForegroundColor Gray
    Write-Host "  -Full                 Backup complet (toutes les collections)" -ForegroundColor Gray
    Write-Host "  -Collections          Backup des collections spécifiques (séparées par des virgules)" -ForegroundColor Gray
    Write-Host "  -Directory            Répertoire de destination (défaut: .\backups)" -ForegroundColor Gray
    Write-Host "  -KeepDays             Garder les backups pendant X jours (défaut: 30)" -ForegroundColor Gray
    Write-Host "  -Verbose              Mode verbeux" -ForegroundColor Gray
    Write-Host "  -DryRun               Simulation sans exécuter le backup" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Exemples:" -ForegroundColor White
    Write-Host "  .\scripts\backup-db.ps1                    # Backup complet par défaut" -ForegroundColor Gray
    Write-Host "  .\scripts\backup-db.ps1 -Full              # Backup complet explicite" -ForegroundColor Gray
    Write-Host "  .\scripts\backup-db.ps1 -Collections users,appointments # Backup des collections users et appointments" -ForegroundColor Gray
    Write-Host "  .\scripts\backup-db.ps1 -Directory C:\backups # Backup dans C:\backups" -ForegroundColor Gray
    Write-Host "  .\scripts\backup-db.ps1 -KeepDays 7        # Garder les backups pendant 7 jours" -ForegroundColor Gray
    Write-Host ""
}

# Vérifications préliminaires
function Check-Prerequisites {
    Write-Info "Vérification des prérequis..."
    
    # Vérifier si Docker est installé
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker n'est pas installé ou n'est pas dans le PATH"
        exit 1
    }
    
    # Vérifier si le conteneur MongoDB est en cours d'exécution
    $containerRunning = docker ps --format "table {{.Names}}" | Select-String -Pattern "^$ContainerName$" -Quiet
    if (-not $containerRunning) {
        Write-Error "Le conteneur MongoDB '$ContainerName' n'est pas en cours d'exécution"
        Write-Info "Démarrage du conteneur..."
        try {
            docker start $ContainerName | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Impossible de démarrer le conteneur MongoDB"
                exit 1
            }
            # Attendre que MongoDB soit prêt
            Write-Info "Attente que MongoDB soit prêt..."
            Start-Sleep -Seconds 10
        }
        catch {
            Write-Error "Erreur lors du démarrage du conteneur: $_"
            exit 1
        }
    }
    
    # Créer le répertoire de backup s'il n'existe pas
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    
    Write-Success "Prérequis vérifiés"
}

# Fonction de backup
function Perform-Backup {
    $backupFile = ""
    
    if ($Full -or (-not $Collections)) {
        Write-Info "Début du backup complet de la base de données '$DBName'..."
        $backupFile = Join-Path $BackupDir "${DBName}_full_${Date}.gz"
        
        if ($DryRun) {
            Write-Info "DRY RUN: Backup complet vers $backupFile"
            return
        }
        
        # Backup complet avec mongodump
        try {
            $result = docker exec $ContainerName mongodump --db $DBName --gzip --archive="/tmp/backup.gz" --quiet
            if ($LASTEXITCODE -eq 0) {
                # Copier le fichier de backup du conteneur
                docker cp "${ContainerName}:/tmp/backup.gz" $backupFile
                
                # Nettoyer le fichier temporaire dans le conteneur
                docker exec $ContainerName rm -f /tmp/backup.gz
                
                Write-Success "Backup complet réussi: $backupFile"
            }
            else {
                Write-Error "Échec du backup complet"
                exit 1
            }
        }
        catch {
            Write-Error "Erreur lors du backup complet: $_"
            exit 1
        }
    }
    else {
        if (-not $Collections) {
            Write-Error "Aucune collection spécifiée pour le backup partiel"
            exit 1
        }
        
        Write-Info "Début du backup des collections: $Collections"
        $backupFile = Join-Path $BackupDir "${DBName}_collections_${Date}.gz"
        
        if ($DryRun) {
            Write-Info "DRY RUN: Backup des collections vers $backupFile"
            return
        }
        
        # Backup des collections spécifiques
        $collectionsArray = $Collections -split ","
        $collectionArgs = ""
        
        foreach ($collection in $collectionsArray) {
            $collectionArgs += " --collection $collection"
        }
        
        try {
            $result = docker exec $ContainerName mongodump --db $DBName $collectionArgs --gzip --archive="/tmp/backup.gz" --quiet
            if ($LASTEXITCODE -eq 0) {
                # Copier le fichier de backup du conteneur
                docker cp "${ContainerName}:/tmp/backup.gz" $backupFile
                
                # Nettoyer le fichier temporaire dans le conteneur
                docker exec $ContainerName rm -f /tmp/backup.gz
                
                Write-Success "Backup des collections réussi: $backupFile"
            }
            else {
                Write-Error "Échec du backup des collections"
                exit 1
            }
        }
        catch {
            Write-Error "Erreur lors du backup des collections: $_"
            exit 1
        }
    }
    
    # Afficher la taille du fichier de backup
    if (Test-Path $backupFile) {
        $size = (Get-Item $backupFile).Length
        $sizeFormatted = [math]::Round($size / 1MB, 2)
        Write-Info "Taille du backup: $sizeFormatted MB"
    }
}

# Fonction de nettoyage des anciens backups
function Cleanup-OldBackups {
    Write-Info "Nettoyage des backups de plus de $KeepDays jours..."
    
    $deletedCount = 0
    $currentTime = Get-Date
    $cutoffTime = $currentTime.AddDays(-$KeepDays)
    
    $backupFiles = Get-ChildItem -Path $BackupDir -Filter "*.gz" -File
    foreach ($backupFile in $backupFiles) {
        if ($backupFile.LastWriteTime -lt $cutoffTime) {
            if ($DryRun) {
                Write-Info "DRY RUN: Suppression de $($backupFile.Name)"
            }
            else {
                Remove-Item $backupFile.FullName -Force
                Write-Info "Supprimé: $($backupFile.Name)"
            }
            $deletedCount++
        }
    }
    
    if ($deletedCount -gt 0) {
        Write-Success "$deletedCount ancien(s) backup(s) supprimé(s)"
    }
    else {
        Write-Info "Aucun ancien backup à supprimer"
    }
}

# Fonction de vérification de l'intégrité
function Verify-Backup {
    if ($DryRun) {
        return
    }
    
    Write-Info "Vérification de l'intégrité du backup..."
    
    # Trouver le fichier de backup le plus récent
    $latestBackup = Get-ChildItem -Path $BackupDir -Filter "*.gz" -File | Sort-Object LastWriteTime | Select-Object -Last 1
    
    if (-not $latestBackup) {
        Write-Warning "Aucun fichier de backup trouvé pour la vérification"
        return
    }
    
    Write-Info "Vérification de: $($latestBackup.Name)"
    
    # Vérifier que le fichier n'est pas corrompu (test basique de taille)
    if ($latestBackup.Length -gt 0) {
        Write-Success "Le fichier de backup semble valide (taille: $([math]::Round($latestBackup.Length / 1KB, 2)) KB)"
    }
    else {
        Write-Error "Le fichier de backup est vide ou corrompu: $($latestBackup.Name)"
        exit 1
    }
}

# Fonction principale
function Main {
    Write-Info "=== Script de Backup DiaspoMoney (Windows) ==="
    Write-Info "Date: $(Get-Date)"
    Write-Info "Répertoire de backup: $BackupDir"
    Write-Info "Mode: $(if ($Full -or (-not $Collections)) { "Complet" } else { "Partiel: $Collections" })"
    Write-Info "Conservation: $KeepDays jours"
    
    if ($DryRun) {
        Write-Warning "MODE DRY RUN - Aucune action ne sera effectuée"
    }
    
    Check-Prerequisites
    Perform-Backup
    Cleanup-OldBackups
    Verify-Backup
    
    Write-Success "=== Backup terminé avec succès ==="
    
    # Afficher un résumé
    $totalBackups = (Get-ChildItem -Path $BackupDir -Filter "*.gz" -File).Count
    $totalSize = (Get-ChildItem -Path $BackupDir -Filter "*.gz" -File | Measure-Object -Property Length -Sum).Sum
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    Write-Info "Total des backups: $totalBackups"
    Write-Info "Espace utilisé: $totalSizeMB MB"
}

# Gestion des paramètres
if ($Help) {
    Show-Help
    exit 0
}

# Exécution du script
Main
