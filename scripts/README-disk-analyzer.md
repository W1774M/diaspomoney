# Script d'analyse de l'espace disque Windows

## Description

Ce script PowerShell (`analyze-disk-space.ps1`) permet d'analyser l'espace disque sur Windows et d'identifier les dossiers qui prennent le plus de place.

## Prérequis

- Windows avec PowerShell 5.1 ou PowerShell Core 7+
- Droits d'administration recommandés pour analyser certains dossiers système

## Utilisation

### Analyse de base

Analyser tous les lecteurs et afficher les 20 dossiers les plus volumineux :

```powershell
.\scripts\analyze-disk-space.ps1
```

### Analyser un lecteur spécifique

```powershell
.\scripts\analyze-disk-space.ps1 -Drive C:
```

### Analyser un dossier spécifique

```powershell
.\scripts\analyze-disk-space.ps1 -Path "C:\Users"
```

### Personnaliser le nombre de résultats

Afficher les 30 dossiers les plus volumineux :

```powershell
.\scripts\analyze-disk-space.ps1 -Top 30
```

### Exporter les résultats

Exporter en CSV :

```powershell
.\scripts\analyze-disk-space.ps1 -Export CSV -OutputPath "C:\temp\disk-report.csv"
```

Exporter en JSON :

```powershell
.\scripts\analyze-disk-space.ps1 -Export JSON -OutputPath "C:\temp\disk-report.json"
```

Exporter dans les deux formats :

```powershell
.\scripts\analyze-disk-space.ps1 -Export Both -OutputPath "C:\temp\disk-report"
```

### Exemples combinés

```powershell
# Analyser C:\Users avec export CSV et afficher les 50 plus gros dossiers
.\scripts\analyze-disk-space.ps1 -Path "C:\Users" -Top 50 -Export CSV -OutputPath "C:\temp\users-analysis.csv"

# Analyser le lecteur D: avec export JSON
.\scripts\analyze-disk-space.ps1 -Drive D: -Export JSON
```

## Paramètres

| Paramètre | Type | Description | Valeur par défaut |
|-----------|------|-------------|-------------------|
| `-Drive` | string | Lettre du lecteur à analyser (ex: C:, D:) | Tous les lecteurs |
| `-Path` | string | Chemin spécifique à analyser | Dossiers principaux de C:\ |
| `-Top` | int | Nombre de dossiers à afficher | 20 |
| `-Export` | string | Format d'export: CSV, JSON, ou Both | Aucun |
| `-OutputPath` | string | Chemin de sortie pour les exports | Répertoire courant avec timestamp |

## Fonctionnalités

### Analyse des lecteurs

Le script affiche pour chaque lecteur :
- Espace total
- Espace utilisé (avec pourcentage)
- Espace disponible
- Code couleur selon le niveau d'utilisation :
  - 🟢 Vert : < 75%
  - 🟡 Jaune : 75-90%
  - 🔴 Rouge : > 90%

### Analyse des dossiers

Le script analyse automatiquement les dossiers principaux :
- `C:\Users`
- `C:\Program Files`
- `C:\Program Files (x86)`
- `C:\Windows`
- `C:\ProgramData`

Pour chaque dossier, il affiche :
- La taille en format lisible (To, Go, Mo, Ko)
- Le chemin complet
- Le nombre d'erreurs rencontrées (si applicable)

### Gestion des erreurs

Le script gère automatiquement :
- Les dossiers inaccessibles (permissions insuffisantes)
- Les fichiers verrouillés
- Les chemins invalides

Les erreurs sont comptabilisées et affichées sans interrompre l'analyse.

### Barre de progression

Une barre de progression s'affiche pendant l'analyse des dossiers pour indiquer l'avancement.

## Format de sortie

### Console

Les résultats sont affichés dans la console avec :
- Code couleur pour la lisibilité
- Formatage des tailles en unités lisibles
- Organisation claire par sections

### Export CSV

Deux fichiers CSV sont créés :
- `[nom]_folders.csv` : Liste des dossiers volumineux
- `[nom].csv` : Informations sur les lecteurs

### Export JSON

Un fichier JSON unique contenant :
- Date de l'analyse
- Informations sur tous les lecteurs
- Liste des dossiers volumineux

## Notes importantes

1. **Temps d'exécution** : L'analyse peut prendre plusieurs minutes selon la taille du disque et le nombre de fichiers.

2. **Permissions** : Certains dossiers système nécessitent des droits d'administration. Le script continuera l'analyse même si certains dossiers sont inaccessibles.

3. **Performance** : Pour de très gros volumes, l'analyse peut être longue. Le script affiche une barre de progression pour suivre l'avancement.

4. **Compatibilité** : Le script est compatible avec PowerShell 5.1 (Windows) et PowerShell Core 7+ (cross-platform).

## Dépannage

### Erreur "Script non signé"

Si vous obtenez une erreur de politique d'exécution :

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erreurs de permissions

Le script affichera un avertissement si certains dossiers sont inaccessibles. Pour analyser tous les dossiers, exécutez PowerShell en tant qu'administrateur.

### Script lent

L'analyse récursive de très gros dossiers peut être longue. Utilisez le paramètre `-Path` pour analyser des dossiers spécifiques plutôt que tout le disque.

