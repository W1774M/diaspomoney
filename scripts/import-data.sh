#!/bin/bash

# Script d'importation de données JSON dans MongoDB
# Usage: ./scripts/import-data.sh [collection_name] [json_file]

set -e

# Configuration
MONGO_HOST=${MONGO_HOST:-"localhost"}
MONGO_PORT=${MONGO_PORT:-"27017"}
MONGO_DB=${MONGO_DB:-"diaspomoney"}
DATA_DIR="./data"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction pour vérifier si MongoDB est accessible
check_mongo_connection() {
    log_info "Vérification de la connexion MongoDB..."
    if ! mongosh --host $MONGO_HOST --port $MONGO_PORT --eval "db.runCommand('ping')" > /dev/null 2>&1; then
        log_error "Impossible de se connecter à MongoDB sur $MONGO_HOST:$MONGO_PORT"
        exit 1
    fi
    log_success "Connexion MongoDB établie"
}

# Fonction pour importer un fichier JSON dans une collection
import_json_file() {
    local collection=$1
    local json_file=$2
    
    if [ ! -f "$json_file" ]; then
        log_error "Fichier JSON non trouvé: $json_file"
        return 1
    fi
    
    log_info "Importation de $json_file dans la collection $collection..."
    
    # Vérifier si le fichier JSON est valide
    if ! jq empty "$json_file" 2>/dev/null; then
        log_error "Fichier JSON invalide: $json_file"
        return 1
    fi
    
    # Importer le fichier JSON
    if mongosh $MONGO_DB --eval "
        db.$collection.drop();
        db.$collection.insertMany($(cat $json_file));
        print('Documents insérés: ' + db.$collection.countDocuments());
    " > /dev/null 2>&1; then
        log_success "Importation réussie: $json_file -> $collection"
    else
        log_error "Échec de l'importation: $json_file -> $collection"
        return 1
    fi
}

