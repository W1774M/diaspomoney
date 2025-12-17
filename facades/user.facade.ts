/**
 * User Facade - DiaspoMoney
 *
 * Facade Pattern pour simplifier le processus de gestion d'utilisateur complet
 * Orchestre UserService, KYCService et NotificationService
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Retry, RetryHelpers } from '@/lib/decorators/retry.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { Audit } from '@/lib/decorators/audit.decorator';
import { Performance } from '@/lib/decorators/performance.decorator';
import { Transaction } from '@/lib/decorators/transaction.decorator';
import { Cacheable } from '@/lib/decorators/cache.decorator';
import { logger } from '@/lib/logger';
import { LANGUAGES, USER_STATUSES, KYC_STATUSES } from '@/lib/constants';
import { notificationService } from '@/services/notification/notification.service';
import { userService } from '@/services/user/user.service';
import { userMapper } from '@/lib/mappers';
import * as Sentry from '@sentry/nextjs';
import type { UserFacadeData, UserFacadeResult, IFacade, FacadeOptions, User, UserRole, UserStatus, UserFilters, PaginationOptions, UserResponse } from '@/lib/types';
import { z } from 'zod';

// Réexporter pour compatibilité
export type { UserFacadeData, UserFacadeResult };

const CreateUserFacadeSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  roles: z.array(z.string()).optional(),
  status: z.string().optional(),
  kycData: z
    .object({
      documents: z.array(
        z.object({
          type: z.string(),
          fileUrl: z.string(),
        }),
      ),
    })
    .optional(),
  sendWelcomeNotification: z.boolean().optional(),
});

/**
 * UserFacade - Facade pour le processus de gestion d'utilisateur complet
 */
export class UserFacade implements IFacade<UserFacadeData, UserFacadeResult> {
  private static instance: UserFacade;

  private constructor() {}

  static getInstance(): UserFacade {
    if (!UserFacade.instance) {
      UserFacade.instance = new UserFacade();
    }
    return UserFacade.instance;
  }

