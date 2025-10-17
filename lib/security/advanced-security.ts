/**
 * Sécurité Avancée - DiaspoMoney
 * Architecture de sécurité Company-Grade
 * Basé sur la charte de développement
 */

import * as Sentry from '@sentry/nextjs';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

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
    setTimeout(
      () => {
        this.blacklistedTokens.delete(token);
      },
      15 * 60 * 1000
    ); // 15 minutes
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
      console.log(`Security Event: ${action}`, {
        userId,
        timestamp: new Date().toISOString(),
        metadata,
      });

      // Détection de patterns suspects
      if (action === 'LOGIN_FAILED') {
        // Implémenter la logique de détection d'attaques par force brute
        // TODO: Intégrer avec Redis pour le comptage
      }

      if (action === 'TRANSACTION_CREATED') {
        // Détection de transactions suspectes
        // TODO: Implémenter la logique de détection de fraude
      }

      // Envoyer à Sentry pour monitoring
      Sentry.addBreadcrumb({
        message: `Security Event: ${action}`,
        category: 'security',
        data: { userId, metadata },
      });
    } catch (error) {
      console.error('Erreur détection anomalies:', error);
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
