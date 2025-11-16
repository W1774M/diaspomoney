/**
 * Implémentation MongoDB du repository utilisateur
 */

import { UserQueryBuilder } from '@/builders';
import { mongoClient } from '@/lib/mongodb';
import { Document, ObjectId, OptionalId } from 'mongodb';
import { PaginatedResult, PaginationOptions } from '../interfaces/IRepository';
import {
  IUserRepository,
  User,
  UserFilters,
} from '../interfaces/IUserRepository';

export class MongoUserRepository implements IUserRepository {
  private readonly collectionName = 'users';

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  async findById(id: string): Promise<User | null> {
    try {
      const collection = await this.getCollection();
      const user = await collection.findOne({ _id: new ObjectId(id) });
      return user ? this.mapToUser(user) : null;
    } catch (error) {
      console.error('[MongoUserRepository] Error in findById:', error);
      throw error;
    }
  }

  async findAll(filters?: Record<string, any>): Promise<User[]> {
    try {
      const collection = await this.getCollection();
      const users = await collection.find(filters || {}).toArray();
      return users.map(user => this.mapToUser(user));
    } catch (error) {
      console.error('[MongoUserRepository] Error in findAll:', error);
      throw error;
    }
  }

  async findOne(filters: Record<string, any>): Promise<User | null> {
    try {
      const collection = await this.getCollection();
      const user = await collection.findOne(filters);
      return user ? this.mapToUser(user) : null;
    } catch (error) {
      console.error('[MongoUserRepository] Error in findOne:', error);
      throw error;
    }
  }

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
      return this.mapToUser(user);
    } catch (error) {
      console.error('[MongoUserRepository] Error in create:', error);
      throw error;
    }
  }

  /**
   * Créer un utilisateur avec hashage automatique du mot de passe
   * Utilise le modèle User Mongoose pour bénéficier du hook pre('save')
   */
  async createWithPassword(
    data: Partial<User> & { password?: string }
  ): Promise<User> {
    try {
      // Importer le modèle User pour bénéficier du hook pre('save') qui hash le mot de passe
      const UserModel = (await import('@/models/User')).default;
      const user = new UserModel({
        email: data.email?.toLowerCase(),
        password: data.password || undefined, // Le hook pre('save') hash le mot de passe
        name: data.name || `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ? String(data.phone).trim() : undefined,
        countryOfResidence: data.country || data['countryOfResidence'],
        dateOfBirth: data['dateOfBirth'],
        targetCountry: data['targetCountry'],
        targetCity: data['targetCity'],
        monthlyBudget: data['monthlyBudget'],
        securityQuestion: data['securityQuestion'],
        securityAnswer: data['securityAnswer'],
        selectedServices: data['selectedServices'],
        roles: data.roles || ['CUSTOMER'],
        status: data.status || 'ACTIVE',
        isEmailVerified: data.isEmailVerified || false,
        marketingConsent: data['marketingConsent'] || false,
        kycConsent: data['kycConsent'],
        kycStatus: data.kycStatus || 'PENDING',
        oauth: data['oauth'],
        ...data,
      });

      await user.save();

      // Retourner l'utilisateur au format User
      return this.mapToUser(user.toObject());
    } catch (error) {
      console.error(
        '[MongoUserRepository] Error in createWithPassword:',
        error
      );
      throw error;
    }
  }

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
      console.error('[MongoUserRepository] Error in update:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return Boolean(result.deletedCount && result.deletedCount > 0);
    } catch (error) {
      console.error('[MongoUserRepository] Error in delete:', error);
      throw error;
    }
  }

  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      return collection.countDocuments(filters || {});
    } catch (error) {
      console.error('[MongoUserRepository] Error in count:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      return count > 0;
    } catch (error) {
      console.error('[MongoUserRepository] Error in exists:', error);
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
      console.error(
        '[MongoUserRepository] Error in findWithPagination:',
        error
      );
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

  async updatePassword(
    userId: string,
    hashedPassword: string,
    updatePasswordChangedAt: boolean = true
  ): Promise<boolean> {
    try {
      const updateData: any = {
        password: hashedPassword,
      };

      // Mettre à jour passwordChangedAt si demandé
      if (updatePasswordChangedAt) {
        updateData.passwordChangedAt = new Date();
      }

      const result = await this.update(userId, updateData);
      return result !== null;
    } catch (error) {
      console.error('[MongoUserRepository] Error in updatePassword:', error);
      throw error;
    }
  }

  /**
   * Vérifier le mot de passe d'un utilisateur
   * Utilise le modèle User Mongoose pour accéder à la méthode comparePassword
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      // Importer le modèle User pour accéder à la méthode comparePassword
      const UserModel = (await import('@/models/User')).default;
      const userDoc = await (UserModel as any).findOne({ _id: userId }).exec();

      if (!userDoc || !userDoc.password) {
        return false;
      }

      // Utiliser la méthode comparePassword du modèle
      return await userDoc.comparePassword(password);
    } catch (error) {
      console.error('[MongoUserRepository] Error in verifyPassword:', error);
      return false;
    }
  }

  async verifyEmail(userId: string): Promise<boolean> {
    try {
      const result = await this.update(userId, {
        emailVerified: true,
      });
      return result !== null;
    } catch (error) {
      console.error('[MongoUserRepository] Error in verifyEmail:', error);
      throw error;
    }
  }

  async updateKYCStatus(userId: string, status: string): Promise<boolean> {
    try {
      const result = await this.update(userId, {
        kycStatus: status,
      });
      return result !== null;
    } catch (error) {
      console.error('[MongoUserRepository] Error in updateKYCStatus:', error);
      throw error;
    }
  }

  /**
   * Configurer la 2FA pour un utilisateur
   */
  async setup2FA(
    userId: string,
    secret: string,
    backupCodes: string[]
  ): Promise<boolean> {
    try {
      const result = await this.update(userId, {
        twoFactorSecret: secret,
        twoFactorBackupCodes: backupCodes,
        twoFactorEnabled: false, // Pas encore activé
      });
      return result !== null;
    } catch (error) {
      console.error('[MongoUserRepository] Error in setup2FA:', error);
      throw error;
    }
  }

  /**
   * Activer la 2FA pour un utilisateur
   */
  async enable2FA(userId: string): Promise<boolean> {
    try {
      const result = await this.update(userId, {
        twoFactorEnabled: true,
      });
      return result !== null;
    } catch (error) {
      console.error('[MongoUserRepository] Error in enable2FA:', error);
      throw error;
    }
  }

  /**
   * Désactiver la 2FA pour un utilisateur
   */
  async disable2FA(userId: string): Promise<boolean> {
    try {
      const result = await this.update(userId, {
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
        twoFactorBackupCodes: undefined,
      });
      return result !== null;
    } catch (error) {
      console.error('[MongoUserRepository] Error in disable2FA:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les codes de backup 2FA
   */
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
      console.error(
        '[MongoUserRepository] Error in update2FABackupCodes:',
        error
      );
      throw error;
    }
  }

  /**
   * Récupérer les informations 2FA d'un utilisateur
   */
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

      // Accéder aux champs 2FA via l'index signature
      return {
        twoFactorSecret: user['twoFactorSecret'],
        twoFactorBackupCodes: user['twoFactorBackupCodes'],
        twoFactorEnabled: user['twoFactorEnabled'],
      };
    } catch (error) {
      console.error('[MongoUserRepository] Error in get2FAInfo:', error);
      throw error;
    }
  }

  async findUsersWithFilters(
    filters: UserFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<User>> {
    try {
      // Utiliser UserQueryBuilder pour construire la requête
      const queryBuilder = this.buildUserQuery(filters, options);
      const query = queryBuilder.build();

      return this.findWithPagination(query.filters, query.pagination);
    } catch (error) {
      console.error(
        '[MongoUserRepository] Error in findUsersWithFilters:',
        error
      );
      throw error;
    }
  }

  /**
   * Construire une requête utilisateur avec UserQueryBuilder
   */
  private buildUserQuery(
    filters: UserFilters,
    options?: PaginationOptions
  ): UserQueryBuilder {
    const builder = new UserQueryBuilder();

    // Appliquer les filtres
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

    // Appliquer la pagination
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
   * Mapper un document MongoDB vers un objet User
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
      country: doc.countryOfResidence,
      roles: doc.roles || [],
      status: doc.status,
      isActive: doc.status === 'ACTIVE',
      isEmailVerified: doc.emailVerified || false,
      kycStatus: doc.kycStatus || 'PENDING',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      ...doc,
    };
  }
}
