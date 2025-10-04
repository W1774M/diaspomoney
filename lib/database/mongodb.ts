import { Db, MongoClient } from "mongodb";

// Configuration MongoDB
const MONGODB_URI = process.env["MONGODB_URI"] || "mongodb://localhost:27017";
const MONGODB_DB = process.env["MONGODB_DB"] || "diaspomoney";

// Client MongoDB global
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

// Fonction pour obtenir le client MongoDB
export async function getMongoClient(): Promise<MongoClient> {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
  }
  return mongoClient;
}

// Fonction pour obtenir la base de données
export async function getMongoDb(): Promise<Db> {
  if (!mongoDb) {
    const client = await getMongoClient();
    mongoDb = client.db(MONGODB_DB);
  }
  return mongoDb;
}

// Fonction pour fermer la connexion
export async function closeMongoConnection(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    mongoDb = null;
  }
}

// Export du client pour compatibilité
export { mongoClient };
