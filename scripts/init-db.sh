#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$PROJECT_DIR/docker"

echo "🧰 DiaspoMoney - Initialisation de la base (local)"

# Start docker services if not running
if ! docker ps --format '{{.Names}}' | grep -q '^mongodb$'; then
	echo "🐳 Démarrage des services Docker..."
	cd "$DOCKER_DIR" && docker-compose -f docker-compose.yml up -d mongodb mongo-express
fi

# Wait for mongodb to be healthy
echo "⏳ Attente de MongoDB..."
for i in {1..30}; do
	if docker ps --format '{{.Names}} {{.Status}}' | grep -q '^mongodb .* (healthy)'; then
		echo "✅ MongoDB est prêt"
		break
	fi
	sleep 2
	echo "."
	if [ "$i" -eq 30 ]; then
		echo "❌ MongoDB n'est pas prêt après attente"
		exit 1
	fi
done

# Charger les variables d'environnement (.env) si présentes
if [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$PROJECT_DIR/.env"
    set +a
fi

# Déterminer l'URI MongoDB
MONGODB_URI_EFFECTIVE="${MONGODB_URI:-mongodb://admin:admin123@localhost:27017/diaspomoney?authSource=admin}"
echo "🔗 Utilisation de l'URI: $MONGODB_URI_EFFECTIVE"

# Créer un script Node.js simple qui lit les mocks et les insère
TMP_JS="$SCRIPT_DIR/.tmp_seed_mocks.js"
cat > "$TMP_JS" << 'EOF'
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Lire le fichier mocks/index.ts et extraire les données
const mocksPath = path.join(__dirname, '..', 'mocks', 'index.ts');
const mocksContent = fs.readFileSync(mocksPath, 'utf8');

// Supprimer le TS (comments, "as Type", "as const") pour rendre le contenu évaluable en JS
const sanitizeTsToJs = (raw) => {
  let s = raw;
  // Remove block comments and line comments
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/(^|\s)\/\/.*$/gm, '$1');
  // Remove "as const" and "as Type..." assertions
  s = s.replace(/\s+as\s+const/g, '');
  s = s.replace(/\s+as\s+[A-Za-z0-9_<>\[{\]}.:,\s]+/g, '');
  return s;
};

// Extraire les données des mocks de manière robuste: trouve '=' puis le tableau
const extractMockData = (content, exportName) => {
  console.log(`🔍 Extracting ${exportName}...`);
  const exported = new RegExp(`export\\s+const\\s+${exportName}\\b`, 'g');
  const m = exported.exec(content);
  if (!m) {
    console.warn(`❌ Could not find declaration for ${exportName}`);
    return [];
  }
  // Positionner après le symbole '=' suivant
  let i = m.index;
  const len = content.length;
  let eqIdx = -1;
  while (i < len) {
    if (content[i] === '=') { eqIdx = i; break; }
    i++;
  }
  if (eqIdx === -1) {
    console.warn(`❌ Could not find '=' for ${exportName}`);
    return [];
  }
  // Avancer jusqu'au premier '['
  i = eqIdx + 1;
  while (i < len && /\s/.test(content[i])) i++;
  if (content[i] !== '[') {
    // chercher le prochain '[' raisonnablement proche
    const nextBracket = content.indexOf('[', i);
    if (nextBracket === -1) {
      console.warn(`❌ Could not find '[' for ${exportName}`);
      return [];
    }
    i = nextBracket;
  }
  // Compter les crochets jusqu'à fermer le tableau
  let bracketCount = 1;
  let j = i + 1;
  while (j < len && bracketCount > 0) {
    const ch = content[j];
    if (ch === '[') bracketCount++;
    else if (ch === ']') bracketCount--;
    j++;
  }
  if (bracketCount !== 0) {
    console.warn(`❌ Unbalanced brackets for ${exportName}`);
    return [];
  }
  const inside = content.slice(i + 1, j - 1);
  const cleaned = sanitizeTsToJs(inside);
  console.log(`📝 Extracted ${cleaned.length} chars for ${exportName}`);
  try {
    const data = eval(`[${cleaned}]`);
    console.log(`✅ Parsed ${data.length} ${exportName}`);
    return data;
  } catch (e) {
    console.warn(`❌ Could not eval ${exportName}: ${e.message}`);
    return [];
  }
};

