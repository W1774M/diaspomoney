/**
 * User Service - DiaspoMoney
 * Service de gestion des utilisateurs Company-Grade
 * Basé sur la charte de développement
 *
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Repository Pattern (via IUserRepository)
 * - Dependency Injection (injection du repository via constructor)
 * - Singleton Pattern (getInstance)
 * - Decorator Pattern (@Log, @Cacheable, @Validate)
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import {
  Validate,
  createValidationRule,
} from '@/lib/decorators/validate.decorator';
import { logger } from '@/lib/logger';
import { securityManager } from '@/lib/security/advanced-security';
import User from '@/models/User';
import {
  getBeneficiaryRepository,
  getKYCRepository,
  getNotificationRepository,
  getTransactionRepository,
  getUserRepository,
  type IBeneficiaryRepository,
  type IKYCRepository,
  type INotificationRepository,
  type ITransactionRepository,
  type IUserRepository,
} from '@/repositories';
import type { Beneficiary, BeneficiaryData } from '@/types/beneficiaries';
import type { KYCData, KYCDocument } from '@/types/kyc';
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

export class UserService {
  private static instance: UserService;
  private userRepository: IUserRepository;
  private beneficiaryRepository: IBeneficiaryRepository;
  private kycRepository: IKYCRepository;
  private notificationRepository: INotificationRepository;
  private transactionRepository: ITransactionRepository;

  private constructor() {
    // Dependency Injection : injecter les repositories
    this.userRepository = getUserRepository();
    this.beneficiaryRepository = getBeneficiaryRepository();
    this.kycRepository = getKYCRepository();
    this.notificationRepository = getNotificationRepository();
    this.transactionRepository = getTransactionRepository();
  }

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Récupérer tous les utilisateurs avec filtres
   */
  @Log({ level: 'info', logArgs: true })
  @Cacheable(300, { prefix: 'UserService:getUsers' }) // Cache 5 minutes
  async getUsers(filters: any = {}): Promise<{
    data: UserProfile[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      // Construire les filtres pour le repository
      const repositoryFilters: any = {};
      if (filters.role) {
        repositoryFilters.roles = filters.role;
      }
      if (filters.status) {
        repositoryFilters.status = filters.status;
      }

      // Utiliser le repository (Repository Pattern)
      const result = await this.userRepository.findUsersWithFilters(
        repositoryFilters,
        {
          limit: filters.limit || 50,
          offset: filters.offset || 0,
        },
      );

      logger.debug({ count: result.data.length }, 'Found users');

      return {
        data: result.data.map((user: any) => ({
          _id: user._id?.toString() || user.id,
          id: user._id?.toString() || user.id,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          name:
            user.name ||
            `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          phone: user.phone,
          country: user.country || user.countryOfResidence,
          roles: user.roles || [],
          status: user.status,
          isActive: user.status === 'ACTIVE' || user.isActive,
          isEmailVerified: user.isEmailVerified || user.emailVerified,
          kycStatus: user.kycStatus || 'PENDING',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          // Ajouter les champs spécifiques aux providers
          specialty: user.specialty,
          providerInfo: user.providerInfo,
          rating: user.providerInfo?.rating || user.rating || 0,
          reviewCount: user.providerInfo?.reviewCount || user.reviewCount || 0,
          city: user.city || user.targetCity,
          specialties: user.providerInfo?.specialties || user.specialties || [],
          services: user.providerInfo?.services || user.services || [],
          selectedServices: Array.isArray(user.selectedServices)
            ? user.selectedServices
            : typeof user.selectedServices === 'string'
            ? user.selectedServices.split(',').map((s: string) => s.trim())
            : [],
        })),
        total: result.total,
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
      createValidationRule(
        0,
        z.string().min(1, 'User ID is required'),
        'userId',
      ),
    ],
  })
  @Cacheable(600, { prefix: 'UserService:getUserProfile' }) // Cache 10 minutes
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      logger.debug({ userId }, 'getUserProfile - ID');

      // Utiliser le repository (Repository Pattern)
      const user = await this.userRepository.findById(userId);
      if (!user) {
        logger.warn({ userId }, 'Utilisateur non trouvé pour ID');
        throw new Error('Utilisateur non trouvé');
      }

      logger.debug(
        {
          _id: user._id || user.id,
          email: user.email,
          roles: user.roles,
          status: user.status,
        },
        'User trouvé',
      );

      // Construire l'objet UserProfile de manière conditionnelle pour éviter les erreurs TypeScript
      const userProfile: UserProfile = {
        _id: user._id?.toString() || user.id,
        id: user._id?.toString() || user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name:
          user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        roles: user.roles || [],
        status: user.status || 'PENDING',
        isActive: user.status === 'ACTIVE' || user.isActive || false,
        isEmailVerified:
          user.isEmailVerified || (user as any).emailVerified || false,
        kycStatus: (user as any).kycStatus || 'PENDING',
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date(),
        // Champs spécifiques aux providers
        specialty: (user as any).specialty,
        providerInfo: (user as any).providerInfo,
        rating: (user as any).providerInfo?.rating || (user as any).rating || 0,
        reviewCount:
          (user as any).providerInfo?.reviewCount ||
          (user as any).reviewCount ||
          0,
        city: (user as any).city || (user as any).targetCity,
        specialties:
          (user as any).providerInfo?.specialties ||
          (user as any).specialties ||
          [],
        services:
          (user as any).providerInfo?.services || (user as any).services || [],
        selectedServices: Array.isArray((user as any).selectedServices)
          ? (user as any).selectedServices
          : typeof (user as any).selectedServices === 'string'
          ? (user as any).selectedServices
              .split(',')
              .map((s: string) => s.trim())
          : [],
      };

      // Ajouter les champs optionnels seulement s'ils sont définis
      if (user.phone) {
        userProfile.phone = user.phone;
      }
      if (user.country || (user as any).countryOfResidence) {
        userProfile.country = user.country || (user as any).countryOfResidence;
      }

      return userProfile;
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
  @InvalidateCache('UserService:*') // Invalider le cache après mise à jour
  @Validate({
    rules: [
      createValidationRule(
        0,
        z.string().min(1, 'User ID is required'),
        'userId',
      ),
      createValidationRule(
        1,
        z
          .object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            phone: z.string().optional(),
            country: z.string().optional(),
            roles: z.array(z.string()).optional(),
            status: z.string().optional(),
            specialty: z.string().optional(),
            recommended: z.boolean().optional(),
            clientNotes: z.string().optional(),
            preferences: z
              .object({
                language: z.string().optional(),
                timezone: z.string().optional(),
                notifications: z.boolean().optional(),
              })
              .optional(),
          })
          .passthrough(),
        'data',
      ),
    ],
  })
  async updateUserProfile(
    userId: string,
    data: UpdateProfileData & {
      roles?: string[];
      status?: string;
      specialty?: string;
      recommended?: boolean;
      clientNotes?: string;
      preferences?: {
        language?: string;
        timezone?: string;
        notifications?: boolean;
      };
    },
  ): Promise<UserProfile> {
    try {
      // Validation des données
      if (data.phone && !this.isValidPhone(data.phone)) {
        throw new Error('Numéro de téléphone invalide');
      }

      if (data.country && !this.isValidCountry(data.country)) {
        throw new Error('Pays invalide');
      }

      // Construire l'objet de mise à jour
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.firstName !== undefined) updateData.firstName = data.firstName;
      if (data.lastName !== undefined) updateData.lastName = data.lastName;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.country !== undefined)
        updateData.countryOfResidence = data.country;
      if (data.roles !== undefined) updateData.roles = data.roles;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.specialty !== undefined) updateData.specialty = data.specialty;
      if (data.recommended !== undefined)
        updateData.recommended = data.recommended;
      if (data.clientNotes !== undefined)
        updateData.clientNotes = data.clientNotes;
      if (data.preferences !== undefined) {
        updateData.preferences = {
          ...updateData.preferences,
          ...data.preferences,
        };
      }

      // Utiliser le repository (Repository Pattern)
      const updatedUser = await this.userRepository.update(userId, updateData);

      if (!updatedUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Enregistrer l'événement
      await securityManager.detectAnomalies(userId, 'PROFILE_UPDATED', data);

      // Construire l'objet UserProfile de manière conditionnelle pour éviter les erreurs TypeScript
      const userProfile: UserProfile = {
        _id: updatedUser._id?.toString() || updatedUser.id,
        id: updatedUser._id?.toString() || updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        name:
          updatedUser.name ||
          `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
        roles: updatedUser.roles || [],
        status: updatedUser.status || 'PENDING',
        isActive:
          updatedUser.status === 'ACTIVE' || updatedUser.isActive || false,
        isEmailVerified:
          updatedUser.isEmailVerified ||
          (updatedUser as any).emailVerified ||
          false,
        kycStatus: (updatedUser as any).kycStatus || 'PENDING',
        createdAt: updatedUser.createdAt || new Date(),
        updatedAt: updatedUser.updatedAt || new Date(),
        specialty: (updatedUser as any).specialty,
        providerInfo: (updatedUser as any).providerInfo,
        rating:
          (updatedUser as any).providerInfo?.rating ||
          (updatedUser as any).rating ||
          0,
        reviewCount:
          (updatedUser as any).providerInfo?.reviewCount ||
          (updatedUser as any).reviewCount ||
          0,
      };

      // Ajouter les champs optionnels seulement s'ils sont définis
      if (updatedUser.phone) {
        userProfile.phone = updatedUser.phone;
      }
      if (updatedUser.country || (updatedUser as any).countryOfResidence) {
        userProfile.country =
          updatedUser.country || (updatedUser as any).countryOfResidence;
      }

      return userProfile;
    } catch (error) {
      logger.error({ error, userId }, 'Erreur updateUserProfile');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Supprimer le compte utilisateur (GDPR)
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('UserService:*') // Invalider le cache après suppression
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
      try {
        // Supprimer les notifications de l'utilisateur
        const notifications = await this.notificationRepository.findAll({
          recipientId: userId,
        });
        for (const notification of notifications) {
          await this.notificationRepository.delete(notification.id);
        }
        logger.info(
          { userId, count: notifications.length },
          'Notifications deleted',
        );

        // Désactiver les bénéficiaires de l'utilisateur
        const beneficiaries =
          await this.beneficiaryRepository.findActiveByPayer(userId);
        for (const beneficiary of beneficiaries.data) {
          await this.beneficiaryRepository.deactivate(beneficiary.id, userId);
        }
        logger.info(
          { userId, count: beneficiaries.data.length },
          'Beneficiaries deactivated',
        );

        // Supprimer les données KYC (documents sensibles)
        const kyc = await this.kycRepository.findByUserId(userId);
        if (kyc) {
          await this.kycRepository.delete(kyc._id);
          logger.info({ userId, kycId: kyc._id }, 'KYC data deleted');
        }
      } catch (cleanupError) {
        logger.error(
          { error: cleanupError, userId },
          'Error during data cleanup, continuing with account deletion',
        );
        // Ne pas bloquer la suppression si le nettoyage échoue
      }

      // Enregistrer l'événement de suppression
      await securityManager.detectAnomalies(userId, 'USER_DELETED');
      logger.info({ userId }, 'User account deleted successfully');
    } catch (error) {
      logger.error({ error, userId }, 'Erreur deleteUserAccount');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Ajouter un bénéficiaire
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BeneficiaryRepository:*') // Invalider le cache après création
  async addBeneficiary(
    userId: string,
    data: BeneficiaryData,
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
      const count = await this.beneficiaryRepository.countByPayer(userId);
      if (count >= 10) {
        throw new Error('Limite de bénéficiaires atteinte (10 max)');
      }

      // Créer le bénéficiaire via le repository
      const beneficiaryData: Partial<Beneficiary> = {
        payerId: userId,
        firstName: data.firstName,
        lastName: data.lastName,
        relationship: data.relationship,
        country: data.country,
        isActive: true,
      };
      if (data.email) {
        beneficiaryData.email = data.email;
      }
      if (data.phone) {
        beneficiaryData.phone = data.phone;
      }
      if (data.address) {
        beneficiaryData.address = data.address;
      }
      const beneficiary = await this.beneficiaryRepository.create(
        beneficiaryData,
      );

      logger.info(
        { userId, beneficiaryId: beneficiary.id },
        'Beneficiary added successfully',
      );
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
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'UserService:getBeneficiaries' }) // Cache 5 minutes
  async getBeneficiaries(userId: string): Promise<Beneficiary[]> {
    try {
      // Récupérer depuis la base de données via le repository
      const result = await this.beneficiaryRepository.findActiveByPayer(userId);
      logger.debug(
        { userId, count: result.data.length },
        'Beneficiaries retrieved successfully',
      );
      return result.data;
    } catch (error) {
      logger.error({ error, userId }, 'Erreur getBeneficiaries');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Supprimer un bénéficiaire
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BeneficiaryRepository:*') // Invalider le cache après désactivation
  async removeBeneficiary(
    userId: string,
    beneficiaryId: string,
  ): Promise<void> {
    try {
      // Vérifier que le bénéficiaire appartient à l'utilisateur et le désactiver
      const deactivated = await this.beneficiaryRepository.deactivate(
        beneficiaryId,
        userId,
      );
      if (!deactivated) {
        throw new Error(
          "Bénéficiaire non trouvé ou n'appartient pas à cet utilisateur",
        );
      }
      logger.info(
        { userId, beneficiaryId },
        'Beneficiary removed successfully',
      );
    } catch (error) {
      logger.error(
        { error, userId, beneficiaryId },
        'Erreur removeBeneficiary',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Soumettre les documents KYC
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('KYCRepository:*') // Invalider le cache après création
  async submitKYCDocuments(
    userId: string,
    documents: KYCDocument[],
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
        submittedTypes.includes(type as any),
      );

      if (!hasRequiredType) {
        throw new Error(
          "Au moins une pièce d'identité requise (carte d'identité ou passeport)",
        );
      }

      // Créer les données KYC via le repository
      const kycData = await this.kycRepository.create({
        userId,
        documents,
        status: 'PENDING',
        submittedAt: new Date(),
      });

      // Mettre à jour le statut KYC de l'utilisateur
      await this.userRepository.update(userId, {
        kycStatus: 'IN_REVIEW',
        kycSubmittedAt: new Date(),
      } as any);

      logger.info(
        { userId, kycId: kycData._id },
        'KYC documents submitted successfully',
      );
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
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'UserService:getKYCStatus' }) // Cache 5 minutes
  async getKYCStatus(userId: string): Promise<KYCData | null> {
    try {
      // Récupérer depuis la base de données via le repository
      const kyc = await this.kycRepository.findByUserId(userId);
      logger.debug({ userId, found: !!kyc }, 'KYC status retrieved');
      return kyc;
    } catch (error) {
      logger.error({ error, userId }, 'Erreur getKYCStatus');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Exporter les données utilisateur (GDPR)
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async exportUserData(userId: string): Promise<any> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Récupérer toutes les données associées via les repositories
      const [transactions, beneficiaries, kyc] = await Promise.all([
        this.transactionRepository.findWithPagination({
          $or: [{ payerId: userId }, { beneficiaryId: userId }],
        }),
        this.beneficiaryRepository.findByPayer(userId),
        this.kycRepository.findByUserId(userId),
      ]);

      const exportData = {
        personal_info: {
          id: user.id || user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          country: user.country || (user as any).countryOfResidence,
          roles: user.roles,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        transactions: transactions.data.map(t => ({
          id: t.id,
          amount: t.amount,
          currency: t.currency,
          status: t.status,
          createdAt: t.createdAt,
        })),
        beneficiaries: beneficiaries.data.map(b => ({
          id: b.id,
          firstName: b.firstName,
          lastName: b.lastName,
          email: b.email,
          relationship: b.relationship,
          createdAt: b.createdAt,
        })),
        kyc: kyc
          ? {
              status: kyc.status,
              submittedAt: kyc.submittedAt,
              documents: kyc.documents.map(doc => ({
                type: doc.type,
                status: doc.status,
                uploadedAt: doc.uploadedAt,
              })),
            }
          : null,
        exported_at: new Date().toISOString(),
      };

      logger.info({ userId }, 'User data exported successfully');
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
