/**
 * Auth Service - DiaspoMoney
 * Service d'authentification Company-Grade
 * Basé sur la charte de développement
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import { securityManager } from '@/lib/security/advanced-security';
import * as Sentry from '@sentry/nextjs';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  isVerified: boolean;
  kycStatus: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country: string;
  consents: Array<{
    type: 'MARKETING' | 'ANALYTICS' | 'THIRD_PARTY';
    granted: boolean;
  }>;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TwoFactorData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export class AuthService {
  private static instance: AuthService;
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Authentification utilisateur
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Validation des entrées
      if (!credentials.email || !credentials.password) {
        throw new Error('Email et mot de passe requis');
      }

      // Recherche de l'utilisateur
      const user = await User.findOne({ 
        email: credentials.email.toLowerCase() 
      });

      if (!user) {
        // Enregistrer la tentative d'échec pour la sécurité
        await securityManager.detectAnomalies('unknown', 'LOGIN_FAILED', {
          email: credentials.email,
          ip: 'unknown'
        });
        throw new Error('Identifiants invalides');
      }

      // Vérification du mot de passe
      const isValidPassword = await securityManager.verifyPassword(
        credentials.password, 
        user.password
      );

      if (!isValidPassword) {
        await securityManager.detectAnomalies(user.id, 'LOGIN_FAILED');
        throw new Error('Identifiants invalides');
      }

      // Vérification du statut du compte
      if (!user.isActive) {
        throw new Error('Compte désactivé');
      }

      if (!user.isEmailVerified) {
        throw new Error('Email non vérifié');
      }

      // Génération des tokens
      const tokens = securityManager.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role
      });

      // Mise à jour de la dernière connexion
      await User.updateOne(
        { _id: user.id },
        { 
          lastLoginAt: new Date(),
          loginCount: (user.loginCount || 0) + 1
        }
      );

      // Enregistrer l'événement de connexion
      await securityManager.detectAnomalies(user.id, 'LOGIN_SUCCESS');

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: user.isEmailVerified,
          kycStatus: user.kycStatus || 'PENDING'
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 15 * 60 // 15 minutes
      };

    } catch (error) {
      console.error('Erreur login:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Inscription utilisateur
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Validation des données
      const validation = securityManager.validatePassword(data.password);
      if (!validation.isValid) {
        throw new Error(`Mot de passe invalide: ${validation.errors.join(', ')}`);
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ 
        email: data.email.toLowerCase() 
      });

      if (existingUser) {
        throw new Error('Un compte avec cet email existe déjà');
      }

      // Hacher le mot de passe
      const hashedPassword = await securityManager.hashPassword(data.password);

      // Créer l'utilisateur
      const user = new User({
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        country: data.country,
        role: 'PAYER', // Rôle par défaut
        isActive: true,
        isEmailVerified: false,
        kycStatus: 'PENDING',
        consents: data.consents,
        createdAt: new Date()
      });

      await user.save();

      // Générer le token de vérification email
      const emailVerificationToken = jwt.sign(
        { userId: user.id, type: 'email_verification' },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      // TODO: Envoyer l'email de vérification
      // await this.sendVerificationEmail(user.email, emailVerificationToken);

      // Génération des tokens
      const tokens = securityManager.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: false,
          kycStatus: 'PENDING'
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 15 * 60
      };

    } catch (error) {
      console.error('Erreur registration:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Rafraîchissement du token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Vérifier le refresh token
      const decoded = await securityManager.verifyToken(refreshToken, 'refresh');
      
      // Récupérer l'utilisateur
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('Utilisateur non trouvé ou inactif');
      }

      // Générer de nouveaux tokens
      const tokens = securityManager.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: user.isEmailVerified,
          kycStatus: user.kycStatus || 'PENDING'
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 15 * 60
      };

    } catch (error) {
      console.error('Erreur refresh token:', error);
      throw new Error('Token de rafraîchissement invalide');
    }
  }

  /**
   * Déconnexion
   */
  async logout(accessToken: string): Promise<void> {
    try {
      // Blacklister le token
      securityManager.blacklistToken(accessToken);
      
      // TODO: Nettoyer les sessions Redis
      // await redis.del(`session:${userId}`);
      
    } catch (error) {
      console.error('Erreur logout:', error);
      throw error;
    }
  }

  /**
   * Vérification du token
   */
  async verifyToken(token: string): Promise<AuthUser> {
    try {
      const decoded = await securityManager.verifyToken(token);
      
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('Utilisateur non trouvé ou inactif');
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isEmailVerified,
        kycStatus: user.kycStatus || 'PENDING'
      };

    } catch (error) {
      console.error('Erreur vérification token:', error);
      throw new Error('Token invalide');
    }
  }

  /**
   * Configuration 2FA
   */
  async setup2FA(userId: string): Promise<TwoFactorData> {
    try {
      // TODO: Implémenter la génération 2FA avec speakeasy
      const secret = 'TEMP_SECRET'; // À remplacer par speakeasy.generateSecret()
      const qrCode = 'TEMP_QR_CODE'; // À remplacer par QR code generation
      const backupCodes = ['123456', '789012', '345678', '901234', '567890'];

      // Sauvegarder le secret temporairement
      await User.updateOne(
        { _id: userId },
        { 
          twoFactorSecret: secret,
          twoFactorBackupCodes: backupCodes,
          twoFactorEnabled: false // Pas encore activé
        }
      );

      return {
        secret,
        qrCode,
        backupCodes
      };

    } catch (error) {
      console.error('Erreur setup 2FA:', error);
      throw error;
    }
  }

  /**
   * Activation 2FA
   */
  async enable2FA(userId: string, token: string): Promise<boolean> {
    try {
      // TODO: Vérifier le token 2FA avec speakeasy
      const isValid = true; // À remplacer par la vérification réelle

      if (isValid) {
        await User.updateOne(
          { _id: userId },
          { twoFactorEnabled: true }
        );
        return true;
      }

      return false;

    } catch (error) {
      console.error('Erreur activation 2FA:', error);
      throw error;
    }
  }

  /**
   * Vérification 2FA
   */
  async verify2FA(userId: string, token: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user || !user.twoFactorEnabled) {
        return false;
      }

      // TODO: Vérifier le token avec speakeasy
      const isValid = true; // À remplacer par la vérification réelle

      return isValid;

    } catch (error) {
      console.error('Erreur vérification 2FA:', error);
      return false;
    }
  }

  /**
   * Réinitialisation du mot de passe
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Ne pas révéler si l'email existe ou non
        return;
      }

      // Générer le token de reset
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // TODO: Envoyer l'email de reset
      // await this.sendPasswordResetEmail(user.email, resetToken);

    } catch (error) {
      console.error('Erreur request password reset:', error);
      throw error;
    }
  }

  /**
   * Réinitialisation du mot de passe
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      if (decoded.type !== 'password_reset') {
        throw new Error('Token invalide');
      }

      // Validation du nouveau mot de passe
      const validation = securityManager.validatePassword(newPassword);
      if (!validation.isValid) {
        throw new Error(`Mot de passe invalide: ${validation.errors.join(', ')}`);
      }

      // Hacher le nouveau mot de passe
      const hashedPassword = await securityManager.hashPassword(newPassword);

      // Mettre à jour le mot de passe
      await User.updateOne(
        { _id: decoded.userId },
        { 
          password: hashedPassword,
          passwordChangedAt: new Date()
        }
      );

    } catch (error) {
      console.error('Erreur reset password:', error);
      throw error;
    }
  }
}

// Export de l'instance singleton
export const authService = AuthService.getInstance();
