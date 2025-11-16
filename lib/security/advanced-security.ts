/**
 * Sécurité Avancée - DiaspoMoney
 * Architecture de sécurité Company-Grade
 * Basé sur la charte de développement
 */

import { logger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis/redis-client';
import * as Sentry from '@sentry/nextjs';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { auditLogging } from './audit-logging';
// Configuration de sécurité
export const SECURITY_CONFIG = {
  // JWT Configuration
  JWT_SECRET: process.env['JWT_SECRET'] || 'your-super-secret-key',
  JWT_REFRESH_SECRET:
    process.env['JWT_REFRESH_SECRET'] || 'your-refresh-secret-key',
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',

  // Password Configuration
  BCRYPT_ROUNDS: 12,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIREMENTS: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128,
  },

  // Rate Limiting
  RATE_LIMITS: {
    login: { requests: 5, window: 15 * 60 * 1000 }, // 5 req/15min
    register: { requests: 3, window: 60 * 60 * 1000 }, // 3 req/hour
    api: { requests: 100, window: 15 * 60 * 1000 }, // 100 req/15min
    passwordReset: { requests: 3, window: 60 * 60 * 1000 }, // 3 req/hour
  },

  // Brute Force Protection
  BRUTE_FORCE: {
    maxAttempts: 5, // Nombre maximum de tentatives
    windowSeconds: 15 * 60, // Fenêtre de 15 minutes en secondes
    blockDurationSeconds: 30 * 60, // Blocage de 30 minutes en secondes
  },

  // Fraud Detection
  FRAUD_DETECTION: {
    // Seuils de montants
    highAmountThreshold: 10000, // Montant élevé en centimes (100€)
    veryHighAmountThreshold: 50000, // Montant très élevé en centimes (500€)
    // Fréquence de transactions
    maxTransactionsPerHour: 10, // Maximum de transactions par heure
    maxTransactionsPerDay: 50, // Maximum de transactions par jour
    // Fenêtres de temps
    rapidTransactionWindowSeconds: 60, // Fenêtre pour transactions rapides (1 minute)
    maxRapidTransactions: 3, // Maximum de transactions rapides
    // Heures normales (0-23)
    normalBusinessHours: { start: 8, end: 20 }, // 8h-20h
    // Montants ronds suspects
    suspiciousRoundAmounts: [10000, 50000, 100000, 500000, 1000000], // Montants ronds en centimes
  },

  // Security Headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.diaspomoney.fr;",
  },
};

// Interface pour les permissions RBAC
export interface Permission {
  resource: string;
  action: string;
}

export interface Role {
  name: string;
  permissions: Permission[];
}

// Rôles et permissions selon la charte
export const ROLES: Record<string, Role> = {
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    permissions: [{ resource: '*', action: '*' }],
  },
  ADMIN: {
    name: 'ADMIN',
    permissions: [
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },
      { resource: 'transactions', action: 'read' },
      { resource: 'transactions', action: 'refund' },
      { resource: 'providers', action: 'read' },
      { resource: 'providers', action: 'update' },
      { resource: 'reports', action: 'read' },
    ],
  },
  PROVIDER: {
    name: 'PROVIDER',
    permissions: [
      { resource: 'profile', action: 'read' },
      { resource: 'profile', action: 'update' },
      { resource: 'appointments', action: 'read' },
      { resource: 'appointments', action: 'update' },
      { resource: 'earnings', action: 'read' },
    ],
  },
  PAYER: {
    name: 'PAYER',
    permissions: [
      { resource: 'profile', action: 'read' },
      { resource: 'profile', action: 'update' },
      { resource: 'beneficiaries', action: 'create' },
      { resource: 'beneficiaries', action: 'read' },
      { resource: 'transactions', action: 'create' },
      { resource: 'transactions', action: 'read' },
      { resource: 'appointments', action: 'create' },
    ],
  },
  BENEFICIARY: {
    name: 'BENEFICIARY',
    permissions: [
      { resource: 'profile', action: 'read' },
      { resource: 'appointments', action: 'read' },
      { resource: 'services', action: 'read' },
    ],
  },
};

// Classe de gestion de la sécurité
export class SecurityManager {
  sanitize(_beneficiaryId: any) {
    throw new Error('Method not implemented.');
  }
  private static instance: SecurityManager;
  private blacklistedTokens = new Set<string>();
  private redisClient = getRedisClient();
  sanitizeInput: any;

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Validation du mot de passe
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = SECURITY_CONFIG.PASSWORD_REQUIREMENTS;

