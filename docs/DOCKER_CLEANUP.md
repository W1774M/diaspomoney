# 🐳 Guide de Nettoyage Docker

## 🗑️ Commandes de Nettoyage

### 1. Nettoyer TOUT (images, conteneurs, volumes, cache)
```bash
# ⚠️ ATTENTION : Supprime TOUT ce qui n'est pas utilisé
docker system prune -a --volumes

# Version interactive (demande confirmation)
docker system prune -a --volumes
```

### 2. Nettoyer UNIQUEMENT les builds non utilisés
```bash
# Supprimer les images "dangling" (non taguées)
docker image prune

# Supprimer TOUTES les images non utilisées par un conteneur
docker image prune -a

# Voir l'espace libéré
docker image prune -a --filter "until=24h"
```

### 3. Nettoyer le cache de build
```bash
# Supprimer le cache de build Docker
docker builder prune

# Supprimer tout le cache (force)
docker builder prune -a
```

### 4. Commandes spécifiques

#### Supprimer les conteneurs arrêtés
```bash
docker container prune
```

#### Supprimer les volumes non utilisés
```bash
# ⚠️ ATTENTION : Peut supprimer les données MongoDB/Redis si non attachés
docker volume prune
```

#### Supprimer les réseaux non utilisés
```bash
docker network prune
```

---

## 📊 Voir l'Utilisation de l'Espace

```bash
# Vue d'ensemble de l'espace utilisé
docker system df

# Vue détaillée
docker system df -v
```

---

## 🎯 Nettoyage Recommandé pour Production

### Approche Sécurisée (étape par étape)

```bash
# 1. Arrêter les conteneurs de l'ancien build
docker compose -f docker-compose.prod.yml down

# 2. Lister les images
docker images

# 3. Supprimer l'ancienne image de l'app
docker rmi diaspomoney-app

# 4. Nettoyer les images dangling
docker image prune

# 5. Nettoyer le cache de build
docker builder prune

# 6. Reconstruire
docker compose -f docker-compose.prod.yml build app

# 7. Redémarrer
docker compose -f docker-compose.prod.yml up -d
```

### Approche Rapide (automatique)

```bash
# Tout en une commande
docker compose -f docker-compose.prod.yml down && \
docker image prune -a -f && \
docker builder prune -a -f && \
docker compose -f docker-compose.prod.yml build app && \
docker compose -f docker-compose.prod.yml up -d
```

---

## 🚨 Commandes à Éviter en Production

### ❌ NE JAMAIS faire
```bash
# Supprime TOUS les volumes (perte de données MongoDB/Redis)
docker system prune -a --volumes -f

# Supprime le volume MongoDB (perte de toutes les données)
docker volume rm diaspomoney_mongodb_data
```

### ✅ À la place, faire
```bash
# Nettoyer seulement les images et le cache
docker image prune -a -f && docker builder prune -a -f
```

---

## 📦 Commandes Spécifiques au Projet

### Nettoyer et reconstruire l'app
```bash
# Arrêter l'app
docker compose -f docker-compose.prod.yml stop app

# Supprimer le conteneur
docker compose -f docker-compose.prod.yml rm -f app

# Supprimer l'image
docker rmi diaspomoney_app

# Reconstruire et démarrer
docker compose -f docker-compose.prod.yml up -d --build app
```

### Nettoyer TOUT sauf les données
```bash
# Arrêter tous les services
docker compose -f docker-compose.prod.yml down

# Nettoyer images et cache (garde les volumes)
docker image prune -a -f
docker builder prune -a -f

# Redémarrer
docker compose -f docker-compose.prod.yml up -d
```

---

## 💾 Sauvegarder Avant Nettoyage

### Backup MongoDB
```bash
# Créer un backup
docker exec diaspomoney-mongodb mongodump \
  --username admin \
  --password ${MONGO_PASSWORD} \
  --authenticationDatabase admin \
  --out /data/backup

# Copier le backup localement
docker cp diaspomoney-mongodb:/data/backup ./backup-$(date +%Y%m%d)
```

### Backup Redis
```bash
# Sauvegarder Redis
docker exec diaspomoney-redis redis-cli --pass ${REDIS_PASSWORD} SAVE
docker cp diaspomoney-redis:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

---

## 📈 Monitoring de l'Espace

```bash
# Vérifier l'espace disque du serveur
df -h

# Voir l'espace utilisé par Docker
du -sh /var/lib/docker

# Lister les gros volumes
docker system df -v | grep -i volume
```

---

## 🔄 Script de Maintenance Automatique

Créer un fichier `cleanup.sh`:

```bash
#!/bin/bash
set -e

echo "🐳 Nettoyage Docker - DiaspoMoney"
echo "================================="

# Sauvegarder les données
echo "📦 Backup des données..."
./backup.sh

# Arrêter l'app (garde les services)
echo "⏸️  Arrêt de l'application..."
docker compose -f docker-compose.prod.yml stop app

# Nettoyer les images
echo "🗑️  Suppression des images non utilisées..."
docker image prune -a -f

# Nettoyer le cache
echo "🧹 Nettoyage du cache de build..."
docker builder prune -a -f

# Afficher l'espace libéré
echo "📊 Espace Docker après nettoyage:"
docker system df

echo "✅ Nettoyage terminé!"
```

Rendre exécutable:
```bash
chmod +x cleanup.sh
```

---

## 📝 Résumé des Commandes Essentielles

```bash
# Nettoyage sécurisé (recommandé)
docker image prune -a -f && docker builder prune -a -f

# Voir l'espace utilisé
docker system df

# Reconstruire l'app après nettoyage
docker compose -f docker-compose.prod.yml up -d --build app

# Nettoyage complet SANS supprimer les données
docker compose -f docker-compose.prod.yml down
docker system prune -a -f
docker compose -f docker-compose.prod.yml up -d
```

