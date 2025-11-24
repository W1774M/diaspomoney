# Guide de suivi des logs - DiaspoMoney

## 📋 Vue d'ensemble

L'application utilise **Pino** pour la gestion des logs. Les logs peuvent être affichés dans la console ET écrits dans un fichier pour un suivi en temps réel.

## 🚀 Activation de l'écriture des logs dans un fichier

### Option 1 : Variable d'environnement (Recommandé)

Définissez `LOG_FILE=true` dans votre `.env` ou avant de lancer l'application :

**Windows PowerShell :**
```powershell
$env:LOG_FILE='true'; pnpm dev
```

**Linux/Mac :**
```bash
LOG_FILE=true pnpm dev
```

### Option 2 : Fichier de log personnalisé

Vous pouvez spécifier un chemin personnalisé :

```bash
LOG_FILE_PATH=./logs/my-app.log pnpm dev
```

### Option 3 : Production

En production, les logs sont automatiquement écrits dans `logs/app.log`.

## 📊 Suivre les logs en temps réel

### Windows (PowerShell)

```powershell
# Méthode 1 : Script npm (Recommandé)
pnpm logs:watch

# Méthode 2 : Script PowerShell directement
.\scripts\watch-logs.ps1

# Méthode 3 : Fichier personnalisé
.\scripts\watch-logs.ps1 logs\custom.log
```

### Linux/Mac

```bash
# Méthode 1 : Script npm
pnpm logs:watch:unix

# Méthode 2 : Script bash directement
./scripts/watch-logs.sh

# Méthode 3 : Fichier personnalisé
./scripts/watch-logs.sh logs/custom.log
```

### Alternative : Commandes natives

**Windows PowerShell :**
```powershell
Get-Content -Path logs\app.log -Wait -Tail 50
```

**Linux/Mac :**
```bash
tail -f logs/app.log
```

## 📁 Structure des logs

Les logs sont écrits dans le dossier `logs/` :

```
logs/
├── app.log              # Logs principaux de l'application
└── db-maintenance.log   # Logs de maintenance de la base de données
```

## ⚙️ Configuration des logs

### Niveaux de log

Les niveaux de log sont définis dans `lib/constants/index.ts` :

- `DEBUG` : Informations détaillées (développement)
- `INFO` : Informations générales
- `WARN` : Avertissements
- `ERROR` : Erreurs
- `FATAL` : Erreurs critiques

### Variables d'environnement

```env
# Activer l'écriture dans un fichier
LOG_FILE=true

# Chemin personnalisé du fichier de log
LOG_FILE_PATH=./logs/my-app.log

# Niveau de log (debug, info, warn, error, fatal)
LOG_LEVEL=debug
```

### Format des logs

En développement, les logs sont formatés de manière lisible dans la console.

En production ou avec `LOG_FILE=true`, les logs sont écrits au format JSON pour faciliter l'analyse.

## 🔍 Exemples d'utilisation

### Développement avec suivi des logs

**Terminal 1 :** Lancer l'application
```powershell
$env:LOG_FILE='true'; pnpm dev
```

**Terminal 2 :** Suivre les logs
```powershell
pnpm logs:watch
```

### Filtrer les logs

**Windows PowerShell :**
```powershell
Get-Content logs\app.log -Wait | Select-String "error"
```

**Linux/Mac :**
```bash
tail -f logs/app.log | grep "error"
```

### Voir les dernières lignes

**Windows PowerShell :**
```powershell
Get-Content logs\app.log -Tail 100
```

**Linux/Mac :**
```bash
tail -n 100 logs/app.log
```

## 🛠️ Dépannage

### Le fichier de log n'existe pas

1. Vérifiez que `LOG_FILE=true` est défini
2. Vérifiez que l'application a démarré
3. Vérifiez les permissions d'écriture dans le dossier `logs/`

### Les logs ne s'affichent pas en temps réel

1. Vérifiez que le fichier existe
2. Vérifiez que l'application écrit bien dans le fichier
3. Essayez de redémarrer le script de suivi

### Logs trop volumineux

Les logs peuvent être nettoyés manuellement ou via un script de rotation :

```bash
# Vider le fichier de log
> logs/app.log

# Ou créer une rotation
mv logs/app.log logs/app.log.old
```

## 📝 Notes importantes

- Les logs contiennent des informations sensibles (mots de passe, tokens) qui sont automatiquement masqués
- En production, les logs sont automatiquement écrits dans un fichier
- Le dossier `logs/` est exclu du watch Next.js pour éviter les boucles infinies
- Les logs sont écrits en mode append, donc ils ne sont pas écrasés au redémarrage

