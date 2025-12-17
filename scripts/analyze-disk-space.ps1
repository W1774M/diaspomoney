<#
.SYNOPSIS
    Analyse l'espace disque sur Windows et identifie les dossiers les plus volumineux.

.DESCRIPTION
    Ce script analyse l'espace disque disponible sur Windows, affiche l'utilisation par lecteur
    et identifie les dossiers qui prennent le plus de place.

.PARAMETER Drive
    Lettre du lecteur à analyser (ex: C:, D:). Si non spécifié, tous les lecteurs sont analysés.

.PARAMETER Path
    Chemin spécifique à analyser (ex: C:\Users). Prioritaire sur -Drive.

.PARAMETER Top
    Nombre de dossiers les plus volumineux à afficher (défaut: 20).

.PARAMETER Export
    Format d'export des résultats: CSV, JSON, ou Both (défaut: aucun export).

.PARAMETER OutputPath
    Chemin de sortie pour les fichiers d'export. Si non spécifié, utilise le répertoire courant.

.EXAMPLE
    .\analyze-disk-space.ps1
    Analyse tous les lecteurs et affiche les 20 dossiers les plus volumineux.

.EXAMPLE
    .\analyze-disk-space.ps1 -Drive C: -Top 30
    Analyse uniquement le lecteur C: et affiche les 30 dossiers les plus volumineux.

.EXAMPLE
    .\analyze-disk-space.ps1 -Path "C:\Users" -Export CSV -OutputPath "C:\temp\report.csv"
    Analyse le dossier C:\Users et exporte les résultats en CSV.

.NOTES
    Compatible PowerShell 5.1 et PowerShell Core 7+
    Nécessite des droits d'administration pour analyser certains dossiers système.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$Drive,
    
    [Parameter(Mandatory = $false)]
    [string]$Path,
    
    [Parameter(Mandatory = $false)]
    [int]$Top = 20,
    
    [Parameter(Mandatory = $false)]
    [ValidateSet('CSV', 'JSON', 'Both')]
    [string]$Export,
    
    [Parameter(Mandatory = $false)]
    [string]$OutputPath
)

# Fonction pour formater la taille en format lisible
function Format-FileSize {
    param([long]$Size)
    
    if ($Size -ge 1TB) {
        return "{0:N2} To" -f ($Size / 1TB)
    }
    elseif ($Size -ge 1GB) {
        return "{0:N2} Go" -f ($Size / 1GB)
    }
    elseif ($Size -ge 1MB) {
        return "{0:N2} Mo" -f ($Size / 1MB)
    }
    elseif ($Size -ge 1KB) {
        return "{0:N2} Ko" -f ($Size / 1KB)
    }
    else {
        return "$Size octets"
    }
}

# Fonction pour analyser l'espace des lecteurs
function Get-DiskSpace {
    param([string]$DriveLetter)
    
    $drives = @()
    
    if ($DriveLetter) {
        $drives = Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Name -eq $DriveLetter.TrimEnd(':') }
    }
    else {
        $drives = Get-PSDrive -PSProvider FileSystem
    }
    
    $results = @()
    
    foreach ($drive in $drives) {
        try {
            $driveInfo = [System.IO.DriveInfo]::new($drive.Root)
            
            if ($driveInfo.IsReady) {
                $totalSize = $driveInfo.TotalSize
                $freeSpace = $driveInfo.AvailableFreeSpace
                $usedSpace = $totalSize - $freeSpace
                $percentUsed = [math]::Round(($usedSpace / $totalSize) * 100, 2)
                
                $result = [PSCustomObject]@{
                    Lecteur = $drive.Name + ":"
                    Total = $totalSize
                    TotalFormatted = Format-FileSize -Size $totalSize
                    Utilise = $usedSpace
                    UtiliseFormatted = Format-FileSize -Size $usedSpace
                    Disponible = $freeSpace
                    DisponibleFormatted = Format-FileSize -Size $freeSpace
                    PourcentageUtilise = $percentUsed
                }
                
                $results += $result
            }
        }
        catch {
            Write-Warning "Impossible d'analyser le lecteur $($drive.Name): $_"
        }
    }
    
    return $results
}

# Fonction pour obtenir la taille d'un dossier
function Get-FolderSize {
    param(
        [string]$FolderPath,
        [ref]$ErrorCount
    )
    
    $size = 0
    
    if (-not (Test-Path $FolderPath)) {
        return 0
    }
    
    try {
        $items = Get-ChildItem -Path $FolderPath -ErrorAction SilentlyContinue -Force
        
        foreach ($item in $items) {
            try {
                if ($item.PSIsContainer) {
                    $size += (Get-FolderSize -FolderPath $item.FullName -ErrorCount $ErrorCount)
                }
                else {
                    $size += $item.Length
                }
            }
            catch {
                $ErrorCount.Value++
            }
        }
    }
    catch {
        $ErrorCount.Value++
    }
    
    return $size
}

