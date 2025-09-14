import { createHash, randomBytes } from "crypto";

// Configuration de sécurité des sessions
const SESSION_CONFIG = {
  tokenLength: 64,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 heures
  maxSessionsPerUser: 5,
  refreshTokenLength: 128,
};

// Store pour les sessions actives (en production, utiliser Redis)
const activeSessions = new Map<
  string,
  {
    userId: string;
    createdAt: number;
    lastActivity: number;
    ip: string;
    userAgent: string;
  }
>();

// Store pour les tokens de rafraîchissement
const refreshTokens = new Map<
  string,
  {
    userId: string;
    expiresAt: number;
    ip: string;
  }
>();

// Générer un token sécurisé
export function generateSecureToken(
  length: number = SESSION_CONFIG.tokenLength
): string {
  return randomBytes(length).toString("hex");
}

// Générer un hash sécurisé
export function generateHash(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

// Créer une nouvelle session
export function createSession(
  userId: string,
  ip: string,
  userAgent: string
): { sessionId: string; refreshToken: string } {
  const sessionId = generateSecureToken();
  const refreshToken = generateSecureToken(SESSION_CONFIG.refreshTokenLength);
  const now = Date.now();

  // Nettoyer les anciennes sessions de l'utilisateur
  cleanupUserSessions(userId);

  // Vérifier le nombre maximum de sessions
  const userSessions = Array.from(activeSessions.values()).filter(
    session => session.userId === userId
  );

  if (userSessions.length >= SESSION_CONFIG.maxSessionsPerUser) {
    // Supprimer la session la plus ancienne
    const oldestSession = userSessions.reduce((oldest, current) =>
      current.createdAt < oldest.createdAt ? current : oldest
    );
    const oldestSessionId = Array.from(activeSessions.entries()).find(
      ([, session]) => session === oldestSession
    )?.[0];
    if (oldestSessionId) {
      activeSessions.delete(oldestSessionId);
    }
  }

  // Créer la nouvelle session
  activeSessions.set(sessionId, {
    userId,
    createdAt: now,
    lastActivity: now,
    ip,
    userAgent,
  });

  // Créer le token de rafraîchissement
  refreshTokens.set(refreshToken, {
    userId,
    expiresAt: now + SESSION_CONFIG.sessionTimeout,
    ip,
  });

  return { sessionId, refreshToken };
}

// Valider une session
export function validateSession(
  sessionId: string,
  ip: string
): {
  valid: boolean;
  userId?: string;
  error?: string;
} {
  const session = activeSessions.get(sessionId);

  if (!session) {
    return { valid: false, error: "Session invalide" };
  }

  const now = Date.now();

  // Vérifier l'expiration
  if (now - session.lastActivity > SESSION_CONFIG.sessionTimeout) {
    activeSessions.delete(sessionId);
    return { valid: false, error: "Session expirée" };
  }

  // Vérifier l'IP (optionnel, peut être désactivé pour les proxies)
  if (session.ip !== ip) {
    // Log de sécurité
    console.warn(
      `Suspicious session access: expected IP ${session.ip}, got ${ip}`
    );
    // Ne pas bloquer pour l'instant, mais log
  }

  // Mettre à jour l'activité
  session.lastActivity = now;

  return { valid: true, userId: session.userId };
}

// Rafraîchir une session
export function refreshSession(
  refreshToken: string,
  ip: string
): {
  success: boolean;
  sessionId?: string;
  newRefreshToken?: string;
  error?: string;
} {
  const tokenData = refreshTokens.get(refreshToken);

  if (!tokenData) {
    return { success: false, error: "Token de rafraîchissement invalide" };
  }

  const now = Date.now();

  if (now > tokenData.expiresAt) {
    refreshTokens.delete(refreshToken);
    return { success: false, error: "Token de rafraîchissement expiré" };
  }

  // Supprimer l'ancien token
  refreshTokens.delete(refreshToken);

  // Créer une nouvelle session
  const { sessionId, refreshToken: newRefreshToken } = createSession(
    tokenData.userId,
    ip,
    "refreshed" // User agent non disponible lors du rafraîchissement
  );

  return {
    success: true,
    sessionId,
    newRefreshToken,
  };
}

// Supprimer une session
export function destroySession(sessionId: string): boolean {
  return activeSessions.delete(sessionId);
}

// Supprimer toutes les sessions d'un utilisateur
export function destroyUserSessions(userId: string): void {
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.userId === userId) {
      activeSessions.delete(sessionId);
    }
  }

  for (const [refreshToken, tokenData] of refreshTokens.entries()) {
    if (tokenData.userId === userId) {
      refreshTokens.delete(refreshToken);
    }
  }
}

// Nettoyer les sessions expirées
export function cleanupExpiredSessions(): void {
  const now = Date.now();

  // Nettoyer les sessions actives
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastActivity > SESSION_CONFIG.sessionTimeout) {
      activeSessions.delete(sessionId);
    }
  }

  // Nettoyer les tokens de rafraîchissement
  for (const [refreshToken, tokenData] of refreshTokens.entries()) {
    if (now > tokenData.expiresAt) {
      refreshTokens.delete(refreshToken);
    }
  }
}

// Nettoyer les sessions d'un utilisateur spécifique
function cleanupUserSessions(userId: string): void {
  for (const [sessionId, session] of activeSessions.entries()) {
    if (
      session.userId === userId &&
      Date.now() - session.lastActivity > SESSION_CONFIG.sessionTimeout
    ) {
      activeSessions.delete(sessionId);
    }
  }
}

// Générer un token CSRF
export function generateCSRFToken(sessionId: string): string {
  const timestamp = Date.now().toString();
  const data = `${sessionId}:${timestamp}`;
  return generateHash(data);
}

// Valider un token CSRF
export function validateCSRFToken(token: string, sessionId: string): boolean {
  if (!token || !sessionId) return false;

  // En production, implémenter une validation plus robuste
  // avec vérification de timestamp et stockage sécurisé
  return token.length === 64; // Vérification basique
}

// Fonction de nettoyage périodique
if (typeof window === "undefined") {
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000); // Toutes les 5 minutes
}

// Exporter les statistiques pour le monitoring
export function getSessionStats() {
  return {
    activeSessions: activeSessions.size,
    refreshTokens: refreshTokens.size,
    uniqueUsers: new Set(Array.from(activeSessions.values()).map(s => s.userId))
      .size,
  };
}
