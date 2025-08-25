import { NextRequest, NextResponse } from "next/server";

// Configuration de sécurité
const SECURITY_CONFIG = {
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

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requêtes par fenêtre
    skipPaths: ["/api/health", "/_next", "/favicon.ico"],
  },

  // Protection CSRF
  csrf: {
    enabled: true,
    tokenHeader: "X-CSRF-Token",
  },
};

// Store pour le rate limiting (en production, utiliser Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Fonction de rate limiting
function checkRateLimit(ip: string, path: string): boolean {
  const now = Date.now();
  const key = `${ip}:${path}`;
  const windowMs = SECURITY_CONFIG.rateLimit.windowMs;

  // Vérifier si le chemin doit être ignoré
  if (
    SECURITY_CONFIG.rateLimit.skipPaths.some((skipPath) =>
      path.startsWith(skipPath)
    )
  ) {
    return true;
  }

  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    // Nouvelle fenêtre ou fenêtre expirée
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (current.count >= SECURITY_CONFIG.rateLimit.maxRequests) {
    return false; // Rate limit dépassé
  }

  current.count++;
  return true;
}

// Fonction de validation CSRF
function validateCSRFToken(request: NextRequest): boolean {
  if (!SECURITY_CONFIG.csrf.enabled) return true;

  // Ignorer les méthodes GET et HEAD
  if (["GET", "HEAD"].includes(request.method)) return true;

  const token = request.headers.get(SECURITY_CONFIG.csrf.tokenHeader);
  const sessionToken = request.cookies.get("next-auth.csrf-token")?.value;

  // En production, implémenter une validation plus robuste
  return !!token && !!sessionToken;
}

// Fonction de sanitisation des headers
function sanitizeHeaders(headers: Headers): Headers {
  const sanitized = new Headers(headers);

  // Supprimer les headers sensibles
  const sensitiveHeaders = [
    "x-forwarded-for",
    "x-real-ip",
    "x-forwarded-proto",
    "x-forwarded-host",
  ];

  sensitiveHeaders.forEach((header) => {
    sanitized.delete(header);
  });

  return sanitized;
}

// Middleware principal de sécurité
export function securityMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // 1. Rate limiting
  if (!checkRateLimit(ip, pathname)) {
    return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Validation CSRF
  if (!validateCSRFToken(request)) {
    return new NextResponse(JSON.stringify({ error: "Invalid CSRF token" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Protection contre les attaques par injection
  const userAgent = request.headers.get("user-agent") || "";
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /document\./i,
    /window\./i,
  ];

  if (suspiciousPatterns.some((pattern) => pattern.test(userAgent))) {
    return new NextResponse(
      JSON.stringify({ error: "Suspicious request detected" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 4. Protection contre les attaques par path traversal
  if (pathname.includes("..") || pathname.includes("~")) {
    return new NextResponse(JSON.stringify({ error: "Invalid path" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null; // Continuer le traitement normal
}

// Fonction pour ajouter les headers de sécurité
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_CONFIG.headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Fonction pour nettoyer le store de rate limiting (appeler périodiquement)
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Nettoyer le store toutes les 15 minutes
if (typeof window === "undefined") {
  setInterval(cleanupRateLimitStore, 15 * 60 * 1000);
}