# Fonction pour identifier les dossiers volumineux
function Get-LargeFolders {
    param(
        [string]$RootPath,
        [int]$TopCount
    )
    
    Write-Host "`nAnalyse des dossiers dans: $RootPath" -ForegroundColor Cyan
    Write-Host "Cela peut prendre quelques minutes..." -ForegroundColor Yellow
    
    $folders = @()
    $errorCount = 0
    $processedCount = 0
    
    try {
        $rootItems = Get-ChildItem -Path $RootPath -Directory -ErrorAction SilentlyContinue -Force
        
        $totalItems = ($rootItems | Measure-Object).Count
        Write-Host "`nAnalyse de $totalItems dossiers..." -ForegroundColor Cyan
        
        foreach ($item in $rootItems) {
            $processedCount++
            $percentComplete = [math]::Round(($processedCount / $totalItems) * 100, 1)
            
            Write-Progress -Activity "Analyse des dossiers" `
                -Status "Traitement: $($item.Name) ($processedCount/$totalItems)" `
                -PercentComplete $percentComplete
            
            try {
                $folderErrorCount = 0
                $size = Get-FolderSize -FolderPath $item.FullName -ErrorCount ([ref]$folderErrorCount)
                
                if ($size -gt 0) {
                    $folders += [PSCustomObject]@{
                        Chemin = $item.FullName
                        Nom = $item.Name
                        Taille = $size
                        TailleFormatted = Format-FileSize -Size $size
                        Erreurs = $folderErrorCount
                    }
                }
                
                $errorCount += $folderErrorCount
            }
            catch {
                $errorCount++
                Write-Debug "Erreur lors de l'analyse de $($item.FullName): $_"
            }
        }
        
        Write-Progress -Activity "Analyse des dossiers" -Completed
        
        if ($errorCount -gt 0) {
            Write-Warning "`n$errorCount erreurs rencontrées lors de l'analyse (dossiers inaccessibles ou permissions insuffisantes)"
        }
        
        # Trier par taille décroissante et retourner le top N
        return $folders | Sort-Object -Property Taille -Descending | Select-Object -First $TopCount
    }
    catch {
        Write-Error "Erreur lors de l'analyse du chemin $RootPath : $_"
        return @()
    }
}

# Fonction pour exporter les résultats
function Export-Results {
    param(
        [object]$DiskSpaceResults,
        [object]$FolderResults,
        [string]$Format,
        [string]$OutputFilePath
    )
    
    if (-not $OutputFilePath) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $OutputFilePath = ".\disk-analysis_$timestamp"
    }
    
    # Supprimer l'extension si elle existe (on va l'ajouter selon le format)
    $basePath = [System.IO.Path]::GetDirectoryName($OutputFilePath)
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($OutputFilePath)
    
    if (-not $basePath) {
        $basePath = "."
    }
    
    if ($Format -eq 'CSV' -or $Format -eq 'Both') {
        $csvPath = Join-Path $basePath "$baseName.csv"
        
        # Exporter les résultats des lecteurs
        if ($DiskSpaceResults) {
            $DiskSpaceResults | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8
            Write-Host "`nRésultats des lecteurs exportés vers: $csvPath" -ForegroundColor Green
        }
        
        # Exporter les résultats des dossiers dans un fichier séparé
        if ($FolderResults) {
            $csvFoldersPath = Join-Path $basePath "${baseName}_folders.csv"
            $FolderResults | Export-Csv -Path $csvFoldersPath -NoTypeInformation -Encoding UTF8
            Write-Host "Résultats des dossiers exportés vers: $csvFoldersPath" -ForegroundColor Green
        }
    }
    
    if ($Format -eq 'JSON' -or $Format -eq 'Both') {
        $jsonPath = Join-Path $basePath "$baseName.json"
        
        $exportData = @{
            DateAnalyse = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
            Lecteurs = $DiskSpaceResults
            DossiersVolumineux = $FolderResults
        }
        
        $exportData | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonPath -Encoding UTF8
        Write-Host "Résultats complets exportés vers: $jsonPath" -ForegroundColor Green
    }
}