# Fonction pour importer tous les fichiers JSON du dossier data
import_all_data() {
    log_info "Importation de tous les fichiers JSON depuis $DATA_DIR..."
    
    if [ ! -d "$DATA_DIR" ]; then
        log_error "Dossier $DATA_DIR non trouvé"
        exit 1
    fi
    
    # Parcourir tous les fichiers JSON
    for json_file in "$DATA_DIR"/*.json; do
        if [ -f "$json_file" ]; then
            # Extraire le nom de la collection depuis le nom du fichier
            filename=$(basename "$json_file")
            collection_name="${filename%.json}"
            
            log_info "Traitement du fichier: $filename"
            import_json_file "$collection_name" "$json_file"
        fi
    done
}

# Fonction pour créer des données de test basées sur les mocks
create_mock_data() {
    log_info "Création des données de test basées sur les mocks..."
    
    # Créer le dossier data s'il n'existe pas
    mkdir -p "$DATA_DIR"
    
    # Générer les données JSON à partir des mocks

EOF

    cat > "$DATA_DIR/partners.json" << 'EOF'
[
  {
    "name": "Lusinage",
    "logo": "https://lusinage.fr/asset/images/logo/lusinage.png",
    "description": "Conception et fabrication de pièces mécaniques de haute précision",
    "website": "https://lusinage.fr",
    "category": "Usinage",
    "services": ["Usinage CNC", "Impression 3D"],
    "location": "Rouen, France",
    "established": "2021",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "name": "BPI France",
    "logo": "https://www.bpifrance.fr/themes/custom/bpi_main/logo.svg",
    "description": "Bpifrance est le résultat de nombreux regroupements",
    "website": "https://www.bpifrance.fr",
    "category": "Finance",
    "services": ["Creation", "Innovation", "Financement", "Investissement", "International", "Conseil"],
    "location": "Paris, France",
    "established": "1995",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    name: "Rouen Normandie Création",
    logo: "https://diaspomoney.fr/wp-content/uploads/2025/09/Sans-titre-2-02-300x259.png",
    description:
      "Rouen Normandie Création est composé de 6 sites, dont des sites spécialisés -écotechnologies, numérique, santé, mais aussi de son réseau de partenaires. Nous sommes à vos côtés pour vous apporter l’expertise, la formation et les partenaires pour accompagner et booster votre projet.",
    website: "https://www.rouen-normandie-creation.fr/",
    category: "Education",
    services: [
      "Formation",
      "Innovation",
      "Financement",
      "Investissement",
      "Conseil",
    ],
    location: "Rouen, France",
    established: "2016",
  },
  {
    name: "Seine Innopolis",
    logo: "https://diaspomoney.fr/wp-content/uploads/2025/09/Logos-partenaires_DM-300x300.png",
    description:
      "Seine Innopolis est la pépinière-hôtel dédiée aux Technologies de l’Information et de la Communication. Le lieu ouvre en 2013 dans l’ancienne caserne Taillandier au Petit Quevilly et propose 10 000 m² de bureaux et plateformes pour les entreprises. Seine Innopolis s’impose donc comme un acteur majeur sur le territoire pour le développement des entreprises du numérique.",
    website:
      "https://www.rouen-normandie-creation.fr/hebergements/seine-innopolis",
    category: "Technologie",
    services: [
      "Technologie",
      "Innovation",
      "Financement",
      "Investissement",
      "International",
      "Conseil",
    ],
    location: "Le Petit-Quevilly, France",
    established: "2013",
  },
  {
    name: "Metropole Rouen Normandie",
    logo: "https://diaspomoney.fr/wp-content/uploads/2025/09/Sans-titre-2-03-300x300.png",
    description:
      "La Métropole Rouen Normandie est une métropole française située dans le département de la Seine-Maritime, en région Normandie. Le 1er janvier 2015, elle a remplacé la communauté d'agglomération Rouen-Elbeuf-Austreberthe (CREA) qui avait été créée le 1er janvier 2010 par le regroupement de quatre structures intercommunales. La forme juridique de la métropole constitue la forme la plus intégrée des intercommunalités françaises. À ce titre, elle exerce de très nombreuses compétences antérieurement exercées par les communes membres, au bénéfice de ses habitants et de son tissu économique. ",
    website: "https://www.metropole-rouen-normandie.fr/",
    category: "Administration",
    services: [
      "Administration",
      "Conseil",
      "Financement",
      "Investissement",
      "International",
    ],
    location: "Rouen, France",
    established: "2015",
  },
  {
    name: "CCI France",
    logo: "https://diaspomoney.fr/wp-content/uploads/2025/09/Sans-titre-2-05-300x205.png",
    description:
      "CCI France est une organisation professionnelle qui représente les entreprises françaises et les entreprises étrangères dans le monde.",
    website: "https://www.cci.fr/",
    category: "Administration",
    services: ["Conseil", "Financement", "Investissement", "International"],
    location: "Paris, France",
    established: "1898",
  },
  {
    name: "ECOLE L'ELDORADO",
    logo: "https://diaspomoney.fr/wp-content/uploads/2025/09/Sans-titre-2-06-300x205.png",
    description: "L'ELDORADO, Crèche, Maternelle, Primaire, Collège",
    website: "http://eldorado.org/",
    category: "Education",
    services: ["Education"],
    location: "Pointe, Noire, Congo-Brazzaville",
    established: "1995",
  }
]
EOF


    log_success "Données de test créées dans $DATA_DIR"
}

# Fonction d'aide
show_help() {
    echo "Usage: $0 [OPTIONS] [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  import-all          Importer tous les fichiers JSON du dossier data/"
    echo "  import <collection> <file>  Importer un fichier JSON spécifique"
    echo "  create-mock         Créer des données de test basées sur les mocks"
    echo "  help                Afficher cette aide"
    echo ""
    echo "Options:"
    echo "  --host HOST         Host MongoDB (défaut: localhost)"
    echo "  --port PORT         Port MongoDB (défaut: 27017)"
    echo "  --db DATABASE       Base de données (défaut: diaspomoney)"
    echo ""
    echo "Exemples:"
    echo "  $0 create-mock"
    echo "  $0 import-all"
    echo "  $0 import users ./data/users.json"
    echo "  $0 --host localhost --port 27017 import-all"
}

# Fonction principale
main() {
    # Traitement des arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --host)
                MONGO_HOST="$2"
                shift 2
                ;;
            --port)
                MONGO_PORT="$2"
                shift 2
                ;;
            --db)
                MONGO_DB="$2"
                shift 2
                ;;
            import-all)
                COMMAND="import-all"
                shift
                ;;
            import)
                COMMAND="import"
                COLLECTION="$2"
                JSON_FILE="$3"
                shift 3
                ;;
            create-mock)
                COMMAND="create-mock"
                shift
                ;;
            help|--help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Argument inconnu: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Vérifier la connexion MongoDB
    check_mongo_connection
    
    # Exécuter la commande
    case $COMMAND in
        import-all)
            import_all_data
            ;;
        import)
            if [ -z "$COLLECTION" ] || [ -z "$JSON_FILE" ]; then
                log_error "Collection et fichier JSON requis pour la commande import"
                exit 1
            fi
            import_json_file "$COLLECTION" "$JSON_FILE"
            ;;
        create-mock)
            create_mock_data
            ;;
        *)
            log_error "Commande requise"
            show_help
            exit 1
            ;;
    esac    
    log_success "Opération terminée avec succès"
}

# Exécuter la fonction principale
main "$@"
