#!/bin/bash

# Script pour nettoyer les images Docker non utilisées
# Usage: ./scripts/cleanup-docker.sh [--dry-run] [--all] [--images] [--containers] [--volumes] [--build-cache]

set -e

DRY_RUN=false
CLEAN_ALL=false
CLEAN_IMAGES=false
CLEAN_CONTAINERS=false
CLEAN_VOLUMES=false
CLEAN_BUILD_CACHE=false

# Parser les arguments
for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --all)
            CLEAN_ALL=true
            shift
            ;;
        --images)
            CLEAN_IMAGES=true
            shift
            ;;
        --containers)
            CLEAN_CONTAINERS=true
            shift
            ;;
        --volumes)
            CLEAN_VOLUMES=true
            shift
            ;;
        --build-cache)
            CLEAN_BUILD_CACHE=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Si --all est spécifié, activer tout
if [ "$CLEAN_ALL" = true ]; then
    CLEAN_IMAGES=true
    CLEAN_CONTAINERS=true
    CLEAN_VOLUMES=true
    CLEAN_BUILD_CACHE=true
fi

# Si rien n'est spécifié, nettoyer les images et conteneurs arrêtés
if [ "$CLEAN_IMAGES" = false ] && [ "$CLEAN_CONTAINERS" = false ] && [ "$CLEAN_VOLUMES" = false ] && [ "$CLEAN_BUILD_CACHE" = false ]; then
    CLEAN_IMAGES=true
    CLEAN_CONTAINERS=true
fi

echo "🐳 Nettoyage Docker"
echo "==================="
echo ""

if [ "$DRY_RUN" = true ]; then
    echo "🔍 Mode DRY-RUN - Aucune suppression ne sera effectuée"
    echo ""
fi

# Fonction pour exécuter une commande Docker
run_docker_cmd() {
    local cmd=$1
    local description=$2
    
    if [ "$DRY_RUN" = true ]; then
        echo "   [DRY-RUN] $description"
        echo "   Commande: $cmd"
    else
        echo "   $description..."
        eval "$cmd" || echo "   ⚠️  Erreur lors de l'exécution"
    fi
    echo ""
}

# Nettoyer les conteneurs arrêtés
if [ "$CLEAN_CONTAINERS" = true ]; then
    echo "📦 Nettoyage des conteneurs..."
    
    # Afficher les conteneurs arrêtés
    STOPPED_CONTAINERS=$(docker ps -a -q -f status=exited 2>/dev/null || echo "")
    if [ -n "$STOPPED_CONTAINERS" ]; then
        echo "   Conteneurs arrêtés trouvés: $(echo "$STOPPED_CONTAINERS" | wc -l)"
        if [ "$DRY_RUN" = false ]; then
            docker ps -a -f status=exited --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"
        fi
        run_docker_cmd "docker rm $STOPPED_CONTAINERS" "Suppression des conteneurs arrêtés"
    else
        echo "   ✅ Aucun conteneur arrêté"
        echo ""
    fi
fi

