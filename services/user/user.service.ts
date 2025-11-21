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
import { Validate } from '@/lib/decorators/validate.decorator';
import { USER_STATUSES } from '@/lib/constants';
import { logger } from '@/lib/logger';
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
import type { Beneficiary, BeneficiaryData, KYCData, KYCDocument, ProviderInfo, Service, User, UserDocument, UserFilters, UserUpdateData } from '@/lib/types';
import { securityManager } from '@/lib/security/advanced-security';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { UpdateUserSchema } from '@/lib/validations/index';

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
  specialty?: string;
  providerInfo?: {
    rating?: number;
    reviewCount?: number;
    specialties?: string[];
    services?: string[];
    [key: string]: unknown;
  };
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

  @Log({ level: 'info', logArgs: true })
  @Cacheable(300, { prefix: 'UserService:getUsers' })
  async getUsers(filters: Partial<UserFilters> = {}): Promise<{
    data: UserProfile[];
    total: number;
    limit: number;
    offset: number;
    page: number;
  }> {
    try {
      const repositoryFilters: Record<string, unknown> = {};
      if (filters.roles) repositoryFilters['roles'] = filters.roles;
      if (filters.status) repositoryFilters['status'] = filters.status;

      const result = await this.userRepository.findUsersWithFilters(
        repositoryFilters,
        {
          limit: 50,
          page: 1,
          offset: 0,
        },
      );

      logger.debug({ count: result.data.length }, 'Found users');
      return {
        data: result.data.map((user: UserDocument) => {
          const profile: UserProfile = {
            _id: user._id?.toString() ?? user.id ?? '',
            id: user._id?.toString() ?? user.id ?? '',
            email: user.email,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            roles: user.roles || [],
            kycStatus: (user as any)['kycStatus'] ?? USER_STATUSES.PENDING,
            rating: (user['providerInfo'] && typeof user['providerInfo']['rating'] === 'number')
              ? user['providerInfo']['rating']
              : typeof user['rating'] === 'number'
                ? user['rating']
                : 0,
            reviewCount: (user['providerInfo'] && typeof user['providerInfo']['reviewCount'] === 'number')
              ? user['providerInfo']['reviewCount']
              : typeof user['reviewCount'] === 'number'
                ? user['reviewCount']
                : 0,
            specialties: Array.isArray(user['providerInfo']?.['specialties'])
              ? user['providerInfo']['specialties']
              : Array.isArray(user['specialties'])
                ? user['specialties']
                : [],
            services: Array.isArray(user['providerInfo']?.['services'])
              ? user['providerInfo']['services']
              : Array.isArray(user['services'])
                ? user['services']
                : [],
            selectedServices: Array.isArray(user['selectedServices'])
              ? user['selectedServices']
              : typeof user['selectedServices'] === 'string'
                ? (user['selectedServices'] as string).split(',').map((s: string) => s.trim())
                : [] as string[],
          };

          // Correct isActive logic: only set true if status ACTIVE, else false.
          profile.isActive = user.status === USER_STATUSES.ACTIVE ? true : false;

          // Be sure to assign emailVerified in all falsy cases, not just `undefined`
          profile.isEmailVerified = (typeof user.isEmailVerified === 'boolean')
            ? user.isEmailVerified
            : (typeof user.emailVerified === 'boolean')
              ? user.emailVerified
              : false;

          if (user.status) profile.status = user.status;
          if (typeof user['specialty'] === 'string') profile.specialty = user['specialty'];
          if (typeof user['providerInfo'] === 'object' && user['providerInfo'])
            profile.providerInfo = user['providerInfo'];
          if (typeof user.phone === 'string') profile.phone = user.phone;

          const cityValue = user['city'] ?? user['targetCity'];
          if (typeof cityValue === 'string') profile.city = cityValue;

          const countryValue = user.country ?? user['countryOfResidence'];
          if (typeof countryValue === 'string') profile.country = countryValue;

          if (user.createdAt instanceof Date) profile.createdAt = user.createdAt;
          else if (user.createdAt) profile.createdAt = new Date(user.createdAt);

          if (user.updatedAt instanceof Date) profile.updatedAt = user.updatedAt;
          else if (user.updatedAt) profile.updatedAt = new Date(user.updatedAt);

          return profile;
        }),
        total: result.total,
        limit: result.pagination.limit,
        page: result.pagination.page,
        offset: result.pagination.offset || 0,
      };
    } catch (error) {
      logger.error({ error }, 'Erreur getUsers');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.string().min(1, 'User ID is required'),
        paramName: 'userId',
      },
    ],
  })
  @Cacheable(600, { prefix: 'UserService:getUserProfile' })
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      logger.debug({ userId }, 'getUserProfile - ID');

      const user = await this.userRepository.findById(userId);
      if (!user) {
        logger.warn({ userId }, 'Utilisateur non trouvé pour ID');
        throw new Error('Utilisateur non trouvé');
      }

      logger.debug({
        _id: user._id ?? user.id,
        email: user.email,
        roles: user.roles,
        status: user.status,
      }, 'User trouvé');

      const userProfile: UserProfile = {
        _id: user._id?.toString() ?? user.id ?? '',
        id: user._id?.toString() ?? user.id ?? '',
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        roles: user.roles || [],
        status: user.status ?? USER_STATUSES.PENDING,
        isActive: user.status === USER_STATUSES.ACTIVE ? true : false,
        isEmailVerified: (typeof (user as any)['isEmailVerified'] === 'boolean')
          ? (user as any)['isEmailVerified']
          : (typeof user['emailVerified'] === 'boolean')
            ? user['emailVerified']
            : false,
        kycStatus: (user as any)['kycStatus'] ?? USER_STATUSES.PENDING,
        rating: (user['providerInfo'] && typeof user['providerInfo'].rating === 'number')
          ? user['providerInfo']['rating']
          : typeof user['rating'] === 'number'
            ? user['rating']
            : 0,
        reviewCount: (user['providerInfo'] && typeof user['providerInfo']['reviewCount'] === 'number')
          ? user['providerInfo']['reviewCount']
          : typeof user['reviewCount'] === 'number'
            ? user['reviewCount']
            : 0,
        specialties: Array.isArray(user['providerInfo']?.specialties)
          ? user['providerInfo']['specialties']
          : Array.isArray(user['specialties'])
            ? user['specialties']
            : [],
        services: Array.isArray(user['providerInfo']?.services)
          ? user['providerInfo']['services']
          : Array.isArray(user['services'])
            ? user['services']
            : [],
        selectedServices: Array.isArray(user['selectedServices'])
          ? user['selectedServices']
          : typeof user['selectedServices'] === 'string'
            ? (user['selectedServices'] as string).split(',').map((s: string) => s.trim())
            : [] as string[],
      };

      // Ajouter les propriétés optionnelles seulement si elles sont définies (exactOptionalPropertyTypes: true)
      if (typeof user['specialty'] === 'string') {
        userProfile.specialty = user['specialty'];
      }

      if (typeof user['providerInfo'] === 'object' && user['providerInfo']) {
        const providerInfo = user['providerInfo'] as ProviderInfo;
        // Convertir services de Service[] à string[] si nécessaire
        const services = Array.isArray(providerInfo.services)
          ? providerInfo.services.map((s: Service | string) => typeof s === 'string' ? s : s.id || s.name || '')
          : [];
        userProfile.providerInfo = {
          ...providerInfo,
          services,
        } as any; 
      }

      const cityValue = user['city'] ?? user['targetCity'];
      if (typeof cityValue === 'string') {
        userProfile.city = cityValue;
      }

      if (user.createdAt) {
        userProfile.createdAt = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt);
      }

      if (user.updatedAt) {
        userProfile.updatedAt = user.updatedAt instanceof Date ? user.updatedAt : new Date(user.updatedAt);
      }

      if (typeof user.phone === 'string') {
        userProfile.phone = user.phone;
      }

      const countryVal = (user as any)['country'] ?? user['countryOfResidence'];
      if (typeof countryVal === 'string') {
        userProfile.country = countryVal;
      }

      return userProfile;
    } catch (error) {
      logger.error({ error, userId }, 'Erreur getUserProfile');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('UserService:*')
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.string().min(1, 'User ID is required'),
        paramName: 'userId',
      },
      {
        paramIndex: 1,
        schema: UpdateUserSchema.passthrough(),
        paramName: 'data',
      },
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
      if (data.phone && !this.isValidPhone(data.phone)) {
        throw new Error('Numéro de téléphone invalide');
      }

      if (data.country && !this.isValidCountry(data.country)) {
        throw new Error('Pays invalide');
      }

      const updateData: UserUpdateData = { updatedAt: new Date() };
      if ('firstName' in data) updateData.firstName = data.firstName;
      if ('lastName' in data) updateData.lastName = data.lastName;
      if ('phone' in data) updateData.phone = data.phone;
      if ('country' in data) updateData.countryOfResidence = data.country;
      if ('roles' in data) updateData.roles = data.roles;
      if ('status' in data) updateData.status = data.status;
      if ('specialty' in data) updateData.specialty = data.specialty;
      if ('recommended' in data) updateData.recommended = data.recommended;
      if ('clientNotes' in data) updateData.clientNotes = data.clientNotes;
      if ('preferences' in data && data.preferences) {
        const currentPrefs = updateData.preferences || {};
        const newPrefs: Partial<User['preferences']> = {
          language: data.preferences.language ?? currentPrefs.language ?? '',
          timezone: data.preferences.timezone ?? currentPrefs.timezone ?? '',
          notifications: data.preferences.notifications ?? currentPrefs.notifications ?? false,
        };
        updateData.preferences = newPrefs as any;
      }

      const updatedUser = await this.userRepository.update(userId, updateData as Partial<User>);

      if (!updatedUser) {
        throw new Error('Utilisateur non trouvé');
      }

      await securityManager.detectAnomalies(userId, 'PROFILE_UPDATED', data);

      const updatedUserDoc = updatedUser as UserDocument;
      const userProfile: UserProfile = {
        _id: updatedUserDoc._id?.toString() ?? updatedUserDoc.id ?? '',
        id: updatedUserDoc._id?.toString() ?? updatedUserDoc.id ?? '',
        email: updatedUserDoc.email,
        firstName: updatedUserDoc.firstName || '',
        lastName: updatedUserDoc.lastName || '',
        name: updatedUserDoc.name || `${updatedUserDoc.firstName || ''} ${updatedUserDoc.lastName || ''}`.trim(),
        roles: updatedUserDoc.roles || [],
        kycStatus: updatedUserDoc.kycStatus ?? USER_STATUSES.PENDING,
        rating:
          (updatedUserDoc['providerInfo'] && typeof updatedUserDoc['providerInfo']['rating'] === 'number'
            ? updatedUserDoc['providerInfo']['rating']
            : typeof updatedUserDoc['rating'] === 'number'
            ? updatedUserDoc['rating']
            : 0),
        reviewCount:
          (updatedUserDoc['providerInfo'] && typeof updatedUserDoc['providerInfo']['reviewCount'] === 'number'
            ? updatedUserDoc['providerInfo']['reviewCount']
            : typeof updatedUserDoc['reviewCount'] === 'number'
            ? updatedUserDoc['reviewCount']
            : 0),
        specialties: Array.isArray(updatedUserDoc['providerInfo']?.['specialties'])
          ? updatedUserDoc['providerInfo']['specialties']
          : Array.isArray(updatedUserDoc['specialties'])
            ? updatedUserDoc['specialties']
            : [],
        services: Array.isArray(updatedUserDoc['providerInfo']?.['services'])
          ? updatedUserDoc['providerInfo']['services']
          : Array.isArray(updatedUserDoc['services'])
            ? updatedUserDoc['services']
            : [],
        selectedServices: Array.isArray(updatedUserDoc['selectedServices'])
          ? updatedUserDoc['selectedServices']
          : typeof updatedUserDoc['selectedServices'] === 'string'
            ? (updatedUserDoc['selectedServices'] as string).split(',').map((s: string) => s.trim())
            : [],
      };

      userProfile.isActive = updatedUserDoc.status === USER_STATUSES.ACTIVE ? true : false;
      userProfile.isEmailVerified = (typeof updatedUserDoc.isEmailVerified === 'boolean')
        ? updatedUserDoc.isEmailVerified
        : (typeof updatedUserDoc.emailVerified === 'boolean')
          ? updatedUserDoc.emailVerified
          : false;

      if (updatedUserDoc.status) userProfile.status = updatedUserDoc.status;
      if (typeof updatedUserDoc.specialty === 'string') userProfile.specialty = updatedUserDoc.specialty;
      if (typeof updatedUserDoc.providerInfo === 'object' && updatedUserDoc.providerInfo) userProfile.providerInfo = updatedUserDoc.providerInfo;
      if (typeof updatedUserDoc.phone === 'string') userProfile.phone = updatedUserDoc.phone;

      const cityValue = updatedUserDoc['city'] ?? updatedUserDoc.targetCity;
      if (typeof cityValue === 'string') userProfile.city = cityValue;

      const countryValue = updatedUserDoc.country ?? updatedUserDoc.countryOfResidence;
      if (typeof countryValue === 'string') userProfile.country = countryValue;

      if (updatedUserDoc.createdAt instanceof Date) userProfile.createdAt = updatedUserDoc.createdAt;
      else if (updatedUserDoc.createdAt) userProfile.createdAt = new Date(updatedUserDoc.createdAt);

      if (updatedUserDoc.updatedAt instanceof Date) userProfile.updatedAt = updatedUserDoc.updatedAt;
      else if (updatedUserDoc.updatedAt) userProfile.updatedAt = new Date(updatedUserDoc.updatedAt);

      return userProfile;
    } catch (error) {
      logger.error({ error, userId }, 'Erreur updateUserProfile');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('UserService:*')
  async deleteUserAccount(userId: string): Promise<void> {
    try {
      // Anonymiser l'utilisateur au lieu de le supprimer (GDPR compliance)
      const anonymizeData: UserUpdateData = {
        email: `deleted_${userId}@anonymized.com`,
        firstName: '[DELETED]',
        lastName: '[DELETED]',
        isActive: false,
        deletedAt: new Date(),
        gdprDeleted: true,
      };
      // Ne pas inclure phone si on veut le supprimer (exactOptionalPropertyTypes: true)
      // Le repository gérera la suppression si nécessaire
      await this.userRepository.update(userId, anonymizeData as Partial<User>);

      try {
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

        const beneficiaries = await this.beneficiaryRepository.findActiveByPayer(userId);
        for (const beneficiary of beneficiaries.data) {
          await this.beneficiaryRepository.deactivate(beneficiary.id, userId);
        }
        logger.info(
          { userId, count: beneficiaries.data.length },
          'Beneficiaries deactivated',
        );

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
      }

      await securityManager.detectAnomalies(userId, 'USER_DELETED');
      logger.info({ userId }, 'User account deleted successfully');
    } catch (error) {
      logger.error({ error, userId }, 'Erreur deleteUserAccount');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BeneficiaryRepository:*')
  async addBeneficiary(
    userId: string,
    data: BeneficiaryData,
  ): Promise<Beneficiary> {
    try {
      if (!data.firstName || !data.lastName) {
        throw new Error('Prénom et nom requis');
      }

      if (!data.relationship) {
        throw new Error('Relation requise');
      }

      if (!this.isValidCountry(data.country)) {
        throw new Error('Pays invalide');
      }

      const count = await this.beneficiaryRepository.countByPayer(userId);
      if (count >= 10) {
        throw new Error('Limite de bénéficiaires atteinte (10 max)');
      }

      const beneficiaryData: Partial<Beneficiary> = {
        payerId: userId,
        firstName: data.firstName,
        lastName: data.lastName,
        relationship: data.relationship,
        country: data.country,
        isActive: true,
      };
      if (typeof data.email === 'string') beneficiaryData.email = data.email;
      if (typeof data.phone === 'string') beneficiaryData.phone = data.phone;
      if (typeof data.address === 'string') beneficiaryData.address = data.address;
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

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'UserService:getBeneficiaries' })
  async getBeneficiaries(userId: string): Promise<Beneficiary[]> {
    try {
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

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BeneficiaryRepository:*')
  async removeBeneficiary(
    userId: string,
    beneficiaryId: string,
  ): Promise<void> {
    try {
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

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('KYCRepository:*')
  async submitKYCDocuments(
    userId: string,
    documents: KYCDocument[],
  ): Promise<KYCData> {
    try {
      if (!Array.isArray(documents) || documents.length === 0) {
        throw new Error('Au moins un document requis');
      }

      const requiredTypes: ('ID_CARD' | 'PASSPORT')[] = ['ID_CARD', 'PASSPORT'];
      const submittedTypes = documents.map(doc => doc.type);
      const hasRequiredType = requiredTypes.some(type =>
        submittedTypes.includes(type as any),
      );

      if (!hasRequiredType) {
        throw new Error(
          "Au moins une pièce d'identité requise (carte d'identité ou passeport)",
        );
      }

      const kycData = await this.kycRepository.create({
        userId,
        documents,
        status: 'PENDING',
        submittedAt: new Date(),
      });

      await this.userRepository.update(userId, {
        kycStatus: 'IN_REVIEW',
        kycSubmittedAt: new Date(),
      } as Partial<User>);

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

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'UserService:getKYCStatus' })
  async getKYCStatus(userId: string): Promise<KYCData | null> {
    try {
      const kyc = await this.kycRepository.findByUserId(userId);
      logger.debug({ userId, found: !!kyc }, 'KYC status retrieved');
      return kyc;
    } catch (error) {
      logger.error({ error, userId }, 'Erreur getKYCStatus');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const [transactions, beneficiaries, kyc] = await Promise.all([
        this.transactionRepository.findWithPagination({
          $or: [{ payerId: userId }, { beneficiaryId: userId }],
        }),
        this.beneficiaryRepository.findByPayer(userId),
        this.kycRepository.findByUserId(userId),
      ]);

      const exportData = {
        personal_info: {
          id: user.id ?? user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          country: (user as any)['country'] ?? (user as UserDocument).countryOfResidence,
          roles: user.roles,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        transactions: Array.isArray(transactions.data) ? transactions.data.map((t: { id: string; amount: number; currency: string; status: string; createdAt: Date }) => ({
          id: t.id,
          amount: t.amount,
          currency: t.currency,
          status: t.status,
          createdAt: t.createdAt,
        })) : [],
        beneficiaries: Array.isArray(beneficiaries.data) ? beneficiaries.data.map((b: Beneficiary) => ({
          id: b.id,
          firstName: b.firstName,
          lastName: b.lastName,
          email: b.email || '',
          relationship: b.relationship,
          createdAt: b.createdAt,
        })) : [],
        kyc: kyc
          ? {
              status: kyc.status,
              submittedAt: kyc.submittedAt,
              documents: Array.isArray(kyc.documents)
                ? kyc.documents.map((doc: { type: string; status: string; uploadedAt: Date }) => ({
                    type: doc.type,
                    status: doc.status,
                    uploadedAt: doc.uploadedAt,
                  }))
                : [],
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

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  private isValidCountry(country: string): boolean {
    const validCountries = [
      'FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'CH', 'AT', 'LU', 'IE',
      'SN', 'CI', 'CM', 'BF', 'ML', 'NE', 'TD', 'GN', 'LR', 'SL',
    ];
    return typeof country === 'string' && validCountries.includes(country.toUpperCase());
  }
}

export const userService = UserService.getInstance();