  /**
   * Exécuter la facade (implémentation de IFacade)
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: CreateUserFacadeSchema,
        paramName: 'data',
      },
    ],
  })
  async execute(
    data: UserFacadeData,
    _options?: FacadeOptions,
  ): Promise<UserFacadeResult> {
    return this.createUserWithKYC(data);
  }

  @Retry({
    maxAttempts: 2,
    delay: 1000,
    backoff: 'exponential',
    shouldRetry: (error: any) => {
      return (
        RetryHelpers.retryOnNetworkOrServerError(error) &&
        !error.message?.includes('déjà existe') &&
        !error.message?.includes('invalide')
      );
    },
  })
  @Audit({ eventType: 'USER_CREATED', includeArgs: true })
  @Performance({ warningThreshold: 3000, errorThreshold: 8000 })
  @Transaction()
  async createUserWithKYC(data: UserFacadeData): Promise<UserFacadeResult> {
    try {
      logger.info(
        {
          email: data.email,
          name: data.name,
          hasKYCData: !!data.kycData,
        },
        'UserFacade.createUserWithKYC called',
      );

      // Créer l'utilisateur
      const userData = {
        email: data.email,
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        roles: data.roles || [],
        status: data.status || USER_STATUSES.PENDING, // Respecter le statut passé ou PENDING par défaut
        metadata: data.metadata,
      };

      // Créer l'utilisateur via le repository (UserService n'a pas de méthode createUser)
      const { getUserRepository } = await import('@/repositories');
      const userRepository = getUserRepository();
      
      // Préparer les données en excluant les propriétés undefined pour exactOptionalPropertyTypes
      const userDataToCreate: Partial<User> = {
        email: userData.email,
        name: userData.name,
        roles: (userData.roles || []) as UserRole[],
        status: (userData.status || USER_STATUSES.PENDING) as UserStatus, // Respecter le statut passé ou PENDING par défaut
        ...(userData.firstName && { firstName: userData.firstName }),
        ...(userData.lastName && { lastName: userData.lastName }),
        ...(userData.phone && { phone: userData.phone }),
        ...(userData.metadata && { metadata: userData.metadata }),
      };
      
      // Utiliser createWithPassword si un password est fourni (pour l'inscription)
      const user = data.password
        ? await userRepository.createWithPassword({
            ...userDataToCreate,
            password: data.password,
          })
        : await userRepository.create(userDataToCreate);
      const mappedUser = userMapper.map(user);

      // Créer les données KYC si fournies
      let kycData = null;
      if (data.kycData && data.kycData.documents.length > 0) {
        try {
          kycData = await userService.submitKYCDocuments(
            user.id || user._id?.toString() || '',
            data.kycData.documents.map((doc) => ({
              type: doc.type as any,
              fileUrl: doc.fileUrl,
              status: KYC_STATUSES.PENDING,
              uploadedAt: new Date(),
            })),
          );
        } catch (kycError) {
          logger.warn(
            { error: kycError, userId: user.id },
            'Failed to create KYC data, but user was created',
          );
        }
      }

      // Envoyer une notification de bienvenue si demandé
      let notificationSent = false;
      if (data.sendWelcomeNotification !== false) {
        try {
          await notificationService.sendWelcomeNotification(
            user.email,
            user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            LANGUAGES.FR.code,
          );
          notificationSent = true;
        } catch (notificationError) {
          logger.warn(
            { error: notificationError, userId: user.id },
            'Failed to send welcome notification',
          );
        }
      }

      logger.info(
        {
          userId: user.id || user._id?.toString(),
          notificationSent,
          hasKYC: !!kycData,
        },
        'User created successfully',
      );

      return {
        success: true,
        user: mappedUser,
        kycData,
        notificationSent,
        message: 'Utilisateur créé avec succès',
      };
    } catch (error: any) {
      logger.error(
        {
          error,
          email: data.email,
          name: data.name,
        },
        'Error in UserFacade.createUserWithKYC',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'UserFacade',
          action: 'createUserWithKYC',
        },
        extra: {
          email: data.email,
          name: data.name,
        },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de la création de l\'utilisateur',
        errorCode: 'USER_CREATION_FAILED',
      };
    }
  }

  /**
   * Récupérer les utilisateurs avec filtres et pagination
   * Implémente le Facade Pattern pour simplifier l'accès aux utilisateurs
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'UserFacade:getUsers' })
  @Audit({ eventType: 'USERS_RETRIEVED', includeArgs: false })
  @Performance({ warningThreshold: 2000, errorThreshold: 5000 })
  async getUsers(
    filters: Partial<UserFilters> = {},
    pagination: PaginationOptions = { limit: 20, page: 1 },
  ): Promise<{
    success: boolean;
    data?: UserResponse[];
    total?: number;
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
    error?: string;
  }> {
    try {
      logger.info(
        {
          filters,
          pagination,
        },
        'UserFacade.getUsers called',
      );

      // Utiliser UserQueryBuilder pour construire la requête
      const { UserQueryBuilder } = await import('@/builders');
      const queryBuilder = new UserQueryBuilder();

      // Appliquer les filtres
      if (filters.role) {
        queryBuilder.byRole(filters.role);
      }
      if (filters.status) {
        // Gérer le cas où status peut être un tableau ou une chaîne
        if (Array.isArray(filters.status) && filters.status.length > 0) {
          // Si c'est un tableau, utiliser le premier élément
          const firstStatus = filters.status[0];
          if (typeof firstStatus === 'string') {
            queryBuilder.byStatus(firstStatus);
          }
        } else if (typeof filters.status === 'string') {
          queryBuilder.byStatus(filters.status);
        }
      }
      if (filters.search) {
        queryBuilder.whereOr([
          { firstName: { $regex: filters.search, $options: 'i' } },
          { lastName: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
        ]);
      }

      // Appliquer la pagination
      queryBuilder.page(pagination.page || 1, pagination.limit || 20);

      // Construire et exécuter la requête via le repository
      const query = queryBuilder.build();
      const { getUserRepository } = await import('@/repositories');
      const userRepository = getUserRepository();

      // Normaliser pagination pour garantir limit et page
      const normalizedPagination: PaginationOptions = {
        limit: query.pagination.limit ?? pagination.limit ?? 20,
        page: query.pagination.page ?? pagination.page ?? 1,
        ...(query.pagination.offset !== undefined && { offset: query.pagination.offset }),
        ...(query.sort && { sort: query.sort }),
      };

      const result = await userRepository.findUsersWithFilters(
        query.filters,
        normalizedPagination,
      );

      // Mapper les utilisateurs (userMapper.map retourne UserResponse)
      const mappedUsers = result.data.map((user) => userMapper.map(user));

      logger.info(
        {
          count: mappedUsers.length,
          total: result.total,
        },
        'Users retrieved successfully',
      );

      return {
        success: true,
        data: mappedUsers,
        total: result.total,
        pagination: {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.total,
        },
      };
    } catch (error: any) {
      logger.error(
        {
          error,
          filters,
          pagination,
        },
        'Error in UserFacade.getUsers',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'UserFacade',
          action: 'getUsers',
        },
        extra: {
          filters,
          pagination,
        },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des utilisateurs',
      };
    }
  }
}

// Instance singleton exportée
export const userFacade = UserFacade.getInstance();

