# Commandes PowerShell pour DiaspoMoney

## 🚀 Commandes de développement

### Lancer l'application avec logs filtrés

Pour filtrer les logs en temps réel pendant le développement :

```powershell
# Filtrer les logs (info, warning, error, api)
$env:LOG_FILE='true'; pnpm dev | Select-String -Pattern "(info|warning|error|api)"

# Filtrer uniquement les erreurs et warnings
$env:LOG_FILE='true'; pnpm dev | Select-String -Pattern "(error|warning|fatal)"

# Filtrer avec plusieurs patterns
$env:LOG_FILE='true'; pnpm dev | Select-String -Pattern "(error|warning|api|stripe)"
```

### Utiliser les scripts npm (Recommandé)

```powershell
# Activer les logs dans un fichier
$env:LOG_FILE='true'; pnpm dev

# Dans un autre terminal, surveiller les logs
pnpm logs:watch:win

# Surveiller uniquement les erreurs
pnpm logs:errors:win

# Utiliser les commandes npm filtrées
pnpm dev:filtered
pnpm dev:filtered:errors
```

## 📋 Commandes PowerShell utiles

### Filtrer les logs d'un fichier

```powershell
# Filtrer les erreurs dans le fichier de log
Get-Content logs\app.log | Select-String -Pattern "error"

# Filtrer avec plusieurs patterns
Get-Content logs\app.log | Select-String -Pattern "(error|warning|api)"

# Suivre un fichier et filtrer en temps réel
Get-Content logs\app.log -Wait | Select-String -Pattern "error"

# Filtrer avec couleur (erreurs en rouge)
Get-Content logs\app.log -Wait | Select-String -Pattern "error" | ForEach-Object {
    Write-Host $_ -ForegroundColor Red
}
```

### Afficher les dernières lignes

```powershell
# Dernières 50 lignes
Get-Content logs\app.log -Tail 50

# Dernières 100 lignes filtrées
Get-Content logs\app.log -Tail 100 | Select-String -Pattern "error"
```

### Alternative avec findstr (plus rapide)

```powershell
# Filtrer avec findstr (plus rapide que Select-String)
$env:LOG_FILE='true'; pnpm dev | findstr /R "info warning error api"

# Filtrer les erreurs uniquement
$env:LOG_FILE='true'; pnpm dev | findstr /R "error warning fatal"
```

## 🔍 Patterns de recherche courants

```powershell
# Rechercher les logs Stripe
Select-String -Pattern "stripe" -Path logs\app.log

# Rechercher les logs d'API
Select-String -Pattern "api|API" -Path logs\app.log

# Rechercher les erreurs de paiement
Select-String -Pattern "payment|Payment|paiement" -Path logs\app.log

# Rechercher avec regex
Select-String -Pattern "level.*(40|50)" -Path logs\app.log
```

## ⚠️ Notes importantes

1. **Select-String vs findstr** :
   - `Select-String` : Plus puissant, supporte les regex
   - `findstr` : Plus rapide, syntaxe simple

2. **Patterns** :
   - Utilisez des parenthèses pour grouper : `(error|warning)`
   - Échappez les caractères spéciaux si nécessaire
   - Les patterns sont case-insensitive par défaut

3. **Performance** :
   - Pour de gros fichiers, utilisez `findstr` ou filtrez d'abord avec `-Tail`
   - Évitez les patterns trop complexes en temps réel

## 📚 Références

- [Select-String Documentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/select-string)
- [findstr Documentation](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/findstr)