# Fonction principale d'affichage
function Show-DiskAnalysis {
    param(
        [object]$DiskSpaceResults,
        [object]$FolderResults
    )
    
    Write-Host "`n" -NoNewline
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host " ANALYSE DE L'ESPACE DISQUE" -ForegroundColor Cyan
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host ""
    
    # Afficher les résultats des lecteurs
    if ($DiskSpaceResults) {
        Write-Host "ESPACE PAR LECTEUR" -ForegroundColor Yellow
        Write-Host "-" * 80 -ForegroundColor Gray
        
        
        foreach ($drive in $DiskSpaceResults) {
            $color = if ($drive.PourcentageUtilise -ge 90) { "Red" }
                     elseif ($drive.PourcentageUtilise -ge 75) { "Yellow" }
                     else { "Green" }
            
            Write-Host "`nLecteur: $($drive.Lecteur)" -ForegroundColor White
            Write-Host "  Total      : $($drive.TotalFormatted)" -ForegroundColor Gray
            Write-Host "  Utilisé    : $($drive.UtiliseFormatted) ($($drive.PourcentageUtilise)%)" -ForegroundColor $color
            Write-Host "  Disponible : $($drive.DisponibleFormatted)" -ForegroundColor Gray
        }
    }
    
    # Afficher les dossiers volumineux
    if ($FolderResults) {
        Write-Host "`n" -NoNewline
        Write-Host "TOP $($FolderResults.Count) DOSSIERS LES PLUS VOLUMINEUX" -ForegroundColor Yellow
        Write-Host "-" * 80 -ForegroundColor Gray
        Write-Host ""
        
        $index = 1
        foreach ($folder in $FolderResults) {
            Write-Host "$index. " -NoNewline -ForegroundColor Cyan
            Write-Host "$($folder.TailleFormatted)" -NoNewline -ForegroundColor White
            Write-Host " - $($folder.Chemin)" -ForegroundColor Gray
            
            if ($folder.Erreurs -gt 0) {
                Write-Host "   (Attention: $($folder.Erreurs) erreurs lors de l'analyse)" -ForegroundColor DarkYellow
            }
            
            $index++
        }
    }
    
    Write-Host "`n" -NoNewline
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host ""
}

# ============================================
# SCRIPT PRINCIPAL
# ============================================

try {
    $diskResults = @()
    $folderResults = @()
    
    # Déterminer le chemin à analyser
    $analysisPath = $null
    
    if ($Path) {
        $analysisPath = $Path
        Write-Host "Analyse du chemin spécifique: $analysisPath" -ForegroundColor Cyan
    }
    elseif ($Drive) {
        $analysisPath = $Drive.TrimEnd(':') + ":\"
        Write-Host "Analyse du lecteur: $Drive" -ForegroundColor Cyan
    }
    else {
        $analysisPath = "C:\"
        Write-Host "Analyse de tous les lecteurs (dossiers sur C:\)" -ForegroundColor Cyan
    }
    
    # Analyser l'espace des lecteurs
    Write-Host "`nAnalyse de l'espace disque..." -ForegroundColor Cyan
    $diskResults = Get-DiskSpace -DriveLetter $Drive
    
    # Analyser les dossiers volumineux
    if ($Path) {
        # Analyser le chemin spécifique
        $folderResults = Get-LargeFolders -RootPath $Path -TopCount $Top
    }
    elseif ($Drive) {
        # Analyser les dossiers principaux du lecteur spécifié
        $driveRoot = $Drive.TrimEnd(':') + ":\"
        $commonPaths = @(
            "$driveRoot\Users",
            "$driveRoot\Program Files",
            "$driveRoot\Program Files (x86)",
            "$driveRoot\Windows",
            "$driveRoot\ProgramData"
        )
        
        $allFolders = @()
        foreach ($commonPath in $commonPaths) {
            if (Test-Path $commonPath) {
                Write-Host "`nAnalyse de: $commonPath" -ForegroundColor Cyan
                $folders = Get-LargeFolders -RootPath $commonPath -TopCount $Top
                $allFolders += $folders
            }
        }
        
        $folderResults = $allFolders | Sort-Object -Property Taille -Descending | Select-Object -First $Top
    }
    else {
        # Analyser les dossiers principaux de C:\
        $commonPaths = @(
            "C:\Users",
            "C:\Program Files",
            "C:\Program Files (x86)",
            "C:\Windows",
            "C:\ProgramData"
        )
        
        $allFolders = @()
        foreach ($commonPath in $commonPaths) {
            if (Test-Path $commonPath) {
                Write-Host "`nAnalyse de: $commonPath" -ForegroundColor Cyan
                $folders = Get-LargeFolders -RootPath $commonPath -TopCount $Top
                $allFolders += $folders
            }
        }
        
        $folderResults = $allFolders | Sort-Object -Property Taille -Descending | Select-Object -First $Top
    }
    
    # Afficher les résultats
    Show-DiskAnalysis -DiskSpaceResults $diskResults -FolderResults $folderResults
    
    # Exporter si demandé
    if ($Export) {
        Export-Results -DiskSpaceResults $diskResults -FolderResults $folderResults -Format $Export -OutputFilePath $OutputPath
    }
}
catch {
    Write-Error "Erreur fatale: $_"
    exit 1
}

