#!/bin/bash

# Script de migration pour corriger les commandes avec un statut CONFIRMED ou FINISHED
# mais un paymentStatus "pending"
#
# Usage: 
#   ./scripts/fix-booking-payment-status.sh [--dry-run] [--yes] [--host HOST]
#   --dry-run: Affiche seulement les commandes à corriger sans les modifier
#   --yes: Exécute la correction sans demander de confirmation
#   --host HOST: Spécifie l'hôte MongoDB (par défaut: localhost si exécuté en dehors de Docker)

set -euo pipefail

# Options
DRY_RUN=false
AUTO_YES=false
MONGO_HOST_OVERRIDE=""

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --yes)
            AUTO_YES=true
            shift
            ;;
        --host)
            MONGO_HOST_OVERRIDE="$2"
            shift 2
            ;;
        *)
            echo "Option inconnue: $1"
            echo "Usage: $0 [--dry-run] [--yes] [--host HOST]"
            exit 1
            ;;
    esac
done

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions d'affichage
show_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

show_success() {
    echo -e "${GREEN}✓${NC} $1"
}

show_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

show_error() {
    echo -e "${RED}✗${NC} $1"
}

# Vérifier que MongoDB est disponible
if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
    show_error "MongoDB shell (mongosh ou mongo) n'est pas installé"
    show_info "Installation: https://www.mongodb.com/try/download/shell"
    exit 1
fi

MONGO_CMD="mongosh"
if ! command -v mongosh &> /dev/null; then
    MONGO_CMD="mongo"
fi

