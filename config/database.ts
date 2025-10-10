import mongoose from "mongoose";

// Configuration de la base de données MongoDB
export const databaseConfig = {
  url:
    process.env["MONGODB_URI"] ||
    "mongodb://admin:admin123@localhost:27017/diaspomoney?authSource=admin",
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
  },
};

// Fonction de connexion à MongoDB
export const connectDatabase = async (): Promise<void> => {
  // Ne jamais exécuter côté client
  if (typeof window !== "undefined") {
    console.warn("⚠️ Tentative de connexion MongoDB côté client ignorée");
    return;
  }

  try {
    await mongoose.connect(databaseConfig.url, databaseConfig.options);
    console.log("✅ Connexion MongoDB établie avec succès");
  } catch (error) {
    console.error("❌ Erreur de connexion MongoDB:", error);
    process.exit(1);
  }
};

// Fonction de déconnexion
export const disconnectDatabase = async (): Promise<void> => {
  // Ne jamais exécuter côté client
  if (typeof window !== "undefined") {
    return;
  }

  try {
    await mongoose.disconnect();
    console.log("✅ Déconnexion MongoDB réussie");
  } catch (error) {
    console.error("❌ Erreur de déconnexion MongoDB:", error);
  }
};

// Initialisation des événements MongoDB (côté serveur uniquement)
const initializeMongoEvents = () => {
  if (typeof window !== "undefined") {
    return; // Ne jamais exécuter côté client
  }

  // Gestion des événements de connexion
  mongoose.connection.on("connected", () => {
    console.log("🔗 MongoDB connecté");
  });

  mongoose.connection.on("error", err => {
    console.error("❌ Erreur MongoDB:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("🔌 MongoDB déconnecté");
  });

  // Gestion propre de la fermeture
  process.on("SIGINT", async () => {
    await disconnectDatabase();
    process.exit(0);
  });
};

// Initialiser les événements seulement côté serveur
if (typeof window === "undefined") {
  initializeMongoEvents();
}
