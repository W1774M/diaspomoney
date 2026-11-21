# Script de nettoyage Docker

Ce script permet de nettoyer les images Docker, conteneurs, volumes et cache de build non utilisés.

## Utilisation

### 1. Mode dry-run (recommandé en premier)
Affiche ce qui sera nettoyé sans rien supprimer :

```bash
pnpm cleanup:docker
# ou
./scripts/cleanup-docker.sh --dry-run
```

### 2. Nettoyage complet
Nettoie tout (images, conteneurs, volumes, cache) :

```bash
pnpm cleanup:docker:all
# ou
./scripts/cleanup-docker.sh --all
```

### 3. Nettoyage sélectif

```bash
# Seulement les images
./scripts/cleanup-docker.sh --images

# Seulement les conteneurs arrêtés
./scripts/cleanup-docker.sh --containers

# Seulement les volumes orphelins
./scripts/cleanup-docker.sh --volumes

# Seulement le cache de build
./scripts/cleanup-docker.sh --build-cache

# Combinaisons
./scripts/cleanup-docker.sh --images --containers
```

## Ce qui est nettoyé

### Par défaut (sans options)
- ✅ Conteneurs arrêtés
- ✅ Images non utilisées (dangling et non référencées)

### Avec `--all`
- ✅ Conteneurs arrêtés
- ✅ Images non utilisées
- ✅ Images diaspomoney anciennes (garde les 5 dernières par tag)
- ✅ Volumes orphelins
- ✅ Cache de build Docker

## Images diaspomoney

Le script garde automatiquement les **5 dernières images** pour chaque tag de base :
- `dev-*` → garde les 5 dernières
- `rct-*` → garde les 5 dernières
- `prod-*` → garde les 5 dernières
- `latest` → garde les 5 dernières

Les images plus anciennes sont supprimées.

## Exemples de sortie

```
🐳 Nettoyage Docker
===================

📦 Nettoyage des conteneurs...
   Conteneurs arrêtés trouvés: 3
   Suppression des conteneurs arrêtés...

🖼️  Nettoyage des images...
   Images dangling trouvées: 5
   Suppression des images dangling...
   
   Images non utilisées trouvées: 12
   Suppression des images non utilisées...

📊 Résumé de l'espace Docker:
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          45        12        2.5GB     1.2GB (48%)
Containers      8         3         120MB     60MB (50%)
Local Volumes   5         3         500MB     200MB (40%)
Build Cache     0         0         0B        0B

✅ Nettoyage terminé!
```

## Notes importantes

- ⚠️ **Faites toujours un `--dry-run` avant de supprimer**
- Les images en cours d'utilisation ne seront **pas** supprimées
- Les conteneurs en cours d'exécution ne seront **pas** supprimés
- Les volumes utilisés par des conteneurs ne seront **pas** supprimés
- Le script est sûr et ne supprime que ce qui n'est pas utilisé

## Commandes Docker équivalentes

Si vous préférez utiliser directement Docker :

```bash
# Nettoyer tout
docker system prune -a --volumes

# Seulement les images non utilisées
docker image prune -a

# Seulement les conteneurs arrêtés
docker container prune

# Seulement les volumes orphelins
docker volume prune

# Seulement le cache de build
docker builder prune -a
```

