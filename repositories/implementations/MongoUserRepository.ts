/**
 * MongoDB implementation of the user repository.
 * Implements the design patterns:
 * - Repository Pattern
 * - Dependency Injection
 * - Logger Pattern (structured logging with childLogger)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache)
 * - Error Handling Pattern (Sentry)
 */

import { UserQueryBuilder } from '@/builders';
import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { childLogger } from '@/lib/logger';
import { mongoClient } from '@/lib/mongodb';
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/IRepository';
import type {
  IUserRepository,
  User,
  UserFilters,
} from '../interfaces/IUserRepository';

export class MongoUserRepository implements IUserRepository {
  private readonly collectionName = 'users';
  private readonly log = childLogger({
    component: 'MongoUserRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'UserRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<User | null> {
    try {
      const collection = await this.getCollection();
      const user = await collection.findOne({ _id: new ObjectId(id) });
      const result = user ? this.mapToUser(user) : null;
      if (result) {
        this.log.debug({ userId: id }, 'User found');
      } else {
        this.log.debug({ userId: id }, 'User not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, id }, 'Error in findById');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'findById' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'UserRepository:findAll' }) // Cache 5 minutes
  async findAll(filters?: Record<string, any>): Promise<User[]> {
    try {
      const collection = await this.getCollection();
      const users = await collection.find(filters || {}).toArray();
      const result = users.map(user => this.mapToUser(user));
      this.log.debug({ count: result.length, filters }, 'Users found');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'findAll' },
        extra: { filters },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'UserRepository:findOne' }) // Cache 5 minutes
  async findOne(filters: Record<string, any>): Promise<User | null> {
    try {
      const collection = await this.getCollection();
      const user = await collection.findOne(filters);
      const result = user ? this.mapToUser(user) : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'findOne' },
        extra: { filters },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('UserRepository:*') // Invalider le cache après création
  async create(data: Partial<User>): Promise<User> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const userData: OptionalId<
        Document & { _id?: string | ObjectId | undefined }
      > = {
        ...data,
        createdAt: now,
        updatedAt: now,
        ...(data._id ? { _id: new ObjectId(data._id) } : {}),
      };
      const result = await collection.insertOne(
        userData as OptionalId<Document>
      );
      const user = await collection.findOne({ _id: result.insertedId });
      if (!user) {
        throw new Error('Failed to create user');
      }
      const mappedUser = this.mapToUser(user);
      this.log.info(
        { userId: mappedUser.id, email: mappedUser.email },
        'User created successfully'
      );
      return mappedUser;
    } catch (error) {
      this.log.error({ error, email: data.email }, 'Error in create');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'create' },
        extra: { email: data.email },
      });
      throw error;
    }
  }

  /**
   * Create a user with automatic password hashing
   * Uses the Mongoose User model to benefit from pre('save') hook
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true }) // Ne pas logger le mot de passe
  @InvalidateCache('UserRepository:*') // Invalider le cache après création
  async createWithPassword(
    data: Partial<User> & { password?: string }
  ): Promise<User> {
    try {
      // Import the User model to use pre('save') and hash the password
      const UserModel = (await import('@/models/User')).default;
      const user = new UserModel({
        email: data.email?.toLowerCase(),
        password: data.password || undefined,
        name:
          data.name || `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ? String(data.phone).trim() : undefined,
        countryOfResidence: data.country ?? (data as any)['countryOfResidence'],
        dateOfBirth: (data as any)['dateOfBirth'],
        targetCountry: (data as any)['targetCountry'],
        targetCity: (data as any)['targetCity'],
        monthlyBudget: (data as any)['monthlyBudget'],
        securityQuestion: (data as any)['securityQuestion'],
        securityAnswer: (data as any)['securityAnswer'],
        selectedServices: (data as any)['selectedServices'],
        roles: data.roles || ['CUSTOMER'],
        status: data.status || 'ACTIVE',
        emailVerified: data.isEmailVerified || false,
        marketingConsent: (data as any)['marketingConsent'] || false,
        kycConsent: (data as any)['kycConsent'],
        kycStatus: data.kycStatus || 'PENDING',
        oauth: (data as any)['oauth'],
        ...data,
      });

      await user.save();

      // Return user in User format
      return this.mapToUser(user.toObject());
    } catch (error) {
      this.log.error(
        { error, email: data.email },
        'Error in createWithPassword'
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoUserRepository',
          action: 'createWithPassword',
        },
        extra: { email: data.email },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('UserRepository:*') // Invalider le cache après mise à jour
  async update(id: string, data: Partial<User>): Promise<User | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<User> = {
        ...data,
        updatedAt: new Date(),
      };
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      // result.value is the updated document
      return result?.['value'] ? this.mapToUser(result['value']) : null;
    } catch (error) {
      this.log.error({ error, id, data }, 'Error in update');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'update' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('UserRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return Boolean(result.deletedCount && result.deletedCount > 0);
    } catch (error) {
      this.log.error({ error, id }, 'Error in delete');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'delete' },
        extra: { id },
      });
      throw error;
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      return collection.countDocuments(filters || {});
    } catch (error) {
      this.log.error({ error, filters }, 'Error in count');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'count' },
        extra: { filters },
      });
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      return count > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error in exists');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'exists' },
        extra: { id },
      });
      throw error;
    }
  }

  async findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<User>> {
    try {
      const collection = await this.getCollection();
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const page = options?.page ?? Math.floor(offset / limit) + 1;
      const sort = options?.sort || { createdAt: -1 };

      const query = filters || {};
      const total = await collection.countDocuments(query);
      const users = await collection
        .find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .toArray();

      return {
        data: users.map(user => this.mapToUser(user)),
        total,
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      this.log.error(
        { error, filters, options },
        'Error in findWithPagination'
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoUserRepository',
          action: 'findWithPagination',
        },
        extra: { filters, options },
      });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email: email.toLowerCase() });
  }

  async findByRole(role: string): Promise<User[]> {
    return this.findAll({ roles: role });
  }

  async findByStatus(status: string): Promise<User[]> {
    return this.findAll({ status });
  }

  @Log({ level: 'info', logArgs: false, logExecutionTime: true }) // Ne pas logger le mot de passe
  @InvalidateCache('UserRepository:*') // Invalider le cache après changement de mot de passe
  async updatePassword(
    userId: string,
    hashedPassword: string,
    updatePasswordChangedAt: boolean = true
  ): Promise<boolean> {
    try {
      const updateData: any = {
        password: hashedPassword,
      };

      // Update passwordChangedAt if required
      if (updatePasswordChangedAt) {
        updateData.passwordChangedAt = new Date();
      }

      const result = await this.update(userId, updateData);
      return result !== null;
    } catch (error) {
      this.log.error({ error, userId }, 'Error in updatePassword');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'updatePassword' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Verify a user's password
   * Uses the Mongoose User model to access comparePassword
   */
  @Log({ level: 'debug', logArgs: false, logExecutionTime: true }) // Ne pas logger le mot de passe
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      // Import User model to use comparePassword
      const UserModel = (await import('@/models/User')).default;
      const objectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
      const userDoc = await (UserModel as any)
        .findOne({ _id: objectId })
        .exec();

      if (!userDoc || !userDoc.password) {
        return false;
      }

      // Use the model's comparePassword method
      return await userDoc.comparePassword(password);
    } catch (error) {
      this.log.error({ error, userId }, 'Error in verifyPassword');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'verifyPassword' },
        extra: { userId },
      });
      return false;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('UserRepository:*') // Invalider le cache après vérification email
  async verifyEmail(userId: string): Promise<boolean> {
    try {
      const result = await this.update(userId, {
        emailVerified: true,
      });
      return result !== null;
    } catch (error) {
      this.log.error({ error, userId }, 'Error in verifyEmail');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'verifyEmail' },
        extra: { userId },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('UserRepository:*') // Invalider le cache après mise à jour KYC
  async updateKYCStatus(userId: string, status: string): Promise<boolean> {
    try {
      const result = await this.update(userId, {
        kycStatus: status,
      });
      return result !== null;
    } catch (error) {
      this.log.error({ error, userId, status }, 'Error in updateKYCStatus');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'updateKYCStatus' },
        extra: { userId, status },
      });
      throw error;
    }
  }

  /**
   * Configure 2FA for a user
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true }) // Ne pas logger les secrets 2FA
  @InvalidateCache('UserRepository:*') // Invalider le cache après configuration 2FA
  async setup2FA(
    userId: string,
    secret: string,
    backupCodes: string[]
  ): Promise<boolean> {
    try {
      const result = await this.update(userId, {
        twoFactorSecret: secret,
        twoFactorBackupCodes: backupCodes,
        twoFactorEnabled: false,
      });
      return result !== null;
    } catch (error) {
      this.log.error({ error, userId }, 'Error in setup2FA');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'setup2FA' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Enable 2FA for a user
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('UserRepository:*') // Invalider le cache après activation 2FA
  async enable2FA(userId: string): Promise<boolean> {
    try {
      const result = await this.update(userId, {
        twoFactorEnabled: true,
      });
      return result !== null;
    } catch (error) {
      this.log.error({ error, userId }, 'Error in enable2FA');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'enable2FA' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Disable 2FA for a user
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('UserRepository:*') // Invalider le cache après désactivation 2FA
  async disable2FA(userId: string): Promise<boolean> {
    try {
      const result = await this.update(userId, {
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
        twoFactorBackupCodes: undefined,
      });
      return result !== null;
    } catch (error) {
      this.log.error({ error, userId }, 'Error in disable2FA');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'disable2FA' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Update 2FA backup codes
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true }) // Ne pas logger les codes de backup
  @InvalidateCache('UserRepository:*') // Invalider le cache après mise à jour des codes
  async update2FABackupCodes(
    userId: string,
    backupCodes: string[]
  ): Promise<boolean> {
    try {
      const result = await this.update(userId, {
        twoFactorBackupCodes: backupCodes,
      });
      return result !== null;
    } catch (error) {
      this.log.error({ error, userId }, 'Error in update2FABackupCodes');
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoUserRepository',
          action: 'update2FABackupCodes',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Get a user's 2FA information
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'UserRepository:get2FAInfo' }) // Cache 5 minutes
  async get2FAInfo(userId: string): Promise<{
    twoFactorSecret?: string;
    twoFactorBackupCodes?: string[];
    twoFactorEnabled?: boolean;
  } | null> {
    try {
      const user = await this.findById(userId);
      if (!user) {
        return null;
      }

      return {
        twoFactorSecret: (user as any)['twoFactorSecret'],
        twoFactorBackupCodes: (user as any)['twoFactorBackupCodes'],
        twoFactorEnabled: (user as any)['twoFactorEnabled'],
      };
    } catch (error) {
      this.log.error({ error, userId }, 'Error in get2FAInfo');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoUserRepository', action: 'get2FAInfo' },
        extra: { userId },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'UserRepository:findUsersWithFilters' }) // Cache 5 minutes
  async findUsersWithFilters(
    filters: UserFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<User>> {
    try {
      // Use UserQueryBuilder to build query
      const queryBuilder = this.buildUserQuery(filters, options);
      const query = queryBuilder.build();

      return this.findWithPagination(query.filters, query.pagination);
    } catch (error) {
      this.log.error(
        { error, filters, options },
        'Error in findUsersWithFilters'
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoUserRepository',
          action: 'findUsersWithFilters',
        },
        extra: { filters, options },
      });
      throw error;
    }
  }

  /**
   * Build a user query using UserQueryBuilder
   */
  private buildUserQuery(
    filters: UserFilters,
    options?: PaginationOptions
  ): UserQueryBuilder {
    const builder = new UserQueryBuilder();

    // Apply filters
    if (filters.role) {
      builder.byRole(filters.role);
    }
    if (filters.roles && Array.isArray(filters.roles)) {
      builder.whereIn('roles', filters.roles);
    }
    if (filters.status) {
      builder.byStatus(filters.status);
    }
    if (filters.email) {
      builder.byEmail(filters.email);
    }
    if (filters.country) {
      builder.byCountry(filters.country);
    }
    if (filters.isActive !== undefined) {
      if (filters.isActive) {
        builder.active();
      } else {
        builder.inactive();
      }
    }
    if (filters.isEmailVerified !== undefined) {
      if (filters.isEmailVerified) {
        builder.emailVerified();
      } else {
        builder.emailNotVerified();
      }
    }
    if (filters.kycStatus) {
      builder.byKYCStatus(filters.kycStatus);
    }
    if (filters.specialty) {
      builder.bySpecialty(filters.specialty);
    }
    if (filters.city) {
      builder.byCity(filters.city);
    }

    // Apply pagination
    if (options) {
      if (options.limit) {
        builder.limit(options.limit);
      }
      if (options.offset) {
        builder.offset(options.offset);
      }
      if (options.page && options.limit) {
        builder.page(options.page, options.limit);
      }
      if (options.sort) {
        Object.entries(options.sort).forEach(([field, direction]) => {
          builder.orderBy(field, direction === 1 ? 'asc' : 'desc');
        });
      }
    }

    return builder;
  }

  /**
   * Map a MongoDB document to a User object
   */
  private mapToUser(doc: any): User {
    return {
      _id: doc._id?.toString(),
      id: doc._id?.toString() || doc.id,
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      name: doc.name,
      phone: doc.phone,
      country: doc.countryOfResidence || doc.country,
      roles: doc.roles || [],
      status: doc.status,
      isActive: doc.status === 'ACTIVE',
      isEmailVerified:
        doc.emailVerified !== undefined
          ? doc.emailVerified
          : doc.isEmailVerified || false,
      kycStatus: doc.kycStatus || 'PENDING',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      ...doc,
    };
  }
}
