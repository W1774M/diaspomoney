// Configuration des clés secrètes pour DiaspoMoney
// ⚠️ ATTENTION : Ne jamais commiter ce fichier en production
// Utilisez des variables d'environnement pour la production

export const secretsConfig = {
  // Clé secrète pour JWT (JSON Web Tokens)
  JWT_SECRET:
    process.env.JWT_SECRET ||
    "74c594724999427fc22bd6d1cf4c248cb2852b04f1c7c495396ec40b475dd89cd0bc653348455ee541f2a48dcc33da70f09f1198c9c606df58bb4502b7c7d8fe",

  // Clé secrète pour NextAuth
  NEXTAUTH_SECRET:
    process.env.NEXTAUTH_SECRET ||
    "jcysskuV8K4D7pff8a6uAXCC4ui0vRTk5fLbD3+7PiI=",

  // URL de base pour NextAuth
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",

  // Configuration de sécurité
  security: {
    // Durée de vie des tokens JWT (en secondes)
    jwtExpiresIn: 30 * 24 * 60 * 60, // 30 jours

    // Durée de vie des sessions NextAuth (en secondes)
    sessionMaxAge: 30 * 24 * 60 * 60, // 30 jours

    // Algorithme de signature JWT
    jwtAlgorithm: "HS256" as const,

    // Émetteur des tokens JWT
    jwtIssuer: "diaspomoney",

    // Audience des tokens JWT
    jwtAudience: "diaspomoney-users",
  },

  // Configuration des cookies
  cookies: {
    // Nom du cookie de session
    sessionToken: "next-auth.session-token",

    // Nom du cookie CSRF
    csrfToken: "next-auth.csrf-token",

    // Nom du cookie de callback
    callbackUrl: "next-auth.callback-url",

    // Nom du cookie PKCE
    pkceCodeVerifier: "next-auth.pkce.code_verifier",
  },
};

// Validation des clés secrètes
export const validateSecrets = (): void => {
  const requiredSecrets = ["JWT_SECRET", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];

  const missingSecrets = requiredSecrets.filter(
    (secret) => !process.env[secret]
  );

  if (missingSecrets.length > 0) {
    console.warn(
      `⚠️ Variables d'environnement manquantes: ${missingSecrets.join(", ")}`
    );
    console.warn(
      "🔑 Utilisation des clés par défaut (non sécurisées pour la production)"
    );
  } else {
    console.log("✅ Toutes les clés secrètes sont configurées");
  }
};

// Génération de nouvelles clés secrètes
export const generateNewSecrets = (): void => {
  const crypto = require("crypto");

  console.log("🔑 Génération de nouvelles clés secrètes...");
  console.log("");
  console.log("JWT_SECRET=" + crypto.randomBytes(64).toString("hex"));
  console.log("NEXTAUTH_SECRET=" + crypto.randomBytes(32).toString("base64"));
  console.log("");
  console.log("📝 Copiez ces clés dans votre fichier .env.local");
};

// Vérification de la sécurité des clés
export const checkSecretsSecurity = (): void => {
  const jwtSecret = process.env.JWT_SECRET || secretsConfig.JWT_SECRET;
  const nextAuthSecret =
    process.env.NEXTAUTH_SECRET || secretsConfig.NEXTAUTH_SECRET;

  const warnings = [];

  // Vérifier la longueur des clés
  if (jwtSecret.length < 32) {
    warnings.push("JWT_SECRET est trop court (minimum 32 caractères)");
  }

  if (nextAuthSecret.length < 32) {
    warnings.push("NEXTAUTH_SECRET est trop court (minimum 32 caractères)");
  }

  // Vérifier si ce sont les clés par défaut
  if (jwtSecret === secretsConfig.JWT_SECRET) {
    warnings.push(
      "JWT_SECRET utilise la clé par défaut (non sécurisée pour la production)"
    );
  }

  if (nextAuthSecret === secretsConfig.NEXTAUTH_SECRET) {
    warnings.push(
      "NEXTAUTH_SECRET utilise la clé par défaut (non sécurisée pour la production)"
    );
  }

  if (warnings.length > 0) {
    console.warn("⚠️ Problèmes de sécurité détectés:");
    warnings.forEach((warning) => console.warn(`   • ${warning}`));
  } else {
    console.log("✅ Configuration des clés secrètes sécurisée");
  }
};
