import cache from "@/lib/cache/redis";
import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

// Configuration des rate limits
export const rateLimits = {
  // API général (100 requêtes par 15 minutes)
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: "Trop de requêtes API, réessayez dans 15 minutes",
  },

  // Authentification (5 tentatives par 15 minutes)
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Trop de tentatives de connexion, réessayez dans 15 minutes",
    skipSuccessfulRequests: true,
  },

  // Inscription (3 tentatives par heure)
  registration: {
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 3,
    message: "Trop de tentatives d'inscription, réessayez dans 1 heure",
  },

  // Mot de passe oublié (3 tentatives par heure)
  forgotPassword: {
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: "Trop de tentatives de réinitialisation, réessayez dans 1 heure",
  },

  // Upload de fichiers (10 uploads par heure)
  upload: {
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: "Trop d'uploads, réessayez dans 1 heure",
  },

  // Recherche (50 recherches par 5 minutes)
  search: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50,
    message: "Trop de recherches, réessayez dans 5 minutes",
  },
};

// Fonction pour générer une clé de rate limit
function generateKey(req: NextRequest, config: RateLimitConfig): string {
  const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  if (config.keyGenerator) {
    return config.keyGenerator(req);
  }

  return `rate_limit:${ip}:${userAgent}`;
}

// Fonction principale de rate limiting
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<{
  success: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
}> {
  const key = generateKey(req, config);
  const now = Date.now();

  try {
    // Récupérer les données actuelles
    const current = await cache.get(key);
    const data = current
      ? JSON.parse(current)
      : { count: 0, resetTime: now + config.windowMs };

    // Vérifier si la fenêtre de temps est expirée
    if (now > data.resetTime) {
      data.count = 0;
      data.resetTime = now + config.windowMs;
    }

    // Incrémenter le compteur
    data.count++;

    // Vérifier si la limite est dépassée
    if (data.count > config.max) {
      return {
        success: false,
        remaining: Math.max(0, config.max - data.count),
        resetTime: data.resetTime,
        message: config.message,
      };
    }

    // Sauvegarder les nouvelles données
    await cache.set(
      key,
      JSON.stringify(data),
      "EX",
      Math.ceil((data.resetTime - now) / 1000)
    );

    return {
      success: true,
      remaining: config.max - data.count,
      resetTime: data.resetTime,
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    // En cas d'erreur, autoriser la requête
    return {
      success: true,
      remaining: config.max,
      resetTime: now + config.windowMs,
    };
  }
}

// Middleware pour les routes API
export async function withRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const result = await rateLimit(req, config);

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.message,
        remaining: result.remaining,
        resetTime: result.resetTime,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": config.max.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.resetTime.toString(),
          "Retry-After": Math.ceil(
            (result.resetTime - Date.now()) / 1000
          ).toString(),
        },
      }
    );
  }

  const response = await handler(req);

  // Ajouter les headers de rate limit à la réponse
  response.headers.set("X-RateLimit-Limit", config.max.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.resetTime.toString());

  return response;
}

// Helper pour les routes spécifiques
export const rateLimitHelpers = {
  // Rate limit pour l'authentification
  auth: (
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ) => withRateLimit(req, rateLimits.auth, handler),

  // Rate limit pour l'inscription
  registration: (
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ) => withRateLimit(req, rateLimits.registration, handler),

  // Rate limit pour les API générales
  api: (
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ) => withRateLimit(req, rateLimits.api, handler),

  // Rate limit pour la recherche
  search: (
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ) => withRateLimit(req, rateLimits.search, handler),

  // Rate limit pour les uploads
  upload: (
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ) => withRateLimit(req, rateLimits.upload, handler),
};
