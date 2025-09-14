import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// SECURITY HEADERS
// ============================================================================

export function securityHeaders(): Record<string, string> {
  return {
    // Protection XSS
    "X-XSS-Protection": "1; mode=block",

    // Empêcher le sniffing MIME
    "X-Content-Type-Options": "nosniff",

    // Empêcher le clickjacking
    "X-Frame-Options": "DENY",

    // Politique de sécurité du contenu
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),

    // Référer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions Policy
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
    ].join(", "),

    // Cache Control pour les pages sensibles
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin":
      process.env.NODE_ENV === "production" ? "https://diaspomoney.com" : "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Supprimer les balises HTML
    .replace(/javascript:/gi, "") // Supprimer les protocoles dangereux
    .replace(/on\w+=/gi, ""); // Supprimer les événements JavaScript
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ============================================================================
// TOKEN GENERATION (version temporaire sans nanoid)
// ============================================================================

export function generateToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateSecureToken(): string {
  return generateToken(64);
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Le mot de passe doit contenir au moins 8 caractères");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }

  if (!/\d/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un caractère spécial");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// CSRF PROTECTION
// ============================================================================

export function generateCSRFToken(): string {
  return generateSecureToken();
}

export function validateCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken;
}

// ============================================================================
// MIDDLEWARE UTILITIES
// ============================================================================

export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = { ...securityHeaders(), ...corsHeaders() };

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// ============================================================================
// RATE LIMITING (version temporaire sans rate-limiter-flexible)
// ============================================================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  req: NextRequest
): Promise<NextResponse | null> {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  const current = rateLimitStore.get(ip);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return null;
  }

  if (current.count >= maxRequests) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  current.count++;
  return null;
}

export async function secureRequest(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Rate limiting
  const rateLimitResult = await rateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // Appliquer les headers de sécurité
  const response = await handler();
  return applySecurityHeaders(response);
}
