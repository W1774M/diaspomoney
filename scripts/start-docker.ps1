# Script de démarrage Docker pour DiaspoMoney (Windows)
# Usage: .\scripts\start-docker.ps1

param(
    [switch]$Help,
    [switch]$SkipDockerDesktop
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir

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
    Write-Host "Script de démarrage Docker pour DiaspoMoney (Windows)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\scripts\start-docker.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -Help                 Afficher cette aide" -ForegroundColor Gray
    Write-Host "  -SkipDockerDesktop    Ignorer le démarrage de Docker Desktop" -ForegroundColor Gray
    Write-Host ""
}

# Vérifier si Docker est installé
function Test-Docker {
    Write-Info "Vérification de Docker..."
    
    try {
        $dockerVersion = docker --version 2>$null
        if ($dockerVersion) {
            Write-Success "Docker est installé: $dockerVersion"
            return $true
        }
    }
    catch {
        Write-Error "Docker n'est pas installé ou n'est pas dans le PATH"
        return $false
    }
    
    return $false
}

# Démarrer Docker Desktop
function Start-DockerDesktop {
    if ($SkipDockerDesktop) {
        Write-Warning "Démarrage de Docker Desktop ignoré"
        return $true
    }
    
    Write-Info "Démarrage de Docker Desktop..."
    
    # Vérifier si Docker Desktop est déjà en cours d'exécution
    $dockerProcess = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
    if ($dockerProcess) {
        Write-Info "Docker Desktop est déjà en cours d'exécution"
        return $true
    }
    
    # Essayer de démarrer Docker Desktop
    $dockerDesktopPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerDesktopPath) {
        try {
            Write-Info "Lancement de Docker Desktop..."
            Start-Process $dockerDesktopPath -WindowStyle Minimized
            Start-Sleep -Seconds 10
        }
        catch {
            Write-Warning "Impossible de démarrer Docker Desktop automatiquement"
            Write-Info "Veuillez le démarrer manuellement"
        }
    }
    else {
        Write-Warning "Docker Desktop.exe non trouvé à $dockerDesktopPath"
        Write-Info "Veuillez le démarrer manuellement"
    }
    
    # Attendre que Docker soit prêt
    Write-Info "Attente que Docker soit prêt..."
    $attempts = 0
    $maxAttempts = 30
    
    while ($attempts -lt $maxAttempts) {
        try {
            $null = docker info 2>$null
            Write-Success "Docker est prêt"
            return $true
        }
        catch {
            $attempts++
            Write-Info "Tentative $attempts/$maxAttempts..."
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Error "Docker n'est pas prêt après $maxAttempts tentatives"
    return $false
}

# Démarrer les conteneurs
function Start-Containers {
    Write-Info "Démarrage des conteneurs..."
    
    # Aller dans le répertoire docker
    Push-Location "$ProjectDir\docker"
    
    try {
        # Démarrer avec docker-compose
        $result = docker-compose up -d 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Conteneurs démarrés avec succès"
        }
        else {
            Write-Error "Échec du démarrage des conteneurs: $result"
            return $false
        }
        
        # Attendre que MongoDB soit prêt
        Write-Info "Attente que MongoDB soit prêt..."
        $attempts = 0
        $maxAttempts = 30
        
        while ($attempts -lt $maxAttempts) {
            try {
                $result = docker exec mongodb mongosh --quiet --eval "db.adminCommand('ping')" 2>$null
                if ($result -match "1") {
                    Write-Success "MongoDB est prêt"
                    return $true
                }
            }
            catch {
                # Ignorer les erreurs pendant l'attente
            }
            
            $attempts++
            Write-Info "Tentative $attempts/$maxAttempts..."
            Start-Sleep -Seconds 2
        }
        
        Write-Error "MongoDB n'est pas prêt après $maxAttempts tentatives"
        return $false
    }
    finally {
        Pop-Location
    }
}

# Vérifier le statut
function Test-Status {
    Write-Info "Vérification du statut..."
    
    Write-Host ""
    Write-Host "=== Statut des conteneurs ===" -ForegroundColor Cyan
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    Write-Host ""
    Write-Host "=== Test de connexion MongoDB ===" -ForegroundColor Cyan
    try {
        $result = docker exec mongodb mongosh --quiet --eval "db.adminCommand('ping')" 2>$null
        if ($result -match "1") {
            Write-Success "Connexion MongoDB OK"
            return $true
        }
        else {
            Write-Error "Connexion MongoDB échouée"
            return $false
        }
    }
    catch {
        Write-Error "Connexion MongoDB échouée: $_"
        return $false
    }
}

# Fonction principale
function Main {
    Write-Info "=== Démarrage Docker DiaspoMoney (Windows) ==="
    
    if (-not (Test-Docker)) {
        exit 1
    }
    
    if (-not (Start-DockerDesktop)) {
        Write-Warning "Continuer sans Docker Desktop..."
    }
    
    if (-not (Start-Containers)) {
        exit 1
    }
    
    if (-not (Test-Status)) {
        exit 1
    }
    
    Write-Success "=== Docker et conteneurs démarrés avec succès ==="
    Write-Info "Vous pouvez maintenant utiliser les scripts de backup et maintenance"
}

# Gestion des paramètres
if ($Help) {
    Show-Help
    exit 0
}

# Exécution du script
Main
