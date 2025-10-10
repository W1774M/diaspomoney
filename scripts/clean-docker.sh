#!/bin/bash

# Script de nettoyage Docker pour DiaspoMoney
# Usage: ./scripts/clean-docker.sh [--force]

set -e

echo "🧹 Nettoyage Docker DiaspoMoney"
echo "================================="

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Fonction pour demander confirmation
confirm() {
    if [ "$1" = "--force" ]; then
        return 0
    fi
    
    echo -n "⚠️  Êtes-vous sûr de vouloir continuer ? (y/N): "
    read -r response
    case "$response" in
        [yY]|[yY][eE][sS]) return 0 ;;
        *) echo "❌ Annulé"; exit 1 ;;
    esac
}

# Arrêter tous les services DiaspoMoney
echo "🛑 Arrêt des services DiaspoMoney..."
cd docker 2>/dev/null || echo "⚠️  Répertoire docker non trouvé, arrêt des conteneurs par nom..."

# Arrêter les conteneurs DiaspoMoney
docker stop $(docker ps -q --filter "name=diaspomoney") 2>/dev/null || echo "Aucun conteneur DiaspoMoney à arrêter"
docker stop $(docker ps -q --filter "name=mongodb") 2>/dev/null || echo "Aucun conteneur MongoDB à arrêter"
docker stop $(docker ps -q --filter "name=mongo-express") 2>/dev/null || echo "Aucun conteneur mongo-express à arrêter"
docker stop $(docker ps -q --filter "name=app") 2>/dev/null || echo "Aucun conteneur app à arrêter"
docker stop $(docker ps -q --filter "name=traefik") 2>/dev/null || echo "Aucun conteneur traefik à arrêter"

# Supprimer les conteneurs DiaspoMoney
echo "🗑️  Suppression des conteneurs DiaspoMoney..."
docker rm $(docker ps -aq --filter "name=diaspomoney") 2>/dev/null || echo "Aucun conteneur DiaspoMoney à supprimer"
docker rm $(docker ps -aq --filter "name=mongodb") 2>/dev/null || echo "Aucun conteneur MongoDB à supprimer"
docker rm $(docker ps -aq --filter "name=mongo-express") 2>/dev/null || echo "Aucun conteneur mongo-express à supprimer"
docker rm $(docker ps -aq --filter "name=app") 2>/dev/null || echo "Aucun conteneur app à supprimer"
docker rm $(docker ps -aq --filter "name=traefik") 2>/dev/null || echo "Aucun conteneur traefik à supprimer"

# Supprimer les volumes DiaspoMoney
echo "🗑️  Suppression des volumes DiaspoMoney..."
docker volume rm $(docker volume ls -q --filter "name=diaspomoney") 2>/dev/null || echo "Aucun volume DiaspoMoney à supprimer"
docker volume rm $(docker volume ls -q --filter "name=mongodb") 2>/dev/null || echo "Aucun volume MongoDB à supprimer"
docker volume rm $(docker volume ls -q --filter "name=traefik") 2>/dev/null || echo "Aucun volume Traefik à supprimer"

# Supprimer les réseaux DiaspoMoney
echo "🗑️  Suppression des réseaux DiaspoMoney..."
docker network rm diaspomoney 2>/dev/null || echo "Réseau diaspomoney déjà supprimé ou inexistant"

# Nettoyage général Docker (optionnel)
echo ""
echo "🧹 Nettoyage général Docker..."
echo "Voulez-vous effectuer un nettoyage complet de Docker ?"
echo "  - Images non utilisées"
echo "  - Volumes orphelins"
echo "  - Réseaux non utilisés"
echo "  - Cache de build"
echo ""

if [ "$1" = "--force" ]; then
    echo "🔧 Nettoyage complet (mode --force)..."
    docker system prune -af --volumes
    echo "✅ Nettoyage complet terminé"
else
    echo -n "⚠️  Effectuer le nettoyage complet ? (y/N): "
    read -r response
    case "$response" in
        [yY]|[yY][eE][sS])
            echo "🔧 Nettoyage complet..."
            docker system prune -af --volumes
            echo "✅ Nettoyage complet terminé"
            ;;
        *)
            echo "ℹ️  Nettoyage partiel uniquement"
            ;;
    esac
fi

echo ""
echo "🎉 Nettoyage terminé !"
echo ""
echo "📋 Pour redémarrer l'environnement :"
echo "   ./scripts/dev-setup.sh    # Développement"
echo "   ./scripts/start-prod.sh  # Production"
echo ""
echo "📊 Pour voir l'espace libéré :"
echo "   docker system df"
