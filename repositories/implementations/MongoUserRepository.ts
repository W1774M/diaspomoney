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
import { USER_STATUSES, ROLES, KYC_STATUSES } from '@/lib/constants';
import { mongoClient } from '@/lib/mongodb';
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import type {
  PaginatedFindResult,
  PaginationOptions,
} from '@/lib/types';
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
  @Cacheable(300, { prefix: 'UserRepository:findById' })
  async findById(id: string): Promise<User | null> {
    try {
      const collection = await this.getCollection();
      if (!ObjectId.isValid(id)) {
        this.log.warn({ userId: id }, 'Invalid ObjectId passed to findById');
        return null;
      }
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
  @Cacheable(300, { prefix: 'UserRepository:findAll' })
  async findAll(filters?: UserFilters): Promise<User[]> {
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
  @Cacheable(300, { prefix: 'UserRepository:findOne' })
  async findOne(filters: UserFilters): Promise<User | null> {
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
  @InvalidateCache('UserRepository:*')
  async create(data: Partial<User>): Promise<User> {
    try {
      const collection = await this.getCollection();
      const now = new Date();

      // Ensure unique email before attempting insert (safety for tests/non-strict envs)
      const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
      if (email) {
        const existing = await collection.findOne({ email });
        if (existing) {
          this.log.warn({ email }, 'Duplicate email detected before insert');
          throw new Error('Un compte avec cet email existe déjà');
        }
      }
      // Remove _id/id for insert to avoid conflicts, but allow _id override if provided/valid
      const { _id, id: _idUnused, ...dataWithoutIds } = data as Partial<User> & Record<string, any>;
      let validObjectId: ObjectId | undefined;
      if (data._id) {
        try {
          const _idValue = data._id as any;
          if (_idValue && typeof _idValue === 'object' && _idValue.constructor === ObjectId) {
            validObjectId = _idValue;
          } else if (typeof _idValue === 'string' && ObjectId.isValid(_idValue)) {
            validObjectId = new ObjectId(_idValue);
          } else {
            this.log.warn({ _id: data._id, email: data.email }, 'Invalid _id provided, ignoring it');
          }
        } catch (error) {
          this.log.warn(
            { _id: data._id, email: data.email, error },
            'Error converting _id to ObjectId, ignoring it'
          );
        }
      }

      const userData: OptionalId<Document> = {
        ...dataWithoutIds,
        ...(email ? { email } : {}),
        status: data.status || USER_STATUSES.PENDING,
        createdAt: now,
        updatedAt: now,
        ...(validObjectId ? { _id: validObjectId } : {}),
      };
      const result = await collection.insertOne(userData as OptionalId<Document>);
      const user = await collection.findOne({ _id: result.insertedId });
      if (!user) throw new Error('Failed to create user');
      const mappedUser = this.mapToUser(user);
      this.log.info(
        { userId: mappedUser.id, email: mappedUser.email },
        'User created successfully'
      );
      return mappedUser;
    } catch (error: any) {
      if (error.code === 11000 || error.code === 11001) {
        const duplicateField = error.keyPattern
          ? Object.keys(error.keyPattern)[0]
          : 'email';
        this.log.warn(
          { error, email: data.email, duplicateField },
          `Duplicate key error in create: ${duplicateField}`
        );
        throw new Error(
          duplicateField === 'email'
            ? 'Un compte avec cet email existe déjà'
            : `Un compte avec ce ${duplicateField} existe déjà`
        );
      }
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
   * Uses the Mongoose User model for pre('save') hook
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true })
  @InvalidateCache('UserRepository:*')
  async createWithPassword(
    data: Partial<User> & { password?: string },
  ): Promise<User> {
    try {
      // Dynamically import UserModel to guarantee correct schema/hook use
      const UserModel = (await import('@/models/User')).default;

      // Ensure unique email before save (mirror create logic)
      // Use native collection to ensure we see uncommitted changes in transactions
      const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
      if (email) {
        const collection = await this.getCollection();
        // Vérifier avec la collection native MongoDB
        const existing = await collection.findOne({ email });
        if (existing) {
          this.log.warn(
            { 
              email, 
              existingUserId: existing._id?.toString() || (existing as any)['id'],
            }, 
            'Duplicate email detected before save'
          );
          throw new Error('Un compte avec cet email existe déjà');
        }
        // Double vérification avec le modèle Mongoose pour être sûr
        const UserModel = (await import('@/models/User')).default;
        const mongooseExisting = await (UserModel as any)
          .findOne({ email }).select('_id').lean().exec();
        if (mongooseExisting) {
          this.log.warn(
            { 
              email, 
              existingUserId: mongooseExisting._id?.toString(),
            }, 
            'Duplicate email detected via Mongoose before save'
          );
          throw new Error('Un compte avec cet email existe déjà');
        }
      }

      // Remove _id/id for insert to avoid BSON errors, but allow _id override if valid
      const { _id, id, ...dataWithoutIds } = data;
      let validObjectId: any = undefined;
      if (_id) {
        try {
          const _idValue = _id as any;
          if (typeof _idValue === 'string' && ObjectId.isValid(_idValue)) {
            validObjectId = _idValue;
          } else if (_idValue && typeof _idValue === 'object' && _idValue.constructor === ObjectId) {
            validObjectId = _idValue;
          } else {
            this.log.warn({ _id, email: data.email }, 'Invalid _id provided in createWithPassword, ignoring it');
          }
        } catch (error) {
          this.log.warn(
            { _id, email: data.email, error },
            'Error validating _id in createWithPassword, ignoring it'
          );
        }
      }

      const user = new UserModel({
        email,
        password: data.password || undefined,
        name: data.name || `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ? String(data.phone).trim() : undefined,
        countryOfResidence: data['country'] ?? data['countryOfResidence'],
        dateOfBirth: data['dateOfBirth'],
        targetCountry: data['targetCountry'],
        targetCity: data['targetCity'],
        monthlyBudget: data['monthlyBudget'],
        securityQuestion: data['securityQuestion'],
        securityAnswer: data['securityAnswer'],
        selectedServices: data['selectedServices'],
        roles: data.roles || [ROLES.CUSTOMER],
        status: data.status || USER_STATUSES.PENDING,
        emailVerified: data['isEmailVerified'] ?? data['emailVerified'] ?? false,
        marketingConsent: data['marketingConsent'] || false,
        kycConsent: data['kycConsent'],
        kycStatus: data['kycStatus'] || KYC_STATUSES.PENDING,
        oauth: data['oauth'],
        ...dataWithoutIds,
        ...(validObjectId ? { _id: validObjectId } : {}),
      });

      try {
        await user.save();
      } catch (saveError: any) {
        // Si c'est une erreur de duplication MongoDB, la transformer
        if (saveError.code === 11000 || saveError.code === 11001) {
          const duplicateField = saveError.keyPattern
            ? Object.keys(saveError.keyPattern)[0]
            : 'email';
          this.log.warn(
            { error: saveError, email: data.email, duplicateField },
            `Duplicate key error in createWithPassword save: ${duplicateField}`
          );
          throw new Error(
            duplicateField === 'email'
              ? 'Un compte avec cet email existe déjà'
              : `Un compte avec ce ${duplicateField} existe déjà`
          );
        }
        // Relancer les autres erreurs
        throw saveError;
      }
      return this.mapToUser(user.toObject());
    } catch (error: any) {
      // Si l'erreur a déjà été transformée, la relancer
      if (error.message?.includes('existe déjà')) {
        throw error;
      }
      if (error.code === 11000 || error.code === 11001) {
        const duplicateField = error.keyPattern
          ? Object.keys(error.keyPattern)[0]
          : 'email';
        this.log.warn(
          { error, email: data.email, duplicateField },
          `Duplicate key error in createWithPassword: ${duplicateField}`
        );
        throw new Error(
          duplicateField === 'email'
            ? 'Un compte avec cet email existe déjà'
            : `Un compte avec ce ${duplicateField} existe déjà`
        );
      }
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
  @InvalidateCache('UserRepository:*')
  async update(id: string, data: Partial<User>): Promise<User | null> {
    try {
      if (!ObjectId.isValid(id)) {
        this.log.warn({ id }, 'Invalid ObjectId passed to update');
        return null;
      }
      const collection = await this.getCollection();
      const updateData: Partial<User> = {
        ...data,
        updatedAt: new Date(),
      };
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' },
      );
      type FindOneAndUpdateResult = {
        value?: Document | null;
      };
      const typedResult = result as FindOneAndUpdateResult;
      return typedResult.value ? this.mapToUser(typedResult.value) : null;
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
  @InvalidateCache('UserRepository:*')
  async delete(id: string): Promise<boolean> {
    try {
      if (!ObjectId.isValid(id)) {
        this.log.warn({ id }, 'Invalid ObjectId passed to delete');
        return false;
      }
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

  async count(filters?: UserFilters): Promise<number> {
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
      if (!ObjectId.isValid(id)) {
        this.log.warn({ id }, 'Invalid ObjectId passed to exists');
        return false;
      }
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
    filters?: UserFilters,
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<User>> {
    try {
      const collection = await this.getCollection();
      const limit = Math.max(1, options?.limit ?? 50);
      const offset = Math.max(0, options?.offset ?? 0);
      // Defensive: If page is provided, calculate offset.
      let page = 1;
      if (options?.page && limit) {
        page = options.page;
      } else if (offset && limit) {
        page = Math.floor(offset / limit) + 1;
      }
      const sort = options?.sort || { createdAt: -1 };

      const query = filters || {};
      const total = await collection.countDocuments(query);

      const users = await collection
        .find(query)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .toArray();

      const pages = Math.ceil(total / limit);

      return {
        data: users.map(user => this.mapToUser(user)),
        total,
        pagination: {
          page,
          limit,
          pages,
          offset,
          total,
          hasNext: offset + limit < total,
          hasPrev: offset > 0,
        },
      };
    } catch (error) {
      this.log.error(
        { error, filters, options },
        'Error in findWithPagination',
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
    if (!email) return null;
    const collection = await this.getCollection();
    const user = await collection.findOne({ email: email.toLowerCase() });
    return user ? this.mapToUser(user) : null;
  }

  async findByRole(role: string): Promise<User[]> {
    const collection = await this.getCollection();
    const users = await collection.find({ roles: role }).toArray();
    return users.map(user => this.mapToUser(user));
  }

  async findByStatus(status: string): Promise<User[]> {
    const collection = await this.getCollection();
    const users = await collection.find({ status }).toArray();
    return users.map(user => this.mapToUser(user));
  }

  @Log({ level: 'info', logArgs: false, logExecutionTime: true })
  @InvalidateCache('UserRepository:*')
  async updatePassword(
    userId: string,
    hashedPassword: string,
    updatePasswordChangedAt: boolean = true,
  ): Promise<boolean> {
    try {
      if (!userId || typeof userId !== 'string') {
        this.log.warn({ userId }, 'Invalid userId in updatePassword');
        return false;
      }
      const updateData: Partial<User> & { [key: string]: any } = {
        password: hashedPassword,
      };
      if (updatePasswordChangedAt) {
        updateData['passwordChangedAt'] = new Date();
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
   * Verify a user's password using their stored hash
   */
  @Log({ level: 'debug', logArgs: false, logExecutionTime: true })
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      const UserModel = (await import('@/models/User')).default;
      const objectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
      const userDoc = await (UserModel as any)
        .findOne({ _id: objectId })
        .exec();

      if (!userDoc || !userDoc.password) {
        return false;
      }
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
  @InvalidateCache('UserRepository:*')
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
  @InvalidateCache('UserRepository:*')
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
   * Setup 2FA for a user
   */
  @Log({ level: 'info', logArgs: false, logExecutionTime: true })
  @InvalidateCache('UserRepository:*')
  async setup2FA(
    userId: string,
    secret: string,
    backupCodes: string[],
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
  @InvalidateCache('UserRepository:*')
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
  @InvalidateCache('UserRepository:*')
  async disable2FA(userId: string): Promise<boolean> {
    try {
      const result = await this.update(userId, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
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
  @Log({ level: 'info', logArgs: false, logExecutionTime: true })
  @InvalidateCache('UserRepository:*')
  async update2FABackupCodes(
    userId: string,
    backupCodes: string[],
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
  @Cacheable(300, { prefix: 'UserRepository:get2FAInfo' })
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
      type UserWith2FA = User & {
        twoFactorSecret?: string;
        twoFactorBackupCodes?: string[];
        twoFactorEnabled?: boolean;
      };
      const userWith2FA = user as UserWith2FA;
      const result: {
        twoFactorSecret?: string;
        twoFactorBackupCodes?: string[];
        twoFactorEnabled?: boolean;
      } = {};
      if (userWith2FA.twoFactorSecret !== undefined) {
        result.twoFactorSecret = userWith2FA.twoFactorSecret;
      }
      if (userWith2FA.twoFactorBackupCodes !== undefined) {
        result.twoFactorBackupCodes = userWith2FA.twoFactorBackupCodes;
      }
      if (userWith2FA.twoFactorEnabled !== undefined) {
        result.twoFactorEnabled = userWith2FA.twoFactorEnabled;
      }
      return result;
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
  @Cacheable(300, { prefix: 'UserRepository:findUsersWithFilters' })
  async findUsersWithFilters(
    filters: UserFilters,
    options?: PaginationOptions,
  ): Promise<PaginatedFindResult<User>> {
    try {
      const queryBuilder = this.buildUserQuery(filters, options);
      const query = queryBuilder.build();
      const pagination: PaginationOptions = {
        limit: query.pagination.limit ?? 50,
        page: query.pagination.page ?? 1,
        ...(query.pagination.offset !== undefined && { offset: query.pagination.offset }),
        ...(query.sort && Object.keys(query.sort).length > 0 && { sort: query.sort }),
      };
      return this.findWithPagination(query.filters, pagination);
    } catch (error) {
      this.log.error(
        { error, filters, options },
        'Error in findUsersWithFilters',
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
    options?: PaginationOptions,
  ): UserQueryBuilder {
    const builder = new UserQueryBuilder();

    if (filters.role) {
      builder.byRole(filters.role);
    }
    if (filters.roles && Array.isArray(filters.roles)) {
      builder.whereIn('roles', filters.roles);
    }
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        builder.whereIn('status', filters.status);
      } else {
        builder.byStatus(filters.status);
      }
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
   * Map a MongoDB document to a User object.
   * This handles _id/id normalization, field mapping, booleans, role defaults, etc.
   */
  private mapToUser(doc: Document): User {
    if (!doc) return doc as any;

    let idStr: string | undefined = undefined;
    if (doc['_id'] && typeof doc['_id'].toString === 'function') {
      idStr = doc['_id'].toString();
    } else if (typeof doc['_id'] === 'string') {
      idStr = doc['_id'];
    }
    if (!idStr) throw new Error('Unable to extract _id from document');

    return {
      _id: idStr,
      id: idStr ?? (doc as any)['id'],
      email: doc['email'],
      firstName: doc['firstName'],
      lastName: doc['lastName'],
      name: doc['name'] ?? `${doc['firstName'] ?? ''} ${doc['lastName'] ?? ''}`.trim(),
      phone: doc['phone'],
      country: doc['countryOfResidence'] || doc['country'],
      roles: Array.isArray(doc['roles']) ? doc['roles'] : (doc['roles'] ? [doc['roles']] : []),
      status: doc['status'],
      isActive: doc['status'] === USER_STATUSES.ACTIVE,
      isEmailVerified:
        doc['emailVerified'] !== undefined
          ? doc['emailVerified']
          : doc['isEmailVerified'] ?? false,
      kycStatus: doc['kycStatus'] || KYC_STATUSES.PENDING,
      createdAt: doc['createdAt'],
      updatedAt: doc['updatedAt'],
      ...doc,
    };
  }
}
