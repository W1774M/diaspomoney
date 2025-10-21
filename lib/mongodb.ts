import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

if (!process.env['MONGODB_URI']) {
  // En mode build, utiliser une URI par défaut pour éviter l'erreur
  if (
    process.env.NODE_ENV === 'production' &&
    process.env['NEXT_PHASE'] === 'phase-production-build'
  ) {
    console.warn('MONGODB_URI not set during build, using placeholder');
    process.env['MONGODB_URI'] = 'mongodb://localhost:27017/diaspomoney';
  } else {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }
}

const uri = process.env['MONGODB_URI'];

// Configuration optimisée pour éviter les timeouts
const options = {
  maxPoolSize: 10, // Maximum de connexions dans le pool
  serverSelectionTimeoutMS: 5000, // Timeout pour la sélection du serveur
  socketTimeoutMS: 45000, // Timeout pour les opérations socket
  connectTimeoutMS: 10000, // Timeout pour la connexion initiale
  maxIdleTimeMS: 30000, // Temps maximum d'inactivité avant fermeture
  bufferCommands: false, // Désactiver le buffering des commandes
};

// ============================================================================
// MONGODB NATIVE CLIENT (pour les opérations directes)
// ============================================================================

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export const mongoClient = clientPromise;

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
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxIdleTimeMS: 30000,
    };

    cached.promise = mongoose.connect(uri, opts).then(mongoose => {
      return mongoose;
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
