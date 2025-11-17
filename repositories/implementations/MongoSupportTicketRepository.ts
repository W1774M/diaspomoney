/**
 * Implémentation MongoDB du repository de tickets de support
 * Implémente les design patterns :
 * - Repository Pattern
 * - Dependency Injection
 * - Logger Pattern (structured logging avec childLogger)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache)
 * - Error Handling Pattern (Sentry)
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { childLogger } from '@/lib/logger';
import SupportTicket from '@/models/SupportTicket';
import { SupportTicket as SupportTicketType } from '@/types/messaging';
import * as Sentry from '@sentry/nextjs';
import { ObjectId } from 'mongodb';
import { ISupportTicketRepository } from '../interfaces/IMessagingRepository';
import type {
  PaginatedResult,
  PaginationOptions,
} from '../interfaces/IRepository';

export class MongoSupportTicketRepository implements ISupportTicketRepository {
  private readonly log = childLogger({
    component: 'MongoSupportTicketRepository',
  });
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'SupportTicketRepository:findById' }) // Cache 5 minutes
  async findById(id: string): Promise<SupportTicketType | null> {
    try {
      const ticket = await (SupportTicket as any).findById(new ObjectId(id));
      const result = ticket ? this.mapToTicket(ticket) : null;
      if (result) {
        this.log.debug({ ticketId: id }, 'Support ticket found');
      } else {
        this.log.debug({ ticketId: id }, 'Support ticket not found');
      }
      return result;
    } catch (error) {
      this.log.error({ error, id }, 'Error in findById');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoSupportTicketRepository', action: 'findById' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'SupportTicketRepository:findByUser' }) // Cache 5 minutes
  async findByUser(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<SupportTicketType>> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const offset = options?.offset || (page - 1) * limit;

      const query = (SupportTicket as any).find({
        userId: new ObjectId(userId),
      });

      if (options?.sort) {
        query.sort(options.sort);
      } else {
        query.sort({ createdAt: -1 });
      }

      const [tickets, total] = await Promise.all([
        query.skip(offset).limit(limit).lean(),
        (SupportTicket as any).countDocuments({
          userId: new ObjectId(userId),
        }),
      ]);

      return {
        data: tickets.map((t: any) => this.mapToTicket(t)),
        total,
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      this.log.error({ error, userId, options }, 'Error in findByUser');
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoSupportTicketRepository',
          action: 'findByUser',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'SupportTicketRepository:findByStatus' }) // Cache 5 minutes
  async findByStatus(
    status: 'open' | 'in_progress' | 'closed' | 'resolved',
    options?: PaginationOptions
  ): Promise<PaginatedResult<SupportTicketType>> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const offset = options?.offset || (page - 1) * limit;

      const query = (SupportTicket as any).find({ status });

      if (options?.sort) {
        query.sort(options.sort);
      } else {
        query.sort({ createdAt: -1 });
      }

      const [tickets, total] = await Promise.all([
        query.skip(offset).limit(limit).lean(),
        (SupportTicket as any).countDocuments({ status }),
      ]);

      return {
        data: tickets.map((t: any) => this.mapToTicket(t)),
        total,
        page,
        limit,
        offset,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      this.log.error({ error, status, options }, 'Error in findByStatus');
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoSupportTicketRepository',
          action: 'findByStatus',
        },
        extra: { status },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('SupportTicketRepository:*') // Invalider le cache après création
  async create(data: Partial<SupportTicketType>): Promise<SupportTicketType> {
    try {
      const ticket = new SupportTicket({
        ...data,
        userId: new ObjectId(data.userId as any),
        assignedTo: data.assignedTo
          ? new ObjectId(data.assignedTo as any)
          : undefined,
        messages: data.messages?.map((m: any) => new ObjectId(m)),
      });
      await ticket.save();
      return this.mapToTicket(ticket);
    } catch (error) {
      this.log.error({ error, userId: data.userId }, 'Error in create');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoSupportTicketRepository', action: 'create' },
        extra: { userId: data.userId },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('SupportTicketRepository:*') // Invalider le cache après mise à jour
  async update(
    id: string,
    data: Partial<SupportTicketType>
  ): Promise<SupportTicketType | null> {
    try {
      const ticket = await (SupportTicket as any).findByIdAndUpdate(
        new ObjectId(id),
        { $set: data },
        { new: true }
      );
      return ticket ? this.mapToTicket(ticket) : null;
    } catch (error) {
      this.log.error({ error, id, data }, 'Error in update');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoSupportTicketRepository', action: 'update' },
        extra: { id },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('SupportTicketRepository:*') // Invalider le cache après ajout de message
  async addMessage(ticketId: string, messageId: string): Promise<boolean> {
    try {
      await (SupportTicket as any).updateOne(
        { _id: new ObjectId(ticketId) },
        {
          $push: {
            messages: new ObjectId(messageId),
          },
        }
      );
      return true;
    } catch (error) {
      this.log.error({ error, ticketId, messageId }, 'Error in addMessage');
      Sentry.captureException(error as Error, {
        tags: {
          component: 'MongoSupportTicketRepository',
          action: 'addMessage',
        },
        extra: { ticketId, messageId },
      });
      throw error;
    }
  }

  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('SupportTicketRepository:*') // Invalider le cache après suppression
  async delete(id: string): Promise<boolean> {
    try {
      const result = await (SupportTicket as any).deleteOne({
        _id: new ObjectId(id),
      });
      return result.deletedCount > 0;
    } catch (error) {
      this.log.error({ error, id }, 'Error in delete');
      Sentry.captureException(error as Error, {
        tags: { component: 'MongoSupportTicketRepository', action: 'delete' },
        extra: { id },
      });
      throw error;
    }
  }

  private mapToTicket(doc: any): SupportTicketType {
    return {
      _id: doc._id,
      userId: doc.userId,
      status: doc.status,
      priority: doc.priority,
      subject: doc.subject,
      messages: doc.messages?.map((m: any) => (m.toString ? m.toString() : m)),
      assignedTo: doc.assignedTo,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
