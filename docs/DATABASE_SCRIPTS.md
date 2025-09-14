# Scripts de Base de Données DiaspoMoney

Ce document décrit l'utilisation des scripts de gestion de la base de données MongoDB pour le projet DiaspoMoney.

## 📋 Table des Matières

- [Prérequis](#prérequis)
- [Scripts Disponibles](#scripts-disponibles)
- [Utilisation](#utilisation)
- [Exemples](#exemples)
- [Maintenance](#maintenance)
- [Dépannage](#dépannage)

## 🔧 Prérequis

### Système
- **Linux/macOS** : Bash shell
- **Windows** : PowerShell 5.0+ ou Git Bash
- **Docker** : Version 20.10+ installée et en cours d'exécution

### Conteneur MongoDB
Le conteneur MongoDB doit être en cours d'exécution :
```bash
# Vérifier le statut
docker ps | grep mongodb

# Démarrer si nécessaire
docker start mongodb
```

## 📁 Scripts Disponibles

### 1. Backup de Base de Données

#### `backup-db.sh` (Linux/macOS)
Script principal de sauvegarde avec compression gzip.

#### `backup-db.ps1` (Windows)
Version PowerShell pour Windows.

#### `restore-db.sh` (Linux/macOS)
Script de restauration des sauvegardes.

#### `db-maintenance.sh` (Linux/macOS)
Script de maintenance et monitoring.

## 🚀 Utilisation

### Script de Backup

#### Usage de base
```bash
# Backup complet
./scripts/backup-db.sh

# Backup avec options
./scripts/backup-db.sh -f -d /custom/backup/path -k 7
```

#### Options disponibles
| Option | Description | Défaut |
|--------|-------------|---------|
| `-h, --help` | Afficher l'aide | - |
| `-f, --full` | Backup complet | ✓ |
| `-c, --collections` | Collections spécifiques | - |
| `-d, --directory` | Répertoire de destination | `./backups` |
| `-k, --keep-days` | Conservation en jours | 30 |
| `-v, --verbose` | Mode verbeux | - |
| `--dry-run` | Simulation | - |

#### Exemples d'utilisation
```bash
# Backup complet par défaut
./scripts/backup-db.sh

# Backup des collections users et appointments
./scripts/backup-db.sh -c users,appointments

# Backup dans un répertoire personnalisé
./scripts/backup-db.sh -d /mnt/backups

# Garder les backups pendant 7 jours
./scripts/backup-db.sh -k 7

# Simulation sans exécution
./scripts/backup-db.sh --dry-run
```

### Script de Restauration

#### Usage de base
```bash
# Restauration complète
./scripts/restore-db.sh backup.gz

# Restauration avec options
./scripts/restore-db.sh -d test_db --drop backup.gz
```

#### Options disponibles
| Option | Description | Défaut |
|--------|-------------|---------|
| `-h, --help` | Afficher l'aide | - |
| `-d, --database` | Base de données cible | `diaspomoney` |
| `-c, --collections` | Collections spécifiques | - |
| `-f, --force` | Forcer sans confirmation | - |
| `--drop` | Supprimer la base existante | - |
| `--dry-run` | Simulation | - |

#### Exemples d'utilisation
```bash
# Restauration complète
./scripts/restore-db.sh diaspomoney_full_20241201_143022.gz

# Restauration dans une base de test
./scripts/restore-db.sh -d test_db backup.gz

# Restauration partielle
./scripts/restore-db.sh -c users,appointments backup.gz

# Restauration avec remplacement
./scripts/restore-db.sh --drop backup.gz

# Simulation de restauration
./scripts/restore-db.sh --dry-run backup.gz
```

### Script de Maintenance

#### Usage de base
```bash
# Statut de la base
./scripts/db-maintenance.sh -s

# Monitoring en temps réel
./scripts/db-maintenance.sh -m

# Optimisation
./scripts/db-maintenance.sh -o
```

#### Options disponibles
| Option | Description |
|--------|-------------|
| `-h, --help` | Afficher l'aide |
| `-s, --status` | Statut de la base |
| `-m, --monitor` | Monitoring temps réel |
| `-o, --optimize` | Optimisation |
| `-c, --cleanup` | Nettoyage |
| `-r, --repair` | Réparation |
| `-i, --info` | Informations détaillées |
| `--health-check` | Vérification de santé |
| `--performance` | Analyse des performances |

## 📊 Exemples

### Backup Automatisé
```bash
#!/bin/bash
# Script de backup quotidien

BACKUP_DIR="/mnt/backups/diaspomoney"
DATE=$(date +%Y%m%d)

# Créer le répertoire de backup
mkdir -p "$BACKUP_DIR"

# Exécuter le backup
./scripts/backup-db.sh -d "$BACKUP_DIR" -k 30

# Nettoyer les anciens backups
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

# Envoyer une notification
echo "Backup quotidien terminé: $(date)" | mail -s "Backup DiaspoMoney" admin@example.com
```

### Restauration de Test
```bash
#!/bin/bash
# Script de restauration pour tests

BACKUP_FILE="diaspomoney_full_20241201_143022.gz"
TEST_DB="diaspomoney_test"

# Restaurer dans une base de test
./scripts/restore-db.sh -d "$TEST_DB" --drop "$BACKUP_FILE"

# Vérifier la restauration
./scripts/db-maintenance.sh -s

echo "Restauration de test terminée"
```

### Monitoring Continu
```bash
#!/bin/bash
# Script de monitoring avec alertes

LOG_FILE="/var/log/diaspomoney-monitoring.log"

# Vérification de santé
./scripts/db-maintenance.sh --health-check > "$LOG_FILE" 2>&1

# Vérifier le score de santé
HEALTH_SCORE=$(grep "Score de santé:" "$LOG_FILE" | awk '{print $4}' | cut -d'/' -f1)
TOTAL_CHECKS=$(grep "Score de santé:" "$LOG_FILE" | awk '{print $4}' | cut -d'/' -f2)

if [ "$HEALTH_SCORE" -lt "$TOTAL_CHECKS" ]; then
    echo "ALERTE: Problème de santé détecté" | mail -s "Alerte DiaspoMoney" admin@example.com
fi
```

## 🛠️ Maintenance

### Tâches Régulières

#### Quotidiennes
- [ ] Vérifier l'espace disque
- [ ] Surveiller les performances
- [ ] Vérifier les logs d'erreur

#### Hebdomadaires
- [ ] Backup complet
- [ ] Nettoyage des données obsolètes
- [ ] Analyse des performances

#### Mensuelles
- [ ] Optimisation de la base
- [ ] Vérification de santé complète
- [ ] Mise à jour des statistiques

### Nettoyage Automatique
```bash
# Ajouter au crontab
0 2 * * 0 /path/to/diaspomoney/scripts/backup-db.sh -k 30
0 3 * * 0 /path/to/diaspomoney/scripts/db-maintenance.sh -c
0 4 * * 0 /path/to/diaspomoney/scripts/db-maintenance.sh -o
```

## 🔍 Dépannage

### Problèmes Courants

#### Erreur de Connexion
```bash
# Vérifier le conteneur
docker ps | grep mongodb

# Vérifier les logs
docker logs mongodb

# Redémarrer le conteneur
docker restart mongodb
```

#### Erreur de Permission
```bash
# Rendre les scripts exécutables
chmod +x scripts/*.sh

# Vérifier les permissions
ls -la scripts/
```

#### Erreur d'Espace Disque
```bash
# Vérifier l'espace
df -h

# Nettoyer les anciens backups
./scripts/backup-db.sh -k 7

# Optimiser la base
./scripts/db-maintenance.sh -o
```

### Logs et Debugging

#### Activer le mode verbeux
```bash
./scripts/backup-db.sh -v
./scripts/db-maintenance.sh -v
```

#### Vérifier les logs
```bash
# Logs de maintenance
tail -f logs/db-maintenance.log

# Logs Docker
docker logs mongodb
```

#### Mode dry-run
```bash
# Simulation de backup
./scripts/backup-db.sh --dry-run

# Simulation de restauration
./scripts/restore-db.sh --dry-run backup.gz
```

## 📈 Monitoring et Alertes

### Métriques à Surveiller

- **Espace disque** : < 80%
- **Performance des requêtes** : < 100ms
- **Connexions actives** : < 80% de la limite
- **Taille des collections** : Croissance normale
- **Index** : Utilisation optimale

### Alertes Recommandées

```bash
# Script d'alerte
#!/bin/bash

THRESHOLD=80
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$DISK_USAGE" -gt "$THRESHOLD" ]; then
    echo "ALERTE: Espace disque critique ($DISK_USAGE%)" | \
    mail -s "Alerte Espace Disque" admin@example.com
fi
```

## 🔐 Sécurité

### Bonnes Pratiques

1. **Permissions** : Limiter l'accès aux scripts
2. **Authentification** : Utiliser des comptes dédiés
3. **Chiffrement** : Chiffrer les backups sensibles
4. **Audit** : Logger toutes les opérations
5. **Rotation** : Rotation des clés et certificats

### Configuration Sécurisée
```bash
# Créer un utilisateur dédié
sudo useradd -r -s /bin/false diaspomoney-db

# Changer les permissions
sudo chown diaspomoney-db:diaspomoney-db scripts/
sudo chmod 750 scripts/

# Configurer sudo pour les opérations critiques
# /etc/sudoers.d/diaspomoney-db
diaspomoney-db ALL=(ALL) NOPASSWD: /usr/bin/docker exec mongodb *
```

## 📚 Ressources

### Documentation MongoDB
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [MongoDB Tools](https://docs.mongodb.com/database-tools/)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/core/security-best-practices/)

### Outils Utiles
- **MongoDB Compass** : Interface graphique
- **MongoDB Charts** : Visualisation des données
- **MongoDB Atlas** : Service cloud managé

### Support
- **GitHub Issues** : Problèmes et suggestions
- **Documentation** : Ce fichier et la documentation du projet
- **Communauté** : Forum MongoDB et Stack Overflow

---

**Note** : Ces scripts sont conçus pour un environnement de développement et de test. Pour la production, adaptez les paramètres de sécurité et de performance selon vos besoins.
