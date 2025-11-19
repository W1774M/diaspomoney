#!/bin/bash

# Script pour mettre à jour le mot de passe de l'admin
# Utilise mongosh pour exécuter du JavaScript avec bcrypt

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MONGODB_URI="${MONGODB_URI:-mongodb://admin:password123@localhost:27017/diaspomoney?authSource=admin}"
NEW_PASSWORD="${NEW_PASSWORD:-password123}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@diaspomoney.fr}"
DB_NAME="${DB_NAME:-diaspomoney}"

echo "🔐 Script de mise à jour du mot de passe admin"
echo "=============================================="
echo ""

# Vérifier que node est disponible (requis pour tout)
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ node n'est pas installé ou n'est pas dans le PATH${NC}"
    echo "Installez Node.js: https://nodejs.org/"
    exit 1
fi

# Vérifier si mongosh est disponible (optionnel, on utilisera Node.js sinon)
USE_MONGOSH=false
if command -v mongosh &> /dev/null; then
    USE_MONGOSH=true
fi

echo "📦 Vérification des dépendances..."
echo "✅ node trouvé"
if [ "$USE_MONGOSH" = true ]; then
    echo "✅ mongosh trouvé (sera utilisé)"
else
    echo -e "${YELLOW}⚠️  mongosh non trouvé, utilisation de Node.js avec le driver MongoDB${NC}"
fi
echo ""

