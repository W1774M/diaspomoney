#!/usr/bin/env node

// Script de vérification des clés secrètes DiaspoMoney
// Usage: tsx scripts/check-secrets.ts

import crypto from "crypto";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env.local") });

console.log("🔐 Vérification des clés secrètes DiaspoMoney");
console.log("============================================");
console.log("");

// Vérifier les variables d'environnement
const requiredSecrets: string[] = [
  "JWT_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "MONGODB_URI",
];

const missingSecrets: string[] = [];
const configuredSecrets: string[] = [];

requiredSecrets.forEach((secret: string) => {
  if (process.env[secret]) {
    configuredSecrets.push(secret);
    console.log(`✅ ${secret}: Configuré`);
  } else {
    missingSecrets.push(secret);
    console.log(`❌ ${secret}: Manquant`);
  }
});

console.log("");

if (missingSecrets.length > 0) {
  console.log("⚠️  Variables manquantes détectées !");
  console.log("");
  console.log("📝 Ajoutez ces variables dans votre fichier .env.local :");
  console.log("");

  if (!process.env.JWT_SECRET) {
    console.log(`JWT_SECRET=${crypto.randomBytes(64).toString("hex")}`);
  }

  if (!process.env.NEXTAUTH_SECRET) {
    console.log(`NEXTAUTH_SECRET=${crypto.randomBytes(32).toString("base64")}`);
  }

  if (!process.env.NEXTAUTH_URL) {
    console.log("NEXTAUTH_URL=http://localhost:3000");
  }

  if (!process.env.MONGODB_URI) {
    console.log(
      "MONGODB_URI=mongodb://diaspomoney_user:diaspomoney_app_password@localhost:27017/diaspomoney"
    );
  }

  console.log("");
  process.exit(1);
}

// Vérifier la sécurité des clés
console.log("🔍 Vérification de la sécurité des clés...");
console.log("");

const jwtSecret: string = process.env.JWT_SECRET!;
const nextAuthSecret: string = process.env.NEXTAUTH_SECRET!;

const warnings: string[] = [];

// Vérifier la longueur des clés
if (jwtSecret.length < 32) {
  warnings.push("JWT_SECRET est trop court (minimum 32 caractères)");
}

if (nextAuthSecret.length < 32) {
  warnings.push("NEXTAUTH_SECRET est trop court (minimum 32 caractères)");
}

// Vérifier la complexité des clés
if (!/[a-f0-9]{64,}/.test(jwtSecret)) {
  warnings.push(
    "JWT_SECRET devrait être une chaîne hexadécimale de 64+ caractères"
  );
}

if (!/[A-Za-z0-9+/]{32,}={0,2}/.test(nextAuthSecret)) {
  warnings.push(
    "NEXTAUTH_SECRET devrait être une chaîne base64 de 32+ caractères"
  );
}

if (warnings.length > 0) {
  console.log("⚠️  Problèmes de sécurité détectés :");
  warnings.forEach((warning: string) => console.log(`   • ${warning}`));
  console.log("");
  console.log("🔄 Pour générer de nouvelles clés sécurisées :");
  console.log(
    "   node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  );
  console.log(
    "   node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
  );
  console.log("");
} else {
  console.log("✅ Toutes les clés secrètes sont sécurisées");
}

// Vérifier la configuration MongoDB
console.log("");
console.log("🗄️  Vérification de la configuration MongoDB...");

const mongoUri: string | undefined = process.env.MONGODB_URI;
if (mongoUri && mongoUri.includes("localhost:27017")) {
  console.log("✅ Configuration MongoDB locale détectée");
  console.log(
    "💡 Assurez-vous que Docker est démarré avec : docker-compose up -d"
  );
} else if (mongoUri) {
  console.log("✅ Configuration MongoDB externe détectée");
} else {
  console.log("❌ Configuration MongoDB manquante");
}

console.log("");
console.log("🎉 Vérification terminée !");
console.log("");
console.log("📋 Prochaines étapes :");
console.log("   1. Démarrer Docker : docker-compose up -d");
console.log("   2. Démarrer l'application : npm run dev");
console.log("   3. Accéder à l'application : http://localhost:3000");
console.log("   4. Accéder à Mongo Express : http://localhost:8081");
