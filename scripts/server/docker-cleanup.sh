#!/bin/bash

# Script de nettoyage Docker
# Supprime les containers, networks, caches et volumes non utilisés
# Usage: ./docker-cleanup.sh [--dry-run] [--verbose]
#
# Installé sur le serveur dans /root/Lab/scripts/docker-cleanup.sh (cron horaire).
# Les images portant le label fr.diaspomoney.candidate (image prod pré-construite pendant
# le déploiement rct, voir scripts/server/ci-deploy.sh) sont conservées : elles attendent
# le clic Approve de la mise en production.

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
DRY_RUN=false
VERBOSE=false
LOG_FILE="/root/Lab/scripts/docker-cleanup.log"

# Fonction de logging
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    if [ "$VERBOSE" = true ] || [ "$level" = "ERROR" ]; then
        case $level in
            ERROR)
                echo -e "${RED}[ERROR]${NC} $message" >&2
                ;;
            SUCCESS)
                echo -e "${GREEN}[SUCCESS]${NC} $message"
                ;;
            WARNING)
                echo -e "${YELLOW}[WARNING]${NC} $message"
                ;;
            INFO)
                echo -e "${BLUE}[INFO]${NC} $message"
                ;;
            *)
                echo "[$level] $message"
                ;;
        esac
    fi
}

# Fonction pour exécuter une commande Docker
run_docker_cmd() {
    local cmd="$1"
    local description="$2"
    
    if [ "$DRY_RUN" = true ]; then
        log "INFO" "DRY-RUN: $description"
        log "INFO" "Commande: $cmd"
        return 0
    else
        log "INFO" "Exécution: $description"
        if eval "$cmd" >> "$LOG_FILE" 2>&1; then
            log "SUCCESS" "$description - Réussi"
            return 0
        else
            log "ERROR" "$description - Échec"
            return 1
        fi
    fi
}

# Parse des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Usage: $0 [--dry-run] [--verbose]"
            exit 1
            ;;
    esac
done

log "INFO" "=== Début du nettoyage Docker ==="
log "INFO" "Mode DRY-RUN: $DRY_RUN"

# Vérifier que Docker est installé et accessible
if ! command -v docker &> /dev/null; then
    log "ERROR" "Docker n'est pas installé ou non accessible"
    exit 1
fi

# Vérifier que Docker daemon est en cours d'exécution
if ! docker info &> /dev/null; then
    log "ERROR" "Docker daemon n'est pas en cours d'exécution"
    exit 1
fi

# 1. Arrêter tous les containers en cours d'exécution (sauf ceux marqués comme importants)
log "INFO" "Recherche de containers en cours d'exécution..."
RUNNING_CONTAINERS=$(docker ps -q)
if [ -n "$RUNNING_CONTAINERS" ]; then
    log "WARNING" "Containers en cours d'exécution trouvés. Ils ne seront pas arrêtés pour des raisons de sécurité."
    log "INFO" "Containers en cours: $(docker ps --format '{{.Names}}' | tr '\n' ', ')"
else
    log "INFO" "Aucun container en cours d'exécution"
fi

# 2. Supprimer tous les containers arrêtés
log "INFO" "Suppression des containers arrêtés..."
STOPPED_CONTAINERS=$(docker ps -a -q -f status=exited)
if [ -n "$STOPPED_CONTAINERS" ]; then
    run_docker_cmd "docker rm $STOPPED_CONTAINERS" "Suppression des containers arrêtés"
else
    log "INFO" "Aucun container arrêté à supprimer"
fi

# 3. Supprimer tous les networks non utilisés
log "INFO" "Suppression des networks non utilisés..."
run_docker_cmd "docker network prune -f" "Nettoyage des networks"

# 4. Nettoyer le cache Docker (images, build cache, etc.)
log "INFO" "Nettoyage du cache Docker..."
# Équivalent de « docker system prune -a --volumes », en épargnant l'image prod
# pré-construite (le filtre de label ne vaut pas pour le cache de build, nettoyé à part).
run_docker_cmd "docker container prune -f" "Nettoyage des containers arrêtés"
run_docker_cmd "docker image prune -a -f --filter label!=fr.diaspomoney.candidate" "Nettoyage des images (sauf image prod pré-construite)"
run_docker_cmd "docker builder prune -a -f" "Nettoyage du cache de build"

# 5. Supprimer les volumes non utilisés (en plus de system prune)
log "INFO" "Suppression des volumes non utilisés..."
run_docker_cmd "docker volume prune -f" "Nettoyage des volumes"

# 6. Nettoyer les images non utilisées (optionnel, déjà fait par system prune mais pour être sûr)
log "INFO" "Nettoyage des images non utilisées..."
run_docker_cmd "docker image prune -a -f --filter label!=fr.diaspomoney.candidate" "Nettoyage des images"

# Afficher l'espace libéré
if [ "$DRY_RUN" = false ]; then
    log "INFO" "Espace disque Docker:"
    docker system df >> "$LOG_FILE" 2>&1 || true
fi

log "INFO" "=== Fin du nettoyage Docker ==="

exit 0