    if (password.length < config.minLength) {
      errors.push(
        `Le mot de passe doit contenir au moins ${config.minLength} caractères`
      );
    }

    if (password.length > config.maxLength) {
      errors.push(
        `Le mot de passe ne peut pas dépasser ${config.maxLength} caractères`
      );
    }

    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }

    if (config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }

    if (config.requireNumbers && !/\d/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }

    if (
      config.requireSpecialChars &&
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ) {
      errors.push(
        'Le mot de passe doit contenir au moins un caractère spécial'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Hachage du mot de passe
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SECURITY_CONFIG.BCRYPT_ROUNDS);
  }

  // Vérification du mot de passe
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Génération des tokens JWT
  generateTokens(user: { id: string; email: string; role: string }) {
    // Correct typing for JWT options
    const accessPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };
    const refreshPayload = {
      userId: user.id,
      type: 'refresh',
    };

    const accessToken = jwt.sign(
      accessPayload,
      SECURITY_CONFIG.JWT_SECRET as string,
      {
        expiresIn: SECURITY_CONFIG.JWT_EXPIRES_IN,
        algorithm: 'HS256',
      } as SignOptions
    );

    const refreshToken = jwt.sign(
      refreshPayload,
      SECURITY_CONFIG.JWT_REFRESH_SECRET as string,
      {
        expiresIn: SECURITY_CONFIG.JWT_REFRESH_EXPIRES_IN,
        algorithm: 'HS256',
      } as SignOptions
    );

    return { accessToken, refreshToken };
  }

  // Vérification du token
  async verifyToken(
    token: string,
    type: 'access' | 'refresh' = 'access'
  ): Promise<any> {
    try {
      const secret =
        type === 'access'
          ? SECURITY_CONFIG.JWT_SECRET
          : SECURITY_CONFIG.JWT_REFRESH_SECRET;

      const decoded = jwt.verify(token, secret as string);

      // Vérifier si le token est blacklisté
      if (this.blacklistedTokens.has(token)) {
        throw new Error('Token blacklisté');
      }

      return decoded;
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  // Blacklister un token
  blacklistToken(token: string): void {
    this.blacklistedTokens.add(token);

    // Nettoyer les tokens expirés périodiquement
    setTimeout(() => {
      this.blacklistedTokens.delete(token);
    }, 15 * 60 * 1000); // 15 minutes
  }

  // Vérification des permissions RBAC
  hasPermission(userRole: string, resource: string, action: string): boolean {
    const role = ROLES[userRole];
    if (!role) return false;

    // Super admin a tous les droits
    if (role.name === 'SUPER_ADMIN') return true;

    // Vérifier les permissions spécifiques
    return role.permissions.some(
      permission =>
        (permission.resource === resource || permission.resource === '*') &&
        (permission.action === action || permission.action === '*')
    );
  }

  // Middleware d'authentification
  authenticate = async (
    request: NextRequest
  ): Promise<{ user: any; error?: string }> => {
    try {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring('Bearer '.length)
        : authHeader || '';

      if (!token) {
        return { user: null, error: 'Token manquant' };
      }

      const decoded = await this.verifyToken(token);
      return { user: decoded };
    } catch (error) {
      return { user: null, error: 'Token invalide' };
    }
  };

  // Middleware d'autorisation
  authorize = (resource: string, action: string) => {
    return async (request: NextRequest): Promise<boolean> => {
      const { user, error } = await this.authenticate(request);

      if (error || !user) {
        return false;
      }

      return this.hasPermission(user.role, resource, action);
    };
  };

  // Détection d'anomalies de sécurité
  async detectAnomalies(userId: string, action: string, metadata: any = {}) {
    try {
      // Log de l'action pour analyse
      logger.info(
        {
          action,
          userId,
          timestamp: new Date().toISOString(),
          metadata,
        },
        `Security Event: ${action}`
      );

      // Détection de patterns suspects
      if (action === 'LOGIN_FAILED') {
        // Détection d'attaques par force brute avec Redis
        await this.detectBruteForce(userId, metadata);
      }

      if (action === 'TRANSACTION_CREATED') {
        // Détection de transactions suspectes avec Redis
        await this.detectFraud(userId, metadata);
      }

      // Enregistrer l'audit log
      await auditLogging.createAuditLog(action, 'SECURITY_SYSTEM', metadata, {
        userId,
        category: 'SECURITY',
        severity:
          action === 'LOGIN_FAILED' || action === 'TRANSACTION_CREATED'
            ? 'MEDIUM'
            : 'LOW',
        outcome: action.includes('FAILED') ? 'FAILURE' : 'SUCCESS',
        ipAddress: metadata?.ipAddress || 'unknown',
        userAgent: metadata?.userAgent || 'unknown',
      });

      // Envoyer à Sentry pour monitoring
      Sentry.addBreadcrumb({
        message: `Security Event: ${action}`,
        category: 'security',
        data: { userId, metadata },
      });
    } catch (error) {
      logger.error({ error, userId, action }, 'Erreur détection anomalies');
    }
  }

  /**
   * Détecter les attaques par force brute
   * Utilise Redis pour compter les tentatives de connexion échouées
   */
  private async detectBruteForce(
    userId: string,
    metadata: any = {}
  ): Promise<void> {
    try {
      const { maxAttempts, windowSeconds, blockDurationSeconds } =
        SECURITY_CONFIG.BRUTE_FORCE;

      // Clé Redis pour compter les tentatives par utilisateur
      const attemptKey = `security:login_failed:user:${userId}`;
      // Clé Redis pour bloquer l'utilisateur si le seuil est dépassé
      const blockKey = `security:blocked:user:${userId}`;

      // Vérifier si l'utilisateur est déjà bloqué
      const isBlocked = await this.redisClient.exists(blockKey);
      if (isBlocked) {
        const remainingBlockTime = await this.redisClient.ttl(blockKey);
        logger.warn(
          {
            userId,
            remainingBlockTime,
            action: 'LOGIN_FAILED',
            blocked: true,
          },
          'User is currently blocked due to brute force attempts'
        );

        // Envoyer une alerte à Sentry
        Sentry.captureMessage('Brute force attack detected - user blocked', {
          level: 'warning',
          tags: {
            userId,
            action: 'LOGIN_FAILED',
            security: 'brute_force',
          },
          extra: {
            userId,
            remainingBlockTime,
            metadata,
          },
        });
        return;
      }

      // Incrémenter le compteur de tentatives avec expiration
      const attemptCount = await this.redisClient.incrWithExpiry(
        attemptKey,
        windowSeconds
      );

      logger.debug(
        {
          userId,
          attemptCount,
          maxAttempts,
          windowSeconds,
        },
        'Login failed attempt counted'
      );

      // Si le seuil est dépassé, bloquer l'utilisateur
      if (attemptCount >= maxAttempts) {
        // Bloquer l'utilisateur pour la durée définie
        await this.redisClient.set(
          blockKey,
          JSON.stringify({
            blockedAt: new Date().toISOString(),
            attemptCount,
            reason: 'BRUTE_FORCE',
          }),
          blockDurationSeconds
        );

        logger.warn(
          {
            userId,
            attemptCount,
            maxAttempts,
            blockDurationSeconds,
            action: 'LOGIN_FAILED',
          },
          'User blocked due to brute force attack'
        );

        // Envoyer une alerte critique à Sentry
        Sentry.captureMessage(
          'Brute force attack detected - user blocked automatically',
          {
            level: 'error',
            tags: {
              userId,
              action: 'LOGIN_FAILED',
              security: 'brute_force',
              severity: 'high',
            },
            extra: {
              userId,
              attemptCount,
              maxAttempts,
              blockDurationSeconds,
              metadata,
            },
          }
        );
      } else if (attemptCount >= maxAttempts * 0.8) {
        // Alerter si on approche du seuil (80%)
        logger.warn(
          {
            userId,
            attemptCount,
            maxAttempts,
            percentage: Math.round((attemptCount / maxAttempts) * 100),
          },
          'Approaching brute force threshold'
        );

        Sentry.addBreadcrumb({
          message: 'Approaching brute force threshold',
          category: 'security',
          level: 'warning',
          data: {
            userId,
            attemptCount,
            maxAttempts,
            metadata,
          },
        });
      }
    } catch (error) {
      logger.error(
        { error, userId, metadata },
        'Erreur lors de la détection de force brute'
      );
      Sentry.captureException(error, {
        tags: {
          userId,
          action: 'LOGIN_FAILED',
          security: 'brute_force',
        },
      });
      // Ne pas bloquer l'utilisateur si Redis échoue
    }
  }

  /**
   * Vérifier si un utilisateur est bloqué pour force brute
   */
  async isUserBlocked(userId: string): Promise<boolean> {
    try {
      const blockKey = `security:blocked:user:${userId}`;
      const isBlocked = await this.redisClient.exists(blockKey);
      return Boolean(isBlocked);
    } catch (error) {
      logger.error(
        { error, userId },
        'Erreur lors de la vérification du blocage'
      );
      // En cas d'erreur Redis, ne pas bloquer l'utilisateur
      return false;
    }
  }

  /**
   * Réinitialiser le compteur de tentatives (après connexion réussie)
   */
  async resetLoginAttempts(userId: string): Promise<void> {
    try {
      const attemptKey = `security:login_failed:user:${userId}`;
      await this.redisClient.del(attemptKey);
      logger.debug({ userId }, 'Login attempts counter reset');
    } catch (error) {
      logger.error(
        { error, userId },
        'Erreur lors de la réinitialisation du compteur'
      );
    }
  }

  /**
   * Détecter les fraudes dans les transactions
   * Utilise Redis pour suivre les patterns de transactions
   */
  private async detectFraud(userId: string, metadata: any = {}): Promise<void> {
    try {
      const {
        highAmountThreshold,
        veryHighAmountThreshold,
        maxTransactionsPerHour,
        maxTransactionsPerDay,
        rapidTransactionWindowSeconds,
        maxRapidTransactions,
        normalBusinessHours,
        suspiciousRoundAmounts,
      } = SECURITY_CONFIG.FRAUD_DETECTION;

      const transaction = metadata.transaction || metadata;
      const amount = transaction?.amount || metadata?.amount || 0;
      const currency = transaction?.currency || metadata?.currency || 'EUR';
      const transactionId =
        transaction?.id ||
        transaction?._id ||
        metadata?.transactionId ||
        'unknown';

      const fraudFlags: string[] = [];
      const fraudScore = { value: 0, max: 100 };

      // 1. Vérifier le montant (montants anormalement élevés)
      if (amount >= veryHighAmountThreshold) {
        fraudFlags.push('VERY_HIGH_AMOUNT');
        fraudScore.value += 40;
        logger.warn(
          {
            userId,
            transactionId,
            amount,
            threshold: veryHighAmountThreshold,
          },
          'Very high amount transaction detected'
        );
      } else if (amount >= highAmountThreshold) {
        fraudFlags.push('HIGH_AMOUNT');
        fraudScore.value += 20;
        logger.debug(
          {
            userId,
            transactionId,
            amount,
            threshold: highAmountThreshold,
          },
          'High amount transaction detected'
        );
      }

      // 2. Vérifier les montants ronds suspects
      if (suspiciousRoundAmounts.includes(amount)) {
        fraudFlags.push('SUSPICIOUS_ROUND_AMOUNT');
        fraudScore.value += 15;
        logger.warn(
          { userId, transactionId, amount },
          'Suspicious round amount detected'
        );
      }

      // 3. Vérifier la fréquence de transactions (Redis)
      const now = new Date();
      const hourKey = `security:transactions:user:${userId}:hour:${now.getHours()}`;
      const dayKey = `security:transactions:user:${userId}:day:${
        now.toISOString().split('T')[0]
      }`;
      const rapidKey = `security:transactions:user:${userId}:rapid`;

      // Compteur par heure
      const hourCount = await this.redisClient.incrWithExpiry(hourKey, 3600); // Expire après 1 heure
      if (hourCount > maxTransactionsPerHour) {
        fraudFlags.push('HIGH_FREQUENCY_HOUR');
        fraudScore.value += 25;
        logger.warn(
          {
            userId,
            transactionId,
            hourCount,
            maxTransactionsPerHour,
          },
          'High transaction frequency per hour detected'
        );
      }

      // Compteur par jour
      const dayCount = await this.redisClient.incrWithExpiry(dayKey, 86400); // Expire après 24 heures
      if (dayCount > maxTransactionsPerDay) {
        fraudFlags.push('HIGH_FREQUENCY_DAY');
        fraudScore.value += 30;
        logger.warn(
          {
            userId,
            transactionId,
            dayCount,
            maxTransactionsPerDay,
          },
          'High transaction frequency per day detected'
        );
      }

      // Transactions rapides (dans la même minute)
      const rapidCount = await this.redisClient.incrWithExpiry(
        rapidKey,
        rapidTransactionWindowSeconds
      );
      if (rapidCount > maxRapidTransactions) {
        fraudFlags.push('RAPID_TRANSACTIONS');
        fraudScore.value += 35;
        logger.warn(
          {
            userId,
            transactionId,
            rapidCount,
            maxRapidTransactions,
            windowSeconds: rapidTransactionWindowSeconds,
          },
          'Rapid successive transactions detected'
        );
      }

      // 4. Vérifier les heures normales
      const currentHour = now.getHours();
      if (
        currentHour < normalBusinessHours.start ||
        currentHour >= normalBusinessHours.end
      ) {
        fraudFlags.push('UNUSUAL_HOURS');
        fraudScore.value += 10;
        logger.debug(
          {
            userId,
            transactionId,
            currentHour,
            normalHours: normalBusinessHours,
          },
          'Transaction outside normal business hours'
        );
      }

      // 5. Vérifier les patterns de montants (montants identiques répétés)
      const amountPatternKey = `security:transactions:user:${userId}:amount:${amount}`;
      const sameAmountCount = await this.redisClient.incrWithExpiry(
        amountPatternKey,
        3600
      ); // 1 heure
      if (sameAmountCount > 5) {
        fraudFlags.push('REPEATED_AMOUNT');
        fraudScore.value += 20;
        logger.warn(
          {
            userId,
            transactionId,
            amount,
            sameAmountCount,
          },
          'Repeated identical amount detected'
        );
      }

      // 6. Calculer le score de risque final
      const riskLevel =
        fraudScore.value >= 70
          ? 'CRITICAL'
          : fraudScore.value >= 50
          ? 'HIGH'
          : fraudScore.value >= 30
          ? 'MEDIUM'
          : 'LOW';

      // Si le score est élevé, prendre des mesures
      if (fraudScore.value >= 50) {
        logger.error(
          {
            userId,
            transactionId,
            amount,
            currency,
            fraudScore: fraudScore.value,
            riskLevel,
            fraudFlags,
            hourCount,
            dayCount,
            rapidCount,
          },
          'Fraud detected in transaction'
        );

        // Envoyer une alerte critique à Sentry
        Sentry.captureMessage(
          `Fraud detected in transaction - Risk Level: ${riskLevel}`,
          {
            level: fraudScore.value >= 70 ? 'error' : 'warning',
            tags: {
              userId,
              transactionId,
              action: 'TRANSACTION_CREATED',
              security: 'fraud_detection',
              riskLevel,
              severity: fraudScore.value >= 70 ? 'critical' : 'high',
            },
            extra: {
              userId,
              transactionId,
              amount,
              currency,
              fraudScore: fraudScore.value,
              riskLevel,
              fraudFlags,
              hourCount,
              dayCount,
              rapidCount,
              metadata,
            },
          }
        );

        // Si le risque est critique, marquer la transaction comme suspecte
        if (fraudScore.value >= 70) {
          const suspiciousKey = `security:fraud:transaction:${transactionId}`;
          await this.redisClient.set(
            suspiciousKey,
            JSON.stringify({
              transactionId,
              userId,
              amount,
              currency,
              fraudScore: fraudScore.value,
              riskLevel,
              fraudFlags,
              detectedAt: new Date().toISOString(),
            }),
            86400 * 7
          ); // Conserver 7 jours

          logger.error(
            {
              userId,
              transactionId,
              fraudScore: fraudScore.value,
              riskLevel,
            },
            'Transaction marked as suspicious due to critical fraud score'
          );
        }
      } else if (fraudScore.value >= 30) {
        // Score moyen : alerte préventive
        logger.warn(
          {
            userId,
            transactionId,
            amount,
            fraudScore: fraudScore.value,
            riskLevel,
            fraudFlags,
          },
          'Medium risk transaction detected'
        );

        Sentry.addBreadcrumb({
          message: 'Medium risk transaction detected',
          category: 'security',
          level: 'warning',
          data: {
            userId,
            transactionId,
            amount,
            fraudScore: fraudScore.value,
            riskLevel,
            fraudFlags,
          },
        });
      }
    } catch (error) {
      logger.error(
        { error, userId, metadata },
        'Erreur lors de la détection de fraude'
      );
      Sentry.captureException(error, {
        tags: {
          userId,
          action: 'TRANSACTION_CREATED',
          security: 'fraud_detection',
        },
      });
      // Ne pas bloquer la transaction si la détection de fraude échoue
    }
  }

  /**
   * Vérifier si une transaction est marquée comme suspecte
   */
  async isTransactionSuspicious(transactionId: string): Promise<boolean> {
    try {
      const suspiciousKey = `security:fraud:transaction:${transactionId}`;
      const exists = await this.redisClient.exists(suspiciousKey);
      return Boolean(exists);
    } catch (error) {
      logger.error(
        { error, transactionId },
        'Erreur lors de la vérification de transaction suspecte'
      );
      return false;
    }
  }
}

// Fonction utilitaire pour ajouter les headers de sécurité
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_CONFIG.SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value as string);
  });

  return response;
}

// Fonction pour valider les entrées utilisateur
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Échapper les caractères dangereux
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

// Export de l'instance singleton
export const securityManager = SecurityManager.getInstance();