# Nettoyer les images non utilisées
if [ "$CLEAN_IMAGES" = true ]; then
    echo "🖼️  Nettoyage des images..."
    
    # Images dangling (sans tag)
    DANGLING_IMAGES=$(docker images -f "dangling=true" -q 2>/dev/null || echo "")
    if [ -n "$DANGLING_IMAGES" ]; then
        echo "   Images dangling trouvées: $(echo "$DANGLING_IMAGES" | wc -l)"
        if [ "$DRY_RUN" = false ]; then
            docker images -f "dangling=true" --format "table {{.ID}}\t{{.Repository}}\t{{.Tag}}\t{{.Size}}"
        fi
        run_docker_cmd "docker rmi $DANGLING_IMAGES" "Suppression des images dangling"
    else
        echo "   ✅ Aucune image dangling"
        echo ""
    fi
    
    # Images non utilisées (non référencées par un conteneur)
    echo "   Recherche des images non utilisées..."
    UNUSED_IMAGES=$(docker images --format "{{.ID}}" | while read id; do
        if ! docker ps -a --format "{{.Image}}" | grep -q "^$id$"; then
            echo "$id"
        fi
    done)
    
    if [ -n "$UNUSED_IMAGES" ]; then
        UNUSED_COUNT=$(echo "$UNUSED_IMAGES" | wc -l)
        echo "   Images non utilisées trouvées: $UNUSED_COUNT"
        if [ "$DRY_RUN" = false ]; then
            echo "$UNUSED_IMAGES" | xargs -I {} docker images --format "table {{.ID}}\t{{.Repository}}\t{{.Tag}}\t{{.Size}}" {} | head -20
        fi
        run_docker_cmd "echo '$UNUSED_IMAGES' | xargs docker rmi" "Suppression des images non utilisées"
    else
        echo "   ✅ Toutes les images sont utilisées"
        echo ""
    fi
    
    # Images diaspomoney anciennes (garder seulement les 5 dernières par tag)
    echo "   Nettoyage des anciennes images diaspomoney..."
    DIASPOMONEY_IMAGES=$(docker images "localhost:5000/diaspomoney:*" --format "{{.Repository}}:{{.Tag}}" 2>/dev/null || echo "")
    if [ -n "$DIASPOMONEY_IMAGES" ]; then
        echo "   Images diaspomoney trouvées: $(echo "$DIASPOMONEY_IMAGES" | wc -l)"
        # Grouper par tag de base (dev, rct, prod) et garder seulement les 5 dernières
        for tag_base in dev rct prod latest; do
            OLD_IMAGES=$(docker images "localhost:5000/diaspomoney:$tag_base*" --format "{{.ID}}" | tail -n +6 2>/dev/null || echo "")
            if [ -n "$OLD_IMAGES" ]; then
                OLD_COUNT=$(echo "$OLD_IMAGES" | wc -l)
                echo "   Anciennes images $tag_base à supprimer: $OLD_COUNT"
                run_docker_cmd "echo '$OLD_IMAGES' | xargs docker rmi" "Suppression des anciennes images $tag_base"
            fi
        done
    else
        echo "   ✅ Aucune ancienne image diaspomoney"
        echo ""
    fi
fi

# Nettoyer les volumes orphelins
if [ "$CLEAN_VOLUMES" = true ]; then
    echo "💾 Nettoyage des volumes..."
    
    ORPHAN_VOLUMES=$(docker volume ls -q -f dangling=true 2>/dev/null || echo "")
    if [ -n "$ORPHAN_VOLUMES" ]; then
        echo "   Volumes orphelins trouvés: $(echo "$ORPHAN_VOLUMES" | wc -l)"
        run_docker_cmd "docker volume rm $ORPHAN_VOLUMES" "Suppression des volumes orphelins"
    else
        echo "   ✅ Aucun volume orphelin"
        echo ""
    fi
fi

# Nettoyer le cache de build
if [ "$CLEAN_BUILD_CACHE" = true ]; then
    echo "🗑️  Nettoyage du cache de build..."
    
    CACHE_SIZE=$(docker system df --format "{{.Size}}" | head -1)
    echo "   Taille actuelle du cache: $CACHE_SIZE"
    
    run_docker_cmd "docker builder prune -af" "Suppression du cache de build"
fi

# Résumé final
echo "📊 Résumé de l'espace Docker:"
if [ "$DRY_RUN" = false ]; then
    docker system df
else
    echo "   [DRY-RUN] Exécutez sans --dry-run pour voir les statistiques"
fi

echo ""
echo "✅ Nettoyage terminé!"

if [ "$DRY_RUN" = true ]; then
    echo ""
    echo "💡 Pour effectuer réellement le nettoyage, exécutez:"
    echo "   ./scripts/cleanup-docker.sh --all"
fi

