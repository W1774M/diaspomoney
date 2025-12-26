/**
 * Setup MongoDB réel pour les tests (BDD dédiée).
 * - Se connecte une seule fois pour toute la suite
 * - Nettoie les collections après chaque test (isolation)
 *
 * Requiert un MongoDB accessible via MONGODB_URI.
 * Par défaut: mongodb://127.0.0.1:27018/diaspomoney_test
 */

import { afterAll, afterEach, beforeAll } from 'vitest';
import { MongoClient } from 'mongodb';

const DEFAULT_URI = 'mongodb://127.0.0.1:27018/diaspomoney_test';

function normalizeMongoUri(uri: string) {
  // En tests, on force toujours localhost pour éviter les hostnames Docker (ex: mongodb)
  // qui ne sont pas résolvables hors réseau Docker.
  const host = '127.0.0.1';

  let out = uri
    .replaceAll('${mongo_host}', host)
    .replaceAll('${MONGO_HOST}', host)
    .replaceAll('${mongodb_host}', host)
    .replaceAll('${MONGODB_HOST}', host);

  // Si le shell a chargé `env.example`, on se retrouve souvent avec `mongodb` (hostname Docker).
  // Hors réseau Docker, ça casse avec EAI_AGAIN. En tests, on force vers localhost:27018.
  out = out
    .replace('mongodb://mongodb:27017', 'mongodb://127.0.0.1:27018')
    .replace('mongodb://mongodb_test:27017', 'mongodb://127.0.0.1:27018')
    .replace('@mongodb:27017', '@127.0.0.1:27018')
    .replace('@mongodb_test:27017', '@127.0.0.1:27018')
    .replace('//mongodb/', '//127.0.0.1:27018/')
    .replace('//mongodb_test/', '//127.0.0.1:27018/');

  return out;
}

// Forcer l'hôte local + URI de test (ne pas hériter de l'env dev/prod)
process.env['MONGO_HOST'] = '127.0.0.1';
process.env['MONGODB_HOST'] = '127.0.0.1';
process.env['MONGODB_URI'] = normalizeMongoUri(process.env['MONGODB_URI'] || DEFAULT_URI);
process.env['MONGODB_DB'] = process.env['MONGODB_DB'] || 'diaspomoney_test';

let client: MongoClient | null = null;

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function connectWithRetry(uri: string) {
  const maxAttempts = 30; // ~30-45s selon backoff
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const c = new MongoClient(uri, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
        socketTimeoutMS: 10000,
      });
      await c.connect();
      return c;
    } catch (e) {
      lastError = e;
      // Backoff léger, compatible docker compose --wait
      await sleep(Math.min(1500, 250 + attempt * 100));
    }
  }

  const msg = lastError instanceof Error ? lastError.message : 'Erreur inconnue';
  throw new Error(msg);
}

beforeAll(async () => {
  const uri = process.env['MONGODB_URI'] || DEFAULT_URI;
  try {
    client = await connectWithRetry(uri);
    (globalThis as any).__DIASPOMONEY_TEST_MONGO__ = client;
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : 'Erreur inconnue';
    throw new Error(
      `Impossible de se connecter à MongoDB pour les tests.\n` +
        `- MONGODB_URI=${uri}\n` +
        `- Démarre la DB avec: pnpm -s test:db:up\n` +
        `- Détails: ${msg}`,
    );
  }
});

afterEach(async () => {
  if (!client) return;
  const db = client.db(process.env['MONGODB_DB']);
  const collections = await db.collections();
  await Promise.all(
    collections
      .filter((c) => !c.collectionName.startsWith('system.'))
      .map((c) => c.deleteMany({})),
  );
});

afterAll(async () => {
  if (client) {
    await client.close();
    client = null;
  }
});