let MOCK_USERS = extractMockData(mocksContent, 'MOCK_USERS');
const MOCK_APPOINTMENTS = extractMockData(mocksContent, 'MOCK_APPOINTMENTS');
const MOCK_INVOICES = extractMockData(mocksContent, 'MOCK_INVOICES');
const MOCK_SPECIALITIES = extractMockData(mocksContent, 'MOCK_SPECIALITIES');
const MOCK_PARTNERS = extractMockData(mocksContent, 'MOCK_PARTNERS');

// Fallback: si parsing des users échoue, essayer tests/fixtures/users.json
try {
  if (!Array.isArray(MOCK_USERS) || MOCK_USERS.length === 0) {
    const fallbackUsersPath = path.join(__dirname, '..', 'tests', 'fixtures', 'users.json');
    if (fs.existsSync(fallbackUsersPath)) {
      const raw = fs.readFileSync(fallbackUsersPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`🛟 Fallback users from tests/fixtures/users.json: ${parsed.length}`);
        MOCK_USERS = parsed;
      }
    }
  }
} catch (_) {}

function getDbNameFromUri(uri) {
  try {
    const afterSlash = uri.split('/').pop() || '';
    const name = (afterSlash.split('?')[0] || 'diaspomoney').trim();
    return name || 'diaspomoney';
  } catch {
    return 'diaspomoney';
  }
}

async function upsertMany(col, docs, keys) {
  let matched = 0;
  let upserted = 0;
  for (const doc of docs) {
    const filter = {};
    for (const k of keys) if (doc[k] != null) filter[k] = doc[k];
    if (Object.keys(filter).length === 0) filter['_id'] = doc['_id'] ?? doc['id'] ?? undefined;
    const res = await col.updateOne(filter, { $set: doc }, { upsert: true });
    if (res.matchedCount) matched += 1;
    if (res.upsertedCount) upserted += 1;
  }
  return { matched, upserted };
}

(async () => {
  const uri = process.env.MONGODB_URI_EFFECTIVE;
  const client = new MongoClient(uri);
  console.log('📦 Seeding depuis mocks/index.ts');
  await client.connect();
  const db = client.db(getDbNameFromUri(uri));

  const usersCol = db.collection('users');
  const apptsCol = db.collection('appointments');
  const invoicesCol = db.collection('invoices');
  const specsCol = db.collection('specialities');
  const partnersCol = db.collection('partners');

  await Promise.all([
    usersCol.createIndex({ email: 1 }, { unique: true }).catch(() => {}),
    apptsCol.createIndex({ userId: 1 }).catch(() => {}),
    apptsCol.createIndex({ providerId: 1 }).catch(() => {}),
    invoicesCol.createIndex({ invoiceNumber: 1 }, { unique: true }).catch(() => {}),
    specsCol.createIndex({ name: 1 }, { unique: true }).catch(() => {}),
    partnersCol.createIndex({ id: 1 }, { unique: true }).catch(() => {}),
  ]);

  const r1 = await upsertMany(usersCol, MOCK_USERS, ['_id', 'email', 'id']);
  console.log(`👤 users ⇒ matched ${r1.matched}, upserted ${r1.upserted}`);

  const r2 = await upsertMany(apptsCol, MOCK_APPOINTMENTS, ['_id', 'reservationNumber', 'id']);
  console.log(`🗓 appointments ⇒ matched ${r2.matched}, upserted ${r2.upserted}`);

  const r3 = await upsertMany(invoicesCol, MOCK_INVOICES, ['_id', 'invoiceNumber', 'id']);
  console.log(`🧾 invoices ⇒ matched ${r3.matched}, upserted ${r3.upserted}`);

  const r4 = await upsertMany(specsCol, MOCK_SPECIALITIES, ['_id', 'name', 'id']);
  console.log(`🏷  specialities ⇒ matched ${r4.matched}, upserted ${r4.upserted}`);

  const r5 = await upsertMany(partnersCol, MOCK_PARTNERS, ['id', 'name']);
  console.log(`🤝 partners ⇒ matched ${r5.matched}, upserted ${r5.upserted}`);

  await client.close();
  console.log('✅ Seed terminé');
})();
EOF

# Exécuter le seeder JavaScript
echo "🌱 Insertion des données depuis mocks/index.ts"
MONGODB_URI_EFFECTIVE="$MONGODB_URI_EFFECTIVE" node "$TMP_JS"

# Nettoyage
rm -f "$TMP_JS"

echo "🎉 Initialisation terminée"