# Extraire les informations de connexion depuis l'URI
# Format: mongodb://username:password@host:port/database?authSource=admin
if [[ $MONGODB_URI =~ mongodb://([^:]+):([^@]+)@([^/]+)/([^?]+) ]]; then
    MONGO_USER="${BASH_REMATCH[1]}"
    MONGO_PASS="${BASH_REMATCH[2]}"
    MONGO_HOST_PORT="${BASH_REMATCH[3]}"
    MONGO_DB="${BASH_REMATCH[4]}"
    
    # Séparer host et port
    if [[ $MONGO_HOST_PORT =~ ([^:]+):([0-9]+) ]]; then
        MONGO_HOST="${BASH_REMATCH[1]}"
        MONGO_PORT="${BASH_REMATCH[2]}"
    else
        MONGO_HOST="$MONGO_HOST_PORT"
        MONGO_PORT="27017"
    fi
else
    echo -e "${RED}❌ Format d'URI MongoDB invalide${NC}"
    exit 1
fi

echo "🔌 Connexion à MongoDB..."
echo "   Host: $MONGO_HOST"
echo "   Port: $MONGO_PORT"
echo "   Database: $MONGO_DB"
echo "   User: $MONGO_USER"
echo ""

# Générer le hash bcrypt avec Node.js
echo "🔑 Génération du hash bcrypt..."
HASHED_PASSWORD=$(node -e "
const bcrypt = require('bcryptjs');
const password = process.argv[1];
bcrypt.hash(password, 10).then(hash => {
  console.log(hash);
}).catch(err => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
" "$NEW_PASSWORD")

if [ -z "$HASHED_PASSWORD" ]; then
    echo -e "${RED}❌ Erreur lors de la génération du hash${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Hash généré: ${HASHED_PASSWORD:0:30}...${NC}"
echo ""

# Fonction pour mettre à jour avec Node.js (méthode de secours)
update_with_nodejs() {
    echo "💾 Mise à jour en cours avec Node.js..."
    
    NODE_SCRIPT=$(cat <<NODEEOF
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const MONGODB_URI = "$MONGODB_URI";
const NEW_PASSWORD = "$NEW_PASSWORD";
const ADMIN_EMAIL = "$ADMIN_EMAIL";
const HASHED_PASSWORD = "$HASHED_PASSWORD";

async function updateAdminPassword() {
  let client;
  try {
    console.log('🔌 Connexion à MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connecté à MongoDB');

    const db = client.db("$MONGO_DB");
    const users = db.collection('users');

    console.log('📝 Mise à jour du mot de passe pour ' + ADMIN_EMAIL + '...');
    const result = await users.updateOne(
      { email: ADMIN_EMAIL },
      { \$set: { password: HASHED_PASSWORD } }
    );

    if (result.matchedCount === 0) {
      console.log('⚠️  Aucun utilisateur trouvé avec cet email');
      process.exit(1);
    } else if (result.modifiedCount === 0) {
      console.log('⚠️  Le mot de passe était déjà à jour');
    } else {
      console.log('✅ Mot de passe mis à jour avec succès');
    }

    // Vérifier que le mot de passe fonctionne
    const user = await users.findOne({ email: ADMIN_EMAIL });
    if (user && user.password) {
      const isValid = await bcrypt.compare(NEW_PASSWORD, user.password);
      console.log('✅ Vérification du mot de passe:', isValid ? 'OK' : 'ÉCHEC');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

updateAdminPassword();
NODEEOF
)
    
    if node -e "$NODE_SCRIPT"; then
        return 0
    else
        return 1
    fi
}

# Fonction pour mettre à jour avec mongosh
update_with_mongosh() {
    echo "💾 Mise à jour en cours avec mongosh..."
    
    MONGO_SCRIPT=$(cat <<'MONGOEOF'
// Connexion à MongoDB
const db = db.getSiblingDB("$MONGO_DB");
const users = db.users;

print("📝 Mise à jour du mot de passe pour $ADMIN_EMAIL...");

// Mettre à jour le mot de passe
const result = users.updateOne(
  { email: "$ADMIN_EMAIL" },
  { $set: { password: "$HASHED_PASSWORD" } }
);

if (result.matchedCount === 0) {
  print("⚠️  Aucun utilisateur trouvé avec cet email");
  quit(1);
} else if (result.modifiedCount === 0) {
  print("⚠️  Le mot de passe était déjà à jour");
} else {
  print("✅ Mot de passe mis à jour avec succès");
}

// Vérifier que le mot de passe fonctionne
const user = users.findOne({ email: "$ADMIN_EMAIL" });
if (user && user.password) {
  if (user.password.length > 50) {
    print("✅ Hash du mot de passe présent et valide");
  } else {
    print("⚠️  Le hash du mot de passe semble invalide");
  }
}

quit(0);
MONGOEOF
)

    # Remplacer les variables dans le script
    MONGO_SCRIPT=$(echo "$MONGO_SCRIPT" | sed "s|\$MONGO_DB|$MONGO_DB|g" | sed "s|\$ADMIN_EMAIL|$ADMIN_EMAIL|g" | sed "s|\$HASHED_PASSWORD|$HASHED_PASSWORD|g")

    # Créer un fichier temporaire pour le script mongosh
    TEMP_SCRIPT=$(mktemp 2>/dev/null || echo "/tmp/mongo_script_$$.js")
    echo "$MONGO_SCRIPT" > "$TEMP_SCRIPT"

    if mongosh "$MONGODB_URI" --quiet --file "$TEMP_SCRIPT"; then
        rm -f "$TEMP_SCRIPT"
        return 0
    else
        rm -f "$TEMP_SCRIPT"
        return 1
    fi
}

# Exécuter la mise à jour
echo "💾 Mise à jour en cours..."
if [ "$USE_MONGOSH" = true ]; then
    if update_with_mongosh; then
        echo ""
        echo -e "${GREEN}✅ Opération terminée avec succès${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Échec avec mongosh, tentative avec Node.js...${NC}"
        if update_with_nodejs; then
            echo ""
            echo -e "${GREEN}✅ Opération terminée avec succès${NC}"
            exit 0
        else
            echo ""
            echo -e "${RED}❌ Erreur lors de la mise à jour${NC}"
            exit 1
        fi
    fi
else
    if update_with_nodejs; then
        echo ""
        echo -e "${GREEN}✅ Opération terminée avec succès${NC}"
        exit 0
    else
        echo ""
        echo -e "${RED}❌ Erreur lors de la mise à jour${NC}"
        exit 1
    fi
fi

