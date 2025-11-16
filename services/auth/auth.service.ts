/**
 * Auth Service - DiaspoMoney
 * Service d'authentification Company-Grade
 * Basé sur la charte de développement
 *
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Repository Pattern (via IUserRepository)
 * - Dependency Injection (via constructor injection)
 * - Singleton Pattern
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache, @Validate)
 * - Logger Pattern (structured logging avec childLogger)
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { Validate, ValidationRule } from '@/lib/decorators/validate.decorator';
import { sendPasswordResetEmail, sendWelcomeEmail } from '@/lib/email/resend';
import { childLogger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { getRedisClient } from '@/lib/redis/redis-client';
import { securityManager } from '@/lib/security/advanced-security';
import { auditLogging } from '@/lib/security/audit-logging';
import { getUserRepository, IUserRepository } from '@/repositories';
import type {
  AuthResponse,
  AuthUser,
  LoginCredentials,
  RegisterData,
  TwoFactorData,
} from '@/types/auth';
import * as Sentry from '@sentry/nextjs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import * as speakeasy from 'speakeasy';
import { z } from 'zod';
import { notificationService } from '../notification/notification.service';

class AuthService {
  private static instance: AuthService;
  private userRepository: IUserRepository;

  private constructor() {
    // Dependency Injection : injecter le repository
    this.userRepository = getUserRepository();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Connexion utilisateur
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true }) // Ne pas logger le mot de passe
  @Validate({
    rules: [
      ValidationRule(
        0,
        z
          .object({
            email: z.string().email('Email invalide'),
            password: z.string().min(1, 'Le mot de passe est requis'),
          })
          .passthrough(),
        'credentials'
      ),
    ],
  })
  @InvalidateCache('AuthService:*') // Invalider le cache après connexion
  async login(
    credentials: LoginCredentials,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<AuthResponse> {
    const log = childLogger({ route: 'AuthService:login' });
    try {
      // Utiliser le repository pour trouver l'utilisateur
      const user = await this.userRepository.findOne({
        email: credentials.email.toLowerCase(),
      });

      if (!user || user.status !== 'ACTIVE') {
        log.warn(
          { email: credentials.email.toLowerCase() },
          'Login failed: invalid credentials or inactive user'
        );
        // Détecter les tentatives de force brute
        await securityManager.detectAnomalies(
          user?.id || credentials.email,
          'LOGIN_FAILED',
          {
            email: credentials.email.toLowerCase(),
            reason: 'user_not_found_or_inactive',
          }
        );
        // Enregistrer l'audit log
        await auditLogging.createAuditLog(
          'LOGIN_FAILED',
          'AUTH_SYSTEM',
          {
            email: credentials.email.toLowerCase(),
            reason: 'user_not_found_or_inactive',
          },
          {
            ...(user?.id && { userId: user.id }),
            category: 'AUTHENTICATION',
            severity: 'MEDIUM',
            outcome: 'FAILURE',
            ipAddress: options?.ipAddress || 'unknown',
            userAgent: options?.userAgent || 'unknown',
          }
        );
        throw new Error('Identifiants invalides');
      }

      // Vérifier le mot de passe via le repository
      const isPasswordValid = await this.userRepository.verifyPassword(
        user.id,
        credentials.password
      );

      if (!isPasswordValid) {
        log.warn(
          { email: credentials.email.toLowerCase() },
          'Login failed: invalid password'
        );
        // Détecter les tentatives de force brute
        await securityManager.detectAnomalies(user.id, 'LOGIN_FAILED', {
          email: credentials.email.toLowerCase(),
          reason: 'invalid_password',
        });
        // Enregistrer l'audit log
        await auditLogging.createAuditLog(
          'LOGIN_FAILED',
          'AUTH_SYSTEM',
          {
            email: credentials.email.toLowerCase(),
            reason: 'invalid_password',
          },
          {
            userId: user.id,
            category: 'AUTHENTICATION',
            severity: 'MEDIUM',
            outcome: 'FAILURE',
            ipAddress: options?.ipAddress || 'unknown',
            userAgent: options?.userAgent || 'unknown',
          }
        );
        throw new Error('Identifiants invalides');
      }

      // Génération des tokens
      const tokens = securityManager.generateTokens({
        id: user.id,
        email: user.email,
        role: user.roles?.[0] || 'CUSTOMER',
      });

      // Mise à jour de la dernière connexion via le repository
      await this.userRepository.update(user.id, {
        lastLogin: new Date(),
      } as any);

      // Réinitialiser le compteur de tentatives de connexion échouées
      await securityManager.resetLoginAttempts(user.id);

      // Enregistrer l'audit log de connexion réussie
      await auditLogging.createAuditLog(
        'LOGIN_SUCCESS',
        'AUTH_SYSTEM',
        {
          email: user.email,
          role: user.roles?.[0] || 'CUSTOMER',
        },
        {
          userId: user.id,
          category: 'AUTHENTICATION',
          severity: 'LOW',
          outcome: 'SUCCESS',
          ipAddress: options?.ipAddress || 'unknown',
          userAgent: options?.userAgent || 'unknown',
        }
      );

      log.info(
        { userId: user.id, email: user.email },
        'User logged in successfully'
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.roles?.[0] || 'CUSTOMER',
          isVerified: user.isEmailVerified || false,
          kycStatus: 'PENDING',
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 15 * 60, // 15 minutes
      };
    } catch (error) {
      const log = childLogger({ route: 'AuthService:login' });
      log.error({ error, msg: 'Error during login' }, 'Login error');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Inscription utilisateur
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true }) // Ne pas logger le mot de passe
  @Validate({
    rules: [
      ValidationRule(
        0,
        z
          .object({
            email: z.string().email('Email invalide'),
            firstName: z.string().min(1, 'Le prénom est requis'),
            lastName: z.string().min(1, 'Le nom est requis'),
            country: z.string().min(1, 'Le pays est requis'),
            termsAccepted: z.boolean().refine(val => val === true, {
              message: 'Vous devez accepter les conditions',
            }),
          })
          .passthrough(),
        'data'
      ),
    ],
  })
  @InvalidateCache('AuthService:*') // Invalider le cache après inscription
  async register(
    data: RegisterData,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<AuthResponse> {
    const log = childLogger({ route: 'AuthService:register' });
    try {
      // S'assurer que la connexion à la base de données est établie
      await dbConnect();

      // Validation des données
      if (data.password && data.password.length < 8) {
        log.warn(
          { email: data.email.toLowerCase() },
          'Registration failed: password too short'
        );
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }

      // Vérifier si l'utilisateur existe déjà via le repository
      const existingUser = await this.userRepository.findOne({
        email: data.email.toLowerCase(),
      });

      if (existingUser) {
        log.warn(
          { email: data.email.toLowerCase() },
          'Registration failed: email already exists'
        );
        // Enregistrer l'audit log
        await auditLogging.createAuditLog(
          'REGISTER_FAILED',
          'AUTH_SYSTEM',
          {
            email: data.email.toLowerCase(),
            reason: 'email_already_exists',
          },
          {
            category: 'AUTHENTICATION',
            severity: 'LOW',
            outcome: 'FAILURE',
            ipAddress: options?.ipAddress || 'unknown',
            userAgent: options?.userAgent || 'unknown',
          }
        );
        throw new Error('Un compte avec cet email existe déjà');
      }

      // Créer l'utilisateur via le repository avec hashage automatique du mot de passe
      const user = await this.userRepository.createWithPassword({
        email: data.email.toLowerCase(),
        password: data.password || undefined, // Le hook pre('save') hash le mot de passe
        name: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ? String(data.phone).trim() : undefined,
        country: data.country,
        countryOfResidence: data.country,
        dateOfBirth: data.dateOfBirth,
        targetCountry: data.targetCountry,
        targetCity: data.targetCity,
        monthlyBudget: data.monthlyBudget,
        securityQuestion: data.securityQuestion,
        securityAnswer: data.securityAnswer,
        selectedServices: data.selectedServices,
        roles: ['CUSTOMER'], // Rôle par défaut
        status: 'ACTIVE',
        isEmailVerified: false,
        marketingConsent: data.marketingConsent || false,
        kycConsent: data.termsAccepted,
        kycStatus: 'PENDING',
        oauth: data.oauth,
      } as any);

      // Générer le token de vérification email
      const emailVerificationToken = jwt.sign(
        { userId: user._id?.toString() || user.id, type: 'email_verification' },
        process.env['JWT_SECRET']!,
        { expiresIn: '24h' }
      );

      // Envoyer l'email de bienvenue avec lien de vérification
      const verificationUrl = `${
        process.env['NEXTAUTH_URL'] || 'http://localhost:3000'
      }/verify-email?token=${emailVerificationToken}`;
      const emailSent = await sendWelcomeEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        verificationUrl
      );

      if (!emailSent) {
        log.warn(
          { email: user.email },
          "⚠️ Échec de l'envoi de l'email de bienvenue"
        );
        // Ne pas faire échouer l'inscription à cause de l'email
        // L'utilisateur peut toujours se connecter et demander un renvoi
      } else {
        log.info({ email: user.email }, '✅ Email de bienvenue envoyé');
        await notificationService.sendWelcomeNotification(
          user.email,
          `${user.firstName} ${user.lastName}`,
          'fr'
        );
      }

      // Génération des tokens
      const tokens = securityManager.generateTokens({
        id: user._id?.toString() || user.id,
        email: user.email,
        role: (user.roles?.[0] || 'CUSTOMER') as string,
      });

      // Enregistrer l'audit log de registration réussie
      await auditLogging.createAuditLog(
        'REGISTER_SUCCESS',
        'AUTH_SYSTEM',
        {
          email: user.email,
          country: user.country,
        },
        {
          userId: user._id?.toString() || user.id,
          category: 'AUTHENTICATION',
          severity: 'LOW',
          outcome: 'SUCCESS',
          ipAddress: options?.ipAddress || 'unknown',
          userAgent: options?.userAgent || 'unknown',
        }
      );

      log.info(
        { userId: user._id?.toString() || user.id, email: user.email },
        'User registered successfully'
      );

      return {
        user: {
          id: user._id?.toString() || user.id,
          email: user.email,
          role: user.roles?.[0] || 'CUSTOMER',
          isVerified: false,
          kycStatus: 'PENDING',
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 15 * 60,
      };
    } catch (error) {
      const log = childLogger({ route: 'AuthService:register' });
      log.error(
        { error, msg: 'Error during registration' },
        'Registration error'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Rafraîchissement du token
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true }) // Ne pas logger le token
  @Validate({
    rules: [
      ValidationRule(
        0,
        z.string().min(1, 'Le refresh token est requis'),
        'refreshToken'
      ),
    ],
  })
  @InvalidateCache('AuthService:*') // Invalider le cache après rafraîchissement
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const log = childLogger({ route: 'AuthService:refreshToken' });
    try {
      // Vérifier le refresh token
      const decoded = await securityManager.verifyToken(
        refreshToken,
        'refresh'
      );

      // Récupérer l'utilisateur via le repository
      const user = await this.userRepository.findById(decoded.userId);

      if (!user || user.status !== 'ACTIVE') {
        log.warn(
          { userId: decoded.userId },
          'Token refresh failed: user not found or inactive'
        );
        throw new Error('Utilisateur non trouvé ou inactif');
      }

      // Générer de nouveaux tokens
      const tokens = securityManager.generateTokens({
        id: user.id,
        email: user.email,
        role: user.roles?.[0] || 'CUSTOMER',
      });

      log.info(
        { userId: user.id, email: user.email },
        'Token refreshed successfully'
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.roles?.[0] || 'CUSTOMER',
          isVerified: user.isEmailVerified || false,
          kycStatus: 'PENDING',
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 15 * 60,
      };
    } catch (error) {
      const log = childLogger({ route: 'AuthService:refreshToken' });
      log.error(
        { error, msg: 'Error refreshing token' },
        'Token refresh error'
      );
      throw new Error('Token de rafraîchissement invalide');
    }
  }

  /**
   * Déconnexion
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true }) // Ne pas logger le token
  @Validate({
    rules: [
      ValidationRule(
        0,
        z.string().min(1, 'Le token est requis'),
        'accessToken'
      ),
    ],
  })
  @InvalidateCache('AuthService:*') // Invalider le cache après déconnexion
  async logout(accessToken: string): Promise<void> {
    const log = childLogger({ route: 'AuthService:logout' });
    try {
      // Décoder le token pour obtenir le userId
      let userId: string | undefined;
      try {
        const decoded = await securityManager.verifyToken(accessToken);
        userId = decoded.userId;
      } catch (error) {
        // Si le token est invalide, on continue quand même pour blacklister
        log.warn({
          msg: 'Invalid token during logout, continuing with blacklist',
        });
      }

      // Blacklister le token
      securityManager.blacklistToken(accessToken);

      // Nettoyer les sessions Redis si userId est disponible
      if (userId) {
        try {
          const redisClient = getRedisClient();
          await redisClient.deleteSession(userId);
          log.debug({ userId }, 'Session deleted from Redis');
        } catch (redisError) {
          // Ne pas faire échouer la déconnexion si Redis échoue
          log.warn(
            { error: redisError, userId },
            'Failed to delete session from Redis, continuing logout'
          );
        }
      }

      log.info({ userId, msg: 'User logged out successfully' });
    } catch (error) {
      log.error({ error, msg: 'Error during logout' }, 'Logout error');
      throw error;
    }
  }

  /**
   * Vérification du token
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true }) // Ne pas logger le token
  @Validate({
    rules: [
      ValidationRule(0, z.string().min(1, 'Le token est requis'), 'token'),
    ],
  })
  @Cacheable(300, { prefix: 'AuthService:verifyToken' }) // Cache 5 minutes
  async verifyToken(token: string): Promise<AuthUser> {
    const log = childLogger({ route: 'AuthService:verifyToken' });
    try {
      const decoded = await securityManager.verifyToken(token);

      // Récupérer l'utilisateur via le repository
      const user = await this.userRepository.findById(decoded.userId);

      if (!user || user.status !== 'ACTIVE') {
        log.warn(
          { userId: decoded.userId },
          'Token verification failed: user not found or inactive'
        );
        throw new Error('Utilisateur non trouvé ou inactif');
      }

      log.debug(
        { userId: user.id, email: user.email },
        'Token verified successfully'
      );

      return {
        id: user.id,
        email: user.email,
        role: user.roles?.[0] || 'CUSTOMER',
        isVerified: user.isEmailVerified || false,
        kycStatus: 'PENDING',
      };
    } catch (error) {
      const log = childLogger({ route: 'AuthService:verifyToken' });
      log.error(
        { error, msg: 'Error verifying token' },
        'Token verification error'
      );
      throw new Error('Token invalide');
    }
  }

  /**
   * Configuration 2FA
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      ValidationRule(0, z.string().min(1, 'User ID is required'), 'userId'),
    ],
  })
  @InvalidateCache('AuthService:*') // Invalider le cache après configuration 2FA
  async setup2FA(userId: string): Promise<TwoFactorData> {
    const log = childLogger({ route: 'AuthService:setup2FA' });
    try {
      // Récupérer l'utilisateur pour obtenir son email
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Générer le secret 2FA avec speakeasy
      const secret = speakeasy.generateSecret({
        name: `DiaspoMoney (${user.email})`,
        issuer: 'DiaspoMoney',
        length: 32,
      });

      // Générer le QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

      // Générer des codes de backup (8 codes de 8 caractères)
      const backupCodes: string[] = [];
      for (let i = 0; i < 8; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        backupCodes.push(code);
      }

      // Sauvegarder le secret et les codes de backup via le repository
      await this.userRepository.setup2FA(
        userId,
        secret.base32 || '',
        backupCodes
      );

      log.info({ userId }, '2FA setup initiated');

      return {
        secret: secret.base32 || '',
        qrCode,
        backupCodes,
      };
    } catch (error) {
      log.error(
        { error, userId, msg: 'Error setting up 2FA' },
        '2FA setup error'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Activation 2FA
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true }) // Ne pas logger le token
  @Validate({
    rules: [
      ValidationRule(0, z.string().min(1, 'User ID is required'), 'userId'),
      ValidationRule(1, z.string().min(1, 'Token is required'), 'token'),
    ],
  })
  @InvalidateCache('AuthService:*') // Invalider le cache après activation 2FA
  async enable2FA(userId: string, token: string): Promise<boolean> {
    const log = childLogger({ route: 'AuthService:enable2FA' });
    try {
      // Récupérer les informations 2FA via le repository
      const twoFAInfo = await this.userRepository.get2FAInfo(userId);
      if (!twoFAInfo || !twoFAInfo.twoFactorSecret) {
        log.warn({ userId }, '2FA enable failed: secret not found');
        return false;
      }

      // Vérifier le token 2FA avec speakeasy
      const isValid = speakeasy.totp.verify({
        secret: twoFAInfo.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2, // Accepter les tokens dans une fenêtre de ±2 périodes (60 secondes)
      });

      if (isValid) {
        await this.userRepository.enable2FA(userId);
        log.info({ userId }, '2FA enabled successfully');
        return true;
      }

      log.warn({ userId }, '2FA enable failed: invalid token');
      return false;
    } catch (error) {
      log.error(
        { error, userId, msg: 'Error enabling 2FA' },
        '2FA enable error'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Vérification 2FA
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true }) // Ne pas logger le token
  @Validate({
    rules: [
      ValidationRule(0, z.string().min(1, 'User ID is required'), 'userId'),
      ValidationRule(1, z.string().min(1, 'Token is required'), 'token'),
    ],
  })
  async verify2FA(userId: string, token: string): Promise<boolean> {
    const log = childLogger({ route: 'AuthService:verify2FA' });
    try {
      // Récupérer les informations 2FA via le repository
      const twoFAInfo = await this.userRepository.get2FAInfo(userId);
      if (!twoFAInfo || !twoFAInfo.twoFactorEnabled) {
        log.warn(
          { userId },
          '2FA verification failed: user not found or 2FA not enabled'
        );
        return false;
      }

      // Vérifier d'abord si c'est un code de backup
      if (
        twoFAInfo.twoFactorBackupCodes &&
        Array.isArray(twoFAInfo.twoFactorBackupCodes)
      ) {
        const backupIndex = twoFAInfo.twoFactorBackupCodes.indexOf(token);
        if (backupIndex !== -1) {
          // Retirer le code de backup utilisé
          const updatedBackupCodes = [...twoFAInfo.twoFactorBackupCodes];
          updatedBackupCodes.splice(backupIndex, 1);
          await this.userRepository.update2FABackupCodes(
            userId,
            updatedBackupCodes
          );
          log.debug({ userId }, '2FA verified successfully with backup code');
          return true;
        }
      }

      // Vérifier le token TOTP avec speakeasy
      if (!twoFAInfo.twoFactorSecret) {
        log.warn({ userId }, '2FA verification failed: secret not found');
        return false;
      }

      const isValid = speakeasy.totp.verify({
        secret: twoFAInfo.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2, // Accepter les tokens dans une fenêtre de ±2 périodes (60 secondes)
      });

      if (isValid) {
        log.debug({ userId }, '2FA verified successfully');
      } else {
        log.warn({ userId }, '2FA verification failed: invalid token');
      }

      return isValid;
    } catch (error) {
      log.error(
        { error, userId, msg: 'Error verifying 2FA' },
        '2FA verification error'
      );
      Sentry.captureException(error);
      return false;
    }
  }

  /**
   * Demande de réinitialisation du mot de passe
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true }) // Ne pas logger l'email
  @Validate({
    rules: [ValidationRule(0, z.string().email('Email invalide'), 'email')],
  })
  async requestPasswordReset(email: string): Promise<boolean> {
    const log = childLogger({ route: 'AuthService:requestPasswordReset' });
    try {
      // Utiliser le repository pour trouver l'utilisateur
      const user = await this.userRepository.findOne({
        email: email.toLowerCase(),
      });

      if (!user) {
        // Ne pas révéler si l'email existe ou non
        log.warn(
          { email: email.toLowerCase() },
          'Password reset requested for non-existent email'
        );
        return false;
      }

      // Générer le token de reset
      const resetToken = jwt.sign(
        {
          userId: user.id,
          type: 'password_reset',
        },
        process.env['JWT_SECRET']!,
        { expiresIn: '1h' }
      );

      // Construire l'URL de réinitialisation
      const resetUrl = `${
        process.env['NEXTAUTH_URL'] || 'http://localhost:3000'
      }/reset-password?token=${resetToken}`;

      // Envoyer l'email de reset (seulement si Resend est configuré)
      if (process.env['RESEND_API_KEY']) {
        const userName = user.name || `${user.firstName} ${user.lastName}`;
        const emailSent = await sendPasswordResetEmail(
          user.email,
          userName,
          resetUrl
        );

        if (emailSent) {
          log.info(
            { email: user.email, userId: user.id },
            'Password reset email sent successfully'
          );
        } else {
          log.warn(
            { email: user.email, userId: user.id },
            'Failed to send password reset email'
          );
          // Ne pas faire échouer la demande si l'email échoue
          // L'utilisateur peut toujours demander un nouveau reset
        }
      } else {
        log.info(
          {
            email: user.email,
            userId: user.id,
            resetToken,
            resetUrl,
          },
          'Password reset token generated (email service not configured - token logged for development)'
        );
      }

      return true;
    } catch (error) {
      log.error(
        { error, msg: 'Error requesting password reset' },
        'Password reset request error'
      );
      return false;
    }
  }

  /**
   * Réinitialisation du mot de passe
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true }) // Ne pas logger le token ni le mot de passe
  @Validate({
    rules: [
      ValidationRule(0, z.string().min(1, 'Token is required'), 'token'),
      ValidationRule(
        1,
        z
          .string()
          .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
        'newPassword'
      ),
    ],
  })
  @InvalidateCache('AuthService:*') // Invalider le cache après réinitialisation
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const log = childLogger({ route: 'AuthService:resetPassword' });
    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as any;
      if (decoded.type !== 'password_reset') {
        log.warn({ msg: 'Invalid password reset token type' });
        return false;
      }

      // Validation du nouveau mot de passe
      if (newPassword.length < 8) {
        log.warn(
          { userId: decoded.userId },
          'Password reset failed: password too short'
        );
        return false;
      }

      // Hacher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Mettre à jour le mot de passe via le repository
      const updated = await this.userRepository.updatePassword(
        decoded.userId,
        hashedPassword,
        true // Mettre à jour passwordChangedAt
      );

      if (!updated) {
        log.warn(
          { userId: decoded.userId },
          'Password reset failed: user not found'
        );
        return false;
      }

      // Enregistrer l'audit log de réinitialisation de mot de passe
      await auditLogging.createAuditLog(
        'PASSWORD_RESET_SUCCESS',
        'AUTH_SYSTEM',
        {},
        {
          userId: decoded.userId,
          category: 'AUTHENTICATION',
          severity: 'MEDIUM',
          outcome: 'SUCCESS',
        }
      );

      log.info({ userId: decoded.userId }, 'Password reset successfully');

      return true;
    } catch (error) {
      log.error(
        { error, msg: 'Error resetting password' },
        'Password reset error'
      );
      return false;
    }
  }
}

// Export de l'instance singleton
export const authService = AuthService.getInstance();

// Export des méthodes individuelles pour compatibilité
export const { requestPasswordReset, resetPassword } = authService;
