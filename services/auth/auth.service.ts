/**
 * Auth Service - DiaspoMoney
 * Service d'authentification Company-Grade
 * Basé sur la charte de développement
 */

import { securityManager } from '@/lib/security/advanced-security';
import User from '@/models/User';
import * as Sentry from '@sentry/nextjs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  isVerified: boolean;
  kycStatus: string;
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

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Vérifier les identifiants
      const userDoc = await (User as any)
        .findOne({
          email: credentials.email.toLowerCase(),
        })
        .exec();

      if (!userDoc || userDoc.status !== 'ACTIVE') {
        throw new Error('Identifiants invalides');
      }

      // Vérifier le mot de passe
      const isPasswordValid = await userDoc.comparePassword(
        credentials.password
      );

      if (!isPasswordValid) {
        throw new Error('Identifiants invalides');
      }

      // Génération des tokens
      const tokens = securityManager.generateTokens({
        id: userDoc._id?.toString() || userDoc.id,
        email: userDoc.email,
        role: userDoc.roles[0] || 'CUSTOMER',
      });

      // Mise à jour de la dernière connexion
      await (User as any)
        .findByIdAndUpdate(userDoc._id, {
          lastLogin: new Date(),
        })
        .exec();

      return {
        user: {
          id: userDoc._id?.toString() || userDoc.id,
          email: userDoc.email,
          role: userDoc.roles[0] || 'CUSTOMER',
          isVerified: userDoc.isEmailVerified,
          kycStatus: 'PENDING',
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 15 * 60, // 15 minutes
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
      if (data.password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUserDoc = await (User as any)
        .findOne({
          email: data.email.toLowerCase(),
        })
        .exec();

      if (existingUserDoc) {
        throw new Error('Un compte avec cet email existe déjà');
      }

      // Hacher le mot de passe
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Créer l'utilisateur
      const user = new User({
        email: data.email.toLowerCase(),
        password: hashedPassword,
        name: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        countryOfResidence: data.country,
        roles: ['CUSTOMER'], // Rôle par défaut
        status: 'ACTIVE',
        isEmailVerified: false,
        marketingConsent:
          data.consents.find(c => c.type === 'MARKETING')?.granted || false,
        kycConsent:
          data.consents.find(c => c.type === 'ANALYTICS')?.granted || false,
      });

      await user.save();

      // Générer le token de vérification email
      // const emailVerificationToken = jwt.sign(
      //   { userId: user._id?.toString() || user.id, type: "email_verification" },
      //   process.env["JWT_SECRET"]!,
      //   { expiresIn: "24h" },
      // );

      // TODO: Envoyer l'email de vérification
      // await this.sendVerificationEmail(user.email, emailVerificationToken);

      // Génération des tokens
      const tokens = securityManager.generateTokens({
        id: user._id?.toString() || user.id,
        email: user.email,
        role: user.roles[0] || 'CUSTOMER',
      });

      return {
        user: {
          id: user._id?.toString() || user.id,
          email: user.email,
          role: user.roles[0] || 'CUSTOMER',
          isVerified: false,
          kycStatus: 'PENDING',
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 15 * 60,
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
      const decoded = await securityManager.verifyToken(
        refreshToken,
        'refresh'
      );

      // Récupérer l'utilisateur
      const userDoc = await (User as any).findById(decoded.userId).exec();

      if (!userDoc || userDoc.status !== 'ACTIVE') {
        throw new Error('Utilisateur non trouvé ou inactif');
      }

      // Générer de nouveaux tokens
      const tokens = securityManager.generateTokens({
        id: userDoc._id?.toString() || userDoc.id,
        email: userDoc.email,
        role: userDoc.roles[0] || 'CUSTOMER',
      });

      return {
        user: {
          id: userDoc._id?.toString() || userDoc.id,
          email: userDoc.email,
          role: userDoc.roles[0] || 'CUSTOMER',
          isVerified: userDoc.isEmailVerified,
          kycStatus: 'PENDING',
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 15 * 60,
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

      const userDoc = await (User as any).findById(decoded.userId).exec();

      if (!userDoc || userDoc.status !== 'ACTIVE') {
        throw new Error('Utilisateur non trouvé ou inactif');
      }

      return {
        id: userDoc._id?.toString() || userDoc.id,
        email: userDoc.email,
        role: userDoc.roles[0] || 'CUSTOMER',
        isVerified: userDoc.isEmailVerified,
        kycStatus: 'PENDING',
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
      await (User as any)
        .updateOne(
          { _id: userId },
          {
            twoFactorSecret: secret,
            twoFactorBackupCodes: backupCodes,
            twoFactorEnabled: false, // Pas encore activé
          }
        )
        .exec();

      return {
        secret,
        qrCode,
        backupCodes,
      };
    } catch (error) {
      console.error('Erreur setup 2FA:', error);
      throw error;
    }
  }

  /**
   * Activation 2FA
   */
  async enable2FA(userId: string, _token: string): Promise<boolean> {
    try {
      // TODO: Vérifier le token 2FA avec speakeasy
      const isValid = true; // À remplacer par la vérification réelle

      if (isValid) {
        await (User as any)
          .updateOne({ _id: userId }, { twoFactorEnabled: true })
          .exec();
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
  async verify2FA(userId: string, _token: string): Promise<boolean> {
    try {
      const userDoc = await (User as any).findById(userId).exec();
      if (!userDoc || !userDoc.twoFactorEnabled) {
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
   * Demande de réinitialisation du mot de passe
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    try {
      const userDoc = await (User as any)
        .findOne({ email: email.toLowerCase() })
        .exec();
      if (!userDoc) {
        // Ne pas révéler si l'email existe ou non
        return false;
      }

      // Générer le token de reset
      // const resetToken = jwt.sign(
      //   {
      //     userId: userDoc._id?.toString() || userDoc.id,
      //     type: "password_reset",
      //   },
      //   process.env["JWT_SECRET"]!,
      //   { expiresIn: "1h" },
      // );

      // TODO: Envoyer l'email de reset
      // await this.sendPasswordResetEmail(user.email, resetToken);

      return true;
    } catch (error) {
      console.error('Erreur request password reset:', error);
      return false;
    }
  }

  /**
   * Réinitialisation du mot de passe
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as any;
      if (decoded.type !== 'password_reset') {
        return false;
      }

      // Validation du nouveau mot de passe
      if (newPassword.length < 8) {
        return false;
      }

      // Hacher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Mettre à jour le mot de passe
      await (User as any)
        .updateOne(
          { _id: decoded.userId },
          {
            password: hashedPassword,
            passwordChangedAt: new Date(),
          }
        )
        .exec();

      return true;
    } catch (error) {
      console.error('Erreur reset password:', error);
      return false;
    }
  }
}

// Export de l'instance singleton
export const authService = AuthService.getInstance();

// Export des méthodes individuelles pour compatibilité
export const { requestPasswordReset, resetPassword } = authService;