# Charger les variables d'environnement depuis .env
load_env() {
    if [ -f .env ]; then
        # Parser le fichier .env ligne par ligne
        while IFS= read -r line || [ -n "$line" ]; do
            # Ignorer les commentaires et lignes vides
            [[ "$line" =~ ^[[:space:]]*# ]] && continue
            [[ -z "${line// }" ]] && continue
            
            # Extraire la clé et la valeur
            if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
                key="${BASH_REMATCH[1]}"
                value="${BASH_REMATCH[2]}"
                
                # Nettoyer la clé et la valeur
                key=$(echo "$key" | xargs)
                value=$(echo "$value" | xargs | sed "s/^['\"]//;s/['\"]$//")
                
                # Exporter la variable
                export "$key=$value"
            fi
        done < .env
        
        # Résoudre les références de variables (deux passes pour gérer les références imbriquées)
        for _ in {1..2}; do
            while IFS= read -r line || [ -n "$line" ]; do
                [[ "$line" =~ ^[[:space:]]*# ]] && continue
                [[ -z "${line// }" ]] && continue
                
                if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
                    key="${BASH_REMATCH[1]}"
                    value="${BASH_REMATCH[2]}"
                    key=$(echo "$key" | xargs)
                    
                    # Évaluer les références de variables dans la valeur
                    eval "value=\"$value\""
                    export "$key=$value"
                fi
            done < .env
        done
    fi
}

load_env

# Variables MongoDB - construire l'URI si nécessaire
MONGO_ADMINUSERNAME="${MONGO_ADMINUSERNAME:-admin}"
MONGO_PASSWORD="${MONGO_PASSWORD:-}"
MONGO_DB="${MONGO_DB:-diaspomoney}"

# Gérer l'hôte et le port MongoDB
MONGO_PORT="${MONGO_PORT:-27017}"

# Si on est en dehors de Docker et que MONGO_HOST est "mongodb", utiliser localhost avec le port NodePort
if [ -n "$MONGO_HOST_OVERRIDE" ]; then
    # Priorité à l'option --host
    MONGO_HOST="$MONGO_HOST_OVERRIDE"
elif [ -n "${MONGO_HOST:-}" ]; then
    # Si MONGO_HOST est défini dans .env mais vaut "mongodb" (nom Docker) et qu'on n'est pas dans Docker
    if [ "$MONGO_HOST" = "mongodb" ] && [ ! -f /.dockerenv ] && [ -z "${DOCKER_CONTAINER:-}" ]; then
        show_warning "MONGO_HOST est défini à 'mongodb' (nom Docker) mais le script s'exécute en dehors de Docker"
        show_info "Vérification de l'accès via NodePort Kubernetes (port 30017)..."
        
        # Vérifier si le service NodePort est disponible
        if kubectl get svc diaspomoney-mongo-external -n diaspomoney &>/dev/null; then
            MONGO_HOST="localhost"
            MONGO_PORT="30017"
            show_info "Utilisation de localhost:30017 (NodePort Kubernetes)"
        else
            MONGO_HOST="localhost"
            show_info "Utilisation de localhost:27017 (port par défaut)"
        fi
    fi
else
    # Par défaut, vérifier si on peut utiliser le NodePort
    if kubectl get svc diaspomoney-mongo-external -n diaspomoney &>/dev/null; then
        MONGO_HOST="localhost"
        MONGO_PORT="30017"
        show_info "Détection automatique: utilisation de localhost:30017 (NodePort Kubernetes)"
    else
        MONGO_HOST="localhost"
        show_info "Utilisation de localhost:27017 (port par défaut)"
    fi
fi

# Si MONGODB_URI n'est pas défini, contient des variables non résolues, ou contient "mongodb" comme hôte en dehors de Docker, le reconstruire
if [ -z "${MONGODB_URI:-}" ] || \
   [[ "${MONGODB_URI}" == *'${'* ]] || \
   [[ "${MONGODB_URI}" == *'$MONGO'* ]] || \
   ([[ "${MONGODB_URI}" == *'@mongodb:'* ]] && [ ! -f /.dockerenv ] && [ -z "${DOCKER_CONTAINER:-}" ]) || \
   ([[ "${MONGODB_URI}" == *'mongodb://mongodb'* ]] && [ ! -f /.dockerenv ] && [ -z "${DOCKER_CONTAINER:-}" ]); then
    if [ -n "$MONGO_PASSWORD" ] && [ -n "$MONGO_ADMINUSERNAME" ]; then
        MONGODB_URI="mongodb://${MONGO_ADMINUSERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=${MONGO_ADMINUSERNAME}"
    else
        MONGODB_URI="mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}"
    fi
fi

# Extraire le nom de la base de données depuis l'URI si nécessaire
if [[ "$MONGODB_URI" == *"/"* ]]; then
    DB_NAME=$(echo "$MONGODB_URI" | sed 's/.*\///' | sed 's/?.*//')
    # Si DB_NAME est vide, utiliser la valeur par défaut
    DB_NAME="${DB_NAME:-${MONGO_DB:-diaspomoney}}"
else
    DB_NAME="${MONGO_DB:-diaspomoney}"
fi

show_info "Connexion à MongoDB..."
show_info "Host: ${MONGO_HOST}"
show_info "Port: ${MONGO_PORT}"
show_info "Base de données: ${DB_NAME}"
# Ne pas afficher l'URI complète pour des raisons de sécurité (contient le mot de passe)
if [[ "$MONGODB_URI" == *"@"* ]]; then
    show_info "URI: mongodb://${MONGO_ADMINUSERNAME}:***@${MONGO_HOST}:${MONGO_PORT}/${DB_NAME}"
else
    show_info "URI: ${MONGODB_URI}"
fi

# Construire le script JavaScript pour MongoDB
if [ "$DRY_RUN" = true ]; then
    MONGO_SCRIPT=$(cat <<'EOF'
// Mode dry-run: seulement compter et afficher
const query = {
  status: { $in: ['CONFIRMED', 'FINISHED', 'confirmed', 'finished'] },
  $or: [
    { 'metadata.paymentStatus': { $exists: false } },
    { 'metadata.paymentStatus': 'pending' },
    { 'metadata.paymentStatus': null }
  ]
};

const count = db.bookings.countDocuments(query);
print(`\n📊 Commandes à corriger: ${count}\n`);

if (count === 0) {
  print('✅ Aucune commande à corriger');
  quit(0);
}

// Afficher quelques exemples
print('📋 Exemples de commandes à corriger:');
const samples = db.bookings.find(query).limit(5).toArray();
samples.forEach((booking, idx) => {
  print(`   ${idx + 1}. ID: ${booking._id}, Status: ${booking.status}, PaymentStatus: ${booking.metadata?.paymentStatus || 'undefined'}`);
});

print(`\n⚠️  Mode DRY-RUN: Aucune modification effectuée`);
print(`   Exécutez sans --dry-run pour appliquer les corrections\n`);
EOF
)
else
    MONGO_SCRIPT=$(cat <<'EOF'
// Compter les commandes à corriger
const query = {
  status: { $in: ['CONFIRMED', 'FINISHED', 'confirmed', 'finished'] },
  $or: [
    { 'metadata.paymentStatus': { $exists: false } },
    { 'metadata.paymentStatus': 'pending' },
    { 'metadata.paymentStatus': null }
  ]
};

const confirmedCount = db.bookings.countDocuments(query);
print(`\n📊 Commandes à corriger: ${confirmedCount}\n`);

if (confirmedCount === 0) {
  print('✅ Aucune commande à corriger');
  quit(0);
}

// Corriger les commandes
const result = db.bookings.updateMany(
  query,
  {
    $set: {
      'metadata.paymentStatus': 'confirmed',
      'metadata.paymentPending': false
    }
  }
);

print(`\n✅ ${result.modifiedCount} commande(s) corrigée(s)\n`);
print(`📝 Détails:`);
print(`   - Matched: ${result.matchedCount}`);
print(`   - Modified: ${result.modifiedCount}`);
EOF
)
fi

# Exécuter le script
if [ "$DRY_RUN" = true ]; then
    show_info "Mode DRY-RUN: Affichage des commandes à corriger (aucune modification)..."
else
    if [ "$AUTO_YES" = false ]; then
        show_warning "Cette opération va mettre à jour le paymentStatus des commandes CONFIRMED/FINISHED"
        read -p "Continuer? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            show_info "Opération annulée"
            exit 0
        fi
    fi
    show_info "Exécution de la correction..."
fi

# Debug: afficher l'URI utilisée (masquer le mot de passe)
DEBUG_URI=$(echo "$MONGODB_URI" | sed 's/:[^@]*@/:***@/')
show_info "URI de connexion: ${DEBUG_URI}"

# Échapper l'URI pour mongosh si nécessaire
if [ "$MONGO_CMD" = "mongosh" ]; then
    # mongosh accepte l'URI directement comme argument (pas besoin de --uri dans cette version)
    echo "$MONGO_SCRIPT" | $MONGO_CMD "$MONGODB_URI" --quiet
else
    # Pour mongo (ancienne version), utiliser directement l'URI
    echo "$MONGO_SCRIPT" | $MONGO_CMD "$MONGODB_URI" --quiet
fi

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    show_success "Migration terminée avec succès"
else
    show_error "Erreur lors de la migration (code: $EXIT_CODE)"
    exit $EXIT_CODE
fi
