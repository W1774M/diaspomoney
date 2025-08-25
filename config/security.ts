// Configuration de sécurité centralisée
export const SECURITY_CONFIG = {
  // Validation des mots de passe
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true,
    commonPasswords: [
      "password",
      "123456",
      "123456789",
      "qwerty",
      "abc123",
      "password123",
      "admin",
      "letmein",
      "welcome",
      "monkey",
    ],
  },

  // Rate limiting
  rateLimit: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5,
      blockDuration: 30 * 60 * 1000, // 30 minutes
    },
    register: {
      windowMs: 60 * 60 * 1000, // 1 heure
      maxAttempts: 3,
      blockDuration: 60 * 60 * 1000, // 1 heure
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 heure
      maxAttempts: 3,
      blockDuration: 60 * 60 * 1000, // 1 heure
    },
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      blockDuration: 30 * 60 * 1000, // 30 minutes
    },
  },

  // Sessions
  session: {
    maxSessionsPerUser: 5,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 heures
    refreshTokenTimeout: 7 * 24 * 60 * 60 * 1000, // 7 jours
    secure: true, // HTTPS only
    httpOnly: true,
    sameSite: "strict" as const,
  },

  // Headers de sécurité
  headers: {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://accounts.google.com",
      "frame-src 'self' https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },

  // Validation des données
  validation: {
    maxStringLength: 1000,
    maxEmailLength: 254,
    maxPhoneLength: 20,
    maxNameLength: 50,
    allowedFileTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },

  // Protection CSRF
  csrf: {
    enabled: true,
    tokenLength: 64,
    tokenExpiry: 60 * 60 * 1000, // 1 heure
  },

  // Captcha
  captcha: {
    enabled: true,
    maxAttempts: 3,
    showAfterFailedAttempts: 2,
  },

  // Logging de sécurité
  logging: {
    enabled: true,
    logLevel: "warn" as const, // "debug" | "info" | "warn" | "error"
    logFailedLogins: true,
    logSuspiciousActivity: true,
    logRateLimitViolations: true,
  },

  // Environnement
  environment: {
    isProduction: process.env.NODE_ENV === "production",
    isDevelopment: process.env.NODE_ENV === "development",
    isTest: process.env.NODE_ENV === "test",
  },
};

// Fonctions utilitaires de sécurité
export const SecurityUtils = {
  // Vérifier si un mot de passe est dans la liste des mots de passe communs
  isCommonPassword: (password: string): boolean => {
    return SECURITY_CONFIG.password.commonPasswords.includes(
      password.toLowerCase()
    );
  },

  // Générer un message d'erreur de sécurité générique
  getGenericError: (): string => {
    return "Une erreur s'est produite. Veuillez réessayer plus tard.";
  },

  // Masquer les données sensibles dans les logs
  maskSensitiveData: (data: string): string => {
    if (!data) return data;
    if (data.length <= 4) return "*".repeat(data.length);
    return (
      data.substring(0, 2) +
      "*".repeat(data.length - 4) +
      data.substring(data.length - 2)
    );
  },

  // Valider une URL
  isValidUrl: (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  // Nettoyer une chaîne de caractères
  sanitizeString: (str: string): string => {
    return str
      .trim()
      .replace(/[<>]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .substring(0, SECURITY_CONFIG.validation.maxStringLength);
  },

  // Vérifier si une IP est dans une liste noire
  isBlacklistedIP: (ip: string): boolean => {
    // En production, vérifier contre une base de données ou un service externe
    const blacklistedIPs: string[] = [
      // Ajouter les IPs à bloquer
    ];
    return blacklistedIPs.includes(ip);
  },

  // Générer un hash sécurisé pour les tokens
  generateSecureHash: (data: string): string => {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(data).digest("hex");
  },

  // Valider un token JWT (structure basique)
  isValidJWTStructure: (token: string): boolean => {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    return jwtRegex.test(token);
  },
};

// Types pour la configuration de sécurité
export interface SecurityConfig {
  password: {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventCommonPasswords: boolean;
    commonPasswords: string[];
  };
  rateLimit: {
    login: RateLimitConfig;
    register: RateLimitConfig;
    passwordReset: RateLimitConfig;
    api: RateLimitConfig;
  };
  session: {
    maxSessionsPerUser: number;
    sessionTimeout: number;
    refreshTokenTimeout: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: "strict" | "lax" | "none";
  };
  headers: Record<string, string>;
  validation: {
    maxStringLength: number;
    maxEmailLength: number;
    maxPhoneLength: number;
    maxNameLength: number;
    allowedFileTypes: string[];
    maxFileSize: number;
  };
  csrf: {
    enabled: boolean;
    tokenLength: number;
    tokenExpiry: number;
  };
  captcha: {
    enabled: boolean;
    maxAttempts: number;
    showAfterFailedAttempts: number;
  };
  logging: {
    enabled: boolean;
    logLevel: "debug" | "info" | "warn" | "error";
    logFailedLogins: boolean;
    logSuspiciousActivity: boolean;
    logRateLimitViolations: boolean;
  };
  environment: {
    isProduction: boolean;
    isDevelopment: boolean;
    isTest: boolean;
  };
}

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDuration: number;
}
