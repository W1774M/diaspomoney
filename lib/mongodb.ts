import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import { config } from '@/config/app.config';
import { logger } from '@/lib/logger';

// Détecter si on est en mode build
const isBuildTime = process.env['NEXT_PHASE'] === 'phase-production-build' || 
                     process.env['NEXT_PHASE'] === 'phase-development-build';

// Obtenir l'URI MongoDB depuis la configuration centralisée
let uri: string;
if (!process.env['MONGODB_URI']) {
  // En mode build, utiliser une URI par défaut pour éviter l'erreur
  if (isBuildTime) {
    logger.warn(
      'MONGODB_URI not set during build, using placeholder' +
        ` (MONGODB_URI=${process.env['MONGODB_URI'] || 'mongodb://localhost:27017/diaspomoney'}, NEXT_PHASE=${process.env['NEXT_PHASE'] || 'unknown'})`,
    );
    uri = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/diaspomoney';
  } else {
    // Utiliser la configuration centralisée
    uri = config.database.uri;
  }
} else {
  uri = process.env['MONGODB_URI'];
}

// Configuration optimisée pour éviter les timeouts
// Utiliser les valeurs de la configuration centralisée avec des valeurs par défaut
const dbOptions = config.database.options || {};
const options = {
  maxPoolSize: dbOptions['maxPoolSize'] || 10,
  serverSelectionTimeoutMS: dbOptions['serverSelectionTimeoutMS'] || 10000, // Augmenté à 10s pour Kubernetes
  socketTimeoutMS: dbOptions['socketTimeoutMS'] || 45000,
  connectTimeoutMS: dbOptions['connectTimeoutMS'] || 10000, // Utiliser la config ou 10s par défaut
  maxIdleTimeMS: 30000, // Temps maximum d'inactivité avant fermeture
};

// ============================================================================
// MONGODB NATIVE CLIENT (pour les opérations directes)
// ============================================================================

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

function getMongoClientPromise(): Promise<MongoClient> {
  // Pendant le build, retourner une promesse qui ne se connecte jamais
  if (isBuildTime) {
    return Promise.reject(new Error('MongoDB connection not available during build time'));
  }

  if (clientPromise) {
    return clientPromise;
  }

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient> | undefined;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect().catch(err => {
        // En cas d'erreur, nettoyer la promesse pour permettre une nouvelle tentative
        delete globalWithMongo._mongoClientPromise;
        throw err;
      });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
    clientPromise = client.connect().catch(err => {
      // En cas d'erreur, nettoyer la promesse pour permettre une nouvelle tentative
      clientPromise = null;
      throw err;
    });
  }

  return clientPromise;
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
// La connexion est lazy : elle ne se fait que quand elle est demandée
// Pendant le build, exporter une promesse qui ne se connecte jamais
export const mongoClient = isBuildTime 
  ? Promise.reject(new Error('MongoDB connection not available during build time')) as Promise<MongoClient>
  : getMongoClientPromise();

// ============================================================================
// MONGOOSE CONNECTION (pour les modèles Mongoose)
// ============================================================================

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // Pendant le build, ne pas essayer de se connecter
  if (isBuildTime) {
    throw new Error('MongoDB connection not available during build time');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // Utiliser la configuration centralisée pour Mongoose
    const dbOptions = config.database.options || {};
    const opts = {
      bufferCommands: false,
      maxPoolSize: dbOptions['maxPoolSize'] || 10,
      serverSelectionTimeoutMS: dbOptions['serverSelectionTimeoutMS'] || 10000, // Augmenté à 10s pour Kubernetes
      socketTimeoutMS: dbOptions['socketTimeoutMS'] || 45000,
      connectTimeoutMS: dbOptions['connectTimeoutMS'] || 10000, // Utiliser la config ou 10s par défaut
      maxIdleTimeMS: 30000,
    };

    cached.promise = mongoose.connect(uri, opts).then(mongoose => {
      return mongoose;
    }).catch(err => {
      // En cas d'erreur, nettoyer la promesse pour permettre une nouvelle tentative
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get database instance
 */
export async function getDatabase() {
  const client = await mongoClient;
  return client.db();
}

/**
 * Get collection
 */
export async function getCollection(collectionName: string) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

/**
 * Close database connection
 */
export async function closeConnection() {
  const client = await mongoClient;
  await client.close();
  if (cached.conn) {
    await cached.conn.disconnect();
  }
}
