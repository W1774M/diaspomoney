/**
 * Implémentation MongoDB du repository template de notification
 *
 * Implémente les design patterns :
 * - Repository Pattern
 * - Logger Pattern (structured logging avec childLogger)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache)
 * - Error Handling Pattern (Sentry)
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { childLogger } from '@/lib/logger';
import { mongoClient } from '@/lib/mongodb';
import type { NotificationTemplate } from '@/types/notifications';
import * as Sentry from '@sentry/nextjs';
import { Document, ObjectId, OptionalId } from 'mongodb';
import type { INotificationTemplateRepository } from '../interfaces/INotificationTemplateRepository';

export class MongoNotificationTemplateRepository
  implements INotificationTemplateRepository
{
  private readonly collectionName = 'notificationTemplates';
  private readonly log = childLogger({
    component: 'MongoNotificationTemplateRepository',
  });

  private async getCollection() {
    const client = await mongoClient;
    const db = client.db();
    return db.collection(this.collectionName);
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationTemplateRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<NotificationTemplate | null> {
    try {
      const collection = await this.getCollection();
      const template = await collection.findOne({ _id: new ObjectId(id) });
      const result = template ? this.mapToTemplate(template) : null;
      if (result) {
        this.log.debug({ templateId: id }, 'Notification template found');
      } else {
        this.log.debug({ templateId: id }, 'Notification template not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, templateId: id }, 'Error in findById');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationTemplateRepository:findAll' }) // Cache 5 minutes
  async findAll(
    filters?: Record<string, any>,
  ): Promise<NotificationTemplate[]> {
    try {
      const collection = await this.getCollection();
      const templates = await collection.find(filters || {}).toArray();
      const result = templates.map(t => this.mapToTemplate(t));
      this.log.debug(
        { count: result.length, filters },
        'Notification templates found',
      );
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findAll');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationTemplateRepository:findOne' }) // Cache 5 minutes
  async findOne(
    filters: Record<string, any>,
  ): Promise<NotificationTemplate | null> {
    try {
      const collection = await this.getCollection();
      const template = await collection.findOne(filters);
      const result = template ? this.mapToTemplate(template) : null;
      this.log.debug({ filters, found: !!result }, 'findOne completed');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in findOne');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('NotificationTemplateRepository:*') // Invalider le cache après création
  async create(
    data: Partial<NotificationTemplate>,
  ): Promise<NotificationTemplate> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const templateData: OptionalId<Document> = {
        ...data,
        _id: data.id ? new ObjectId(data.id) : new ObjectId(),
        createdAt: now,
        updatedAt: now,
      };
      const result = await collection.insertOne(templateData);
      const template = await collection.findOne({ _id: result.insertedId });
      if (!template) {
        throw new Error('Failed to create notification template');
      }
      const mappedTemplate = this.mapToTemplate(template);
      this.log.info(
        {
          templateId: mappedTemplate.id,
          name: mappedTemplate.name,
          locale: mappedTemplate.locale,
        },
        'Notification template created successfully',
      );
      return mappedTemplate;
    } catch (error) {
      this.log.error(
        { error, name: data.name, locale: data.locale },
        'Error in create',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('NotificationTemplateRepository:*') // Invalider le cache après mise à jour
  async update(
    id: string,
    data: Partial<NotificationTemplate>,
  ): Promise<NotificationTemplate | null> {
    try {
      const collection = await this.getCollection();
      const updateData: Partial<NotificationTemplate> = {
        ...data,
        updatedAt: new Date(),
      };
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' },
      );
      const updated = result?.['value']
        ? this.mapToTemplate(result['value'])
        : null;
      if (updated) {
        this.log.info(
          { templateId: id },
          'Notification template updated successfully',
        );
      } else {
        this.log.warn(
          { templateId: id },
          'Notification template not found for update',
        );
      }
      return updated;
    } catch (error) {
      this.log.error({ error, templateId: id }, 'Error in update');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('NotificationTemplateRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      const deleted = result.deletedCount > 0;
      if (deleted) {
        this.log.info(
          { templateId: id },
          'Notification template deleted successfully',
        );
      } else {
        this.log.warn(
          { templateId: id },
          'Notification template not found for deletion',
        );
      }
      return deleted;
    } catch (error) {
      this.log.error({ error, templateId: id }, 'Error in delete');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationTemplateRepository:count' }) // Cache 5 minutes
  async count(filters?: Record<string, any>): Promise<number> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments(filters || {});
      this.log.debug(
        { count, filters },
        'Notification template count retrieved',
      );
      return count;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in count');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationTemplateRepository:exists' }) // Cache 5 minutes
  async exists(id: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({ _id: new ObjectId(id) });
      const exists = count > 0;
      this.log.debug(
        { templateId: id, exists },
        'Notification template existence checked',
      );
      return exists;
    } catch (error) {
      this.log.error({ error, templateId: id }, 'Error in exists');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, {
    prefix: 'NotificationTemplateRepository:findByNameAndLocale',
  }) // Cache 5 minutes
  async findByNameAndLocale(
    name: string,
    locale: string,
  ): Promise<NotificationTemplate | null> {
    try {
      const result = await this.findOne({ name, locale });
      this.log.debug(
        { name, locale, found: !!result },
        'Template found by name and locale',
      );
      return result;
    } catch (error) {
      this.log.error({ error, name, locale }, 'Error in findByNameAndLocale');
      Sentry.captureException(error);
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'NotificationTemplateRepository:findByLocale' }) // Cache 5 minutes
  async findByLocale(locale: string): Promise<NotificationTemplate[]> {
    try {
      const result = await this.findAll({ locale });
      this.log.debug(
        { locale, count: result.length },
        'Templates found by locale',
      );
      return result;
    } catch (error) {
      this.log.error({ error, locale }, 'Error in findByLocale');
      Sentry.captureException(error);
      throw error;
    }
  }

  private mapToTemplate(doc: any): NotificationTemplate {
    return {
      id: doc._id?.toString() || doc.id,
      name: doc.name,
      subject: doc.subject,
      content: doc.content,
      variables: doc.variables || [],
      channels: doc.channels || [],
      locale: doc.locale || 'fr',
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }
}
