/**
 * User Service - DiaspoMoney
 * Service de gestion des utilisateurs Company-Grade
 * Basé sur la charte de développement
 */

import { Cacheable } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { Validate, ValidationRule } from '@/lib/decorators/validate.decorator';
import { logger } from '@/lib/logger';
import { securityManager } from '@/lib/security/advanced-security';
import User from '@/models/User';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

export interface UserProfile {
  _id?: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  phone?: string;
  country?: string;
  roles?: string[];
  status?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  kycStatus?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Champs spécifiques aux providers
  specialty?: string;
  providerInfo?: any;
  rating?: number;
  reviewCount?: number;
  city?: string;
  specialties?: string[];
  services?: string[];
  selectedServices?: string[];
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

export interface BeneficiaryData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  relationship: 'PARENT' | 'CHILD' | 'SPOUSE' | 'SIBLING' | 'FRIEND' | 'OTHER';
  country: string;
  address?: string;
}

export interface Beneficiary extends BeneficiaryData {
  id: string;
  payerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KYCDocument {
  type:
    | 'ID_CARD'
    | 'PASSPORT'
    | 'DRIVER_LICENSE'
    | 'UTILITY_BILL'
    | 'BANK_STATEMENT';
  fileUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export interface KYCData {
  documents: KYCDocument[];
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export class UserService {
  private static instance: UserService;

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Récupérer tous les utilisateurs avec filtres
   */
  @Cacheable(300, { prefix: 'UserService:getUsers' }) // Cache 5 minutes
  async getUsers(filters: any = {}): Promise<{
    data: UserProfile[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const query: any = {};

      // Corriger la requête pour utiliser 'roles' (array) au lieu de 'role' (string)
      if (filters.role) {
        query.roles = filters.role; // Utiliser 'roles' qui est un array dans le modèle
      }

      if (filters.status) {
        query.status = filters.status; // Utiliser 'status' au lieu de 'isActive'
      }

      logger.debug({ query }, 'Query filters');

      const users = await (User as any)
        .find(query)
        .limit(filters.limit || 50)
        .skip(filters.offset || 0)
        .exec();

      const total = await (User as any).countDocuments(query);

      logger.debug({ count: users.length }, 'Found users');

      return {
        data: users.map((user: any) => ({
          _id: user._id?.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          phone: user.phone,
          country: user.countryOfResidence,
          roles: user.roles,
          status: user.status,
          isActive: user.status === 'ACTIVE',
          isEmailVerified: user.emailVerified,
          kycStatus: user.kycStatus || 'PENDING',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          // Ajouter les champs spécifiques aux providers
          specialty: user.specialty,
          providerInfo: user.providerInfo,
          rating: user.providerInfo?.rating || 0,
          reviewCount: user.providerInfo?.reviewCount || 0,
          city: user.targetCity,
          specialties: user.providerInfo?.specialties || user.specialties || [],
          services: user.providerInfo?.services || user.services || [],
          selectedServices: Array.isArray(user.selectedServices)
            ? user.selectedServices
            : typeof user.selectedServices === 'string'
            ? user.selectedServices.split(',').map((s: string) => s.trim())
            : [],
        })),
        total,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      };
    } catch (error) {
      logger.error({ error }, 'Erreur getUsers');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer le profil utilisateur
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      ValidationRule(0, z.string().min(1, 'User ID is required'), 'userId'),
    ],
  })
  @Cacheable(600, { prefix: 'UserService:getUserProfile' }) // Cache 10 minutes
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      logger.debug({ userId }, 'getUserProfile - ID');

      const user = await (User as any).findById(userId).exec();
      if (!user) {
        logger.warn({ userId }, 'Utilisateur non trouvé pour ID');
        throw new Error('Utilisateur non trouvé');
      }

      logger.debug({
        _id: user._id,
        email: user.email,
        roles: user.roles,
        status: user.status,
      }, 'User trouvé');

      return {
        _id: user._id?.toString(),
        id: user._id?.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        phone: user.phone,
        country: user.countryOfResidence,
        roles: user.roles,
        status: user.status,
        isActive: user.status === 'ACTIVE',
        isEmailVerified: user.emailVerified,
        kycStatus: user.kycStatus || 'PENDING',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Champs spécifiques aux providers
        specialty: user.specialty,
        providerInfo: user.providerInfo,
        rating: user.providerInfo?.rating || 0,
        reviewCount: user.providerInfo?.reviewCount || 0,
        city: user.targetCity,
        specialties: user.providerInfo?.specialties || user.specialties || [],
        services: user.providerInfo?.services || user.services || [],
        selectedServices: Array.isArray(user.selectedServices)
          ? user.selectedServices
          : typeof user.selectedServices === 'string'
          ? user.selectedServices.split(',').map((s: string) => s.trim())
          : [],
      };
    } catch (error) {
      logger.error({ error, userId }, 'Erreur getUserProfile');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      ValidationRule(0, z.string().min(1, 'User ID is required'), 'userId'),
      ValidationRule(1, z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        country: z.string().optional(),
      }).passthrough(), 'data'),
    ],
  })
  async updateUserProfile(
    userId: string,
    data: UpdateProfileData
  ): Promise<UserProfile> {
    try {
      // Validation des données
      if (data.phone && !this.isValidPhone(data.phone)) {
        throw new Error('Numéro de téléphone invalide');
      }

      if (data.country && !this.isValidCountry(data.country)) {
        throw new Error('Pays invalide');
      }

      // Mise à jour de l'utilisateur
      const updatedUser = await (User as any).findByIdAndUpdate(
        userId,
        {
          ...data,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Enregistrer l'événement
      await securityManager.detectAnomalies(userId, 'PROFILE_UPDATED', data);

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        country: updatedUser.country,
        roles: updatedUser.roles,
        status: updatedUser.status,
        isEmailVerified: updatedUser.isEmailVerified,
        kycStatus: updatedUser.kycStatus || 'PENDING',
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
    } catch (error) {
      logger.error({ error, userId }, 'Erreur updateUserProfile');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Supprimer le compte utilisateur (GDPR)
   */
  async deleteUserAccount(userId: string): Promise<void> {
    try {
      // Anonymiser au lieu de supprimer (pour les enregistrements légaux/financiers)
      await (User as any).findByIdAndUpdate(userId, {
        email: `deleted_${userId}@anonymized.com`,
        phone: null,
        firstName: '[DELETED]',
        lastName: '[DELETED]',
        isActive: false,
        deletedAt: new Date(),
        gdprDeleted: true,
      });

      // Supprimer les données non essentielles
      // TODO: Supprimer les documents, notifications, etc.

      // Enregistrer l'événement de suppression
      await securityManager.detectAnomalies(userId, 'USER_DELETED');
    } catch (error) {
      logger.error({ error, userId }, 'Erreur deleteUserAccount');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Ajouter un bénéficiaire
   */
  async addBeneficiary(
    userId: string,
    data: BeneficiaryData
  ): Promise<Beneficiary> {
    try {
      // Validation des données
      if (!data.firstName || !data.lastName) {
        throw new Error('Prénom et nom requis');
      }

      if (!data.relationship) {
        throw new Error('Relation requise');
      }

      if (!this.isValidCountry(data.country)) {
        throw new Error('Pays invalide');
      }

      // Vérifier la limite de bénéficiaires
      const existingBeneficiaries = await this.getBeneficiaries(userId);
      if (existingBeneficiaries.length >= 10) {
        throw new Error('Limite de bénéficiaires atteinte (10 max)');
      }

      // Créer le bénéficiaire
      const beneficiary = {
        id: `beneficiary_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        payerId: userId,
        ...data,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TODO: Sauvegarder en base de données
      // await Beneficiary.create(beneficiary);

      return beneficiary;
    } catch (error) {
      logger.error({ error, userId }, 'Erreur addBeneficiary');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les bénéficiaires
   */
  async getBeneficiaries(_userId: string): Promise<Beneficiary[]> {
    try {
      // TODO: Récupérer depuis la base de données
      // const beneficiaries = await Beneficiary.find({ payerId: userId, isActive: true });

      // Simulation pour l'instant
      return [];
    } catch (error) {
      logger.error({ error, userId: _userId }, 'Erreur getBeneficiaries');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Supprimer un bénéficiaire
   */
  async removeBeneficiary(
    _userId: string,
    _beneficiaryId: string
  ): Promise<void> {
    try {
      // TODO: Vérifier que le bénéficiaire appartient à l'utilisateur
      // TODO: Désactiver le bénéficiaire
      // await Beneficiary.updateOne(
      //   { id: beneficiaryId, payerId: userId },
      //   { isActive: false, updatedAt: new Date() }
      // );
    } catch (error) {
      logger.error({ error, userId: _userId, beneficiaryId: _beneficiaryId }, 'Erreur removeBeneficiary');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Soumettre les documents KYC
   */
  async submitKYCDocuments(
    userId: string,
    documents: KYCDocument[]
  ): Promise<KYCData> {
    try {
      // Validation des documents
      if (documents.length === 0) {
        throw new Error('Au moins un document requis');
      }

      // Vérifier les types de documents requis
      const requiredTypes = ['ID_CARD', 'PASSPORT'];
      const submittedTypes = documents.map(doc => doc.type);
      const hasRequiredType = requiredTypes.some(type =>
        submittedTypes.includes(type as any)
      );

      if (!hasRequiredType) {
        throw new Error(
          "Au moins une pièce d'identité requise (carte d'identité ou passeport)"
        );
      }

      // Créer les données KYC
      const kycData: KYCData = {
        documents,
        status: 'PENDING',
        submittedAt: new Date(),
      };

      // TODO: Sauvegarder en base de données
      // await KYC.create({ userId, ...kycData });

      // Mettre à jour le statut KYC de l'utilisateur
      await (User as any).findByIdAndUpdate(userId, {
        kycStatus: 'IN_REVIEW',
        kycSubmittedAt: new Date(),
      });

      return kycData;
    } catch (error) {
      logger.error({ error, userId }, 'Erreur submitKYCDocuments');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer le statut KYC
   */
  async getKYCStatus(_userId: string): Promise<KYCData | null> {
    try {
      // TODO: Récupérer depuis la base de données
      // const kyc = await KYC.findOne({ userId });
      // return kyc;

      return null;
    } catch (error) {
      logger.error({ error, userId: _userId }, 'Erreur getKYCStatus');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Exporter les données utilisateur (GDPR)
   */
  async exportUserData(userId: string): Promise<any> {
    try {
      const user = await (User as any).findById(userId).exec();
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // TODO: Récupérer toutes les données associées
      // const transactions = await Transaction.find({ userId });
      // const beneficiaries = await Beneficiary.find({ payerId: userId });
      // const kyc = await KYC.findOne({ userId });

      const exportData = {
        personal_info: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          country: user.country,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        // transactions: transactions.map(t => t.toJSON()),
        // beneficiaries: beneficiaries.map(b => b.toJSON()),
        // kyc: kyc?.toJSON(),
        exported_at: new Date().toISOString(),
      };

      return exportData;
    } catch (error) {
      logger.error({ error, userId }, 'Erreur exportUserData');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Validation du numéro de téléphone
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validation du pays
   */
  private isValidCountry(country: string): boolean {
    const validCountries = [
      'FR',
      'DE',
      'ES',
      'IT',
      'BE',
      'NL',
      'CH',
      'AT',
      'LU',
      'IE',
      'SN',
      'CI',
      'CM',
      'BF',
      'ML',
      'NE',
      'TD',
      'GN',
      'LR',
      'SL',
    ];
    return validCountries.includes(country.toUpperCase());
  }
}

// Export de l'instance singleton
export const userService = UserService.getInstance();
