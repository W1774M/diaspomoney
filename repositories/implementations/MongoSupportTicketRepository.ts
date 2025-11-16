/**
 * Implémentation MongoDB du repository de tickets de support
 */

import SupportTicket from '@/models/SupportTicket';
import { SupportTicket as SupportTicketType } from '@/types/messaging';
import { ObjectId } from 'mongodb';
import { ISupportTicketRepository } from '../interfaces/IMessagingRepository';
import { PaginatedResult, PaginationOptions } from '../interfaces/IRepository';

export class MongoSupportTicketRepository implements ISupportTicketRepository {
  async findById(id: string): Promise<SupportTicketType | null> {
    try {
      const ticket = await (SupportTicket as any).findById(new ObjectId(id));
      return ticket ? this.mapToTicket(ticket) : null;
    } catch (error) {
      console.error('[MongoSupportTicketRepository] Error in findById:', error);
      throw error;
    }
  }

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
      console.error(
        '[MongoSupportTicketRepository] Error in findByUser:',
        error
      );
      throw error;
    }
  }

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
      console.error(
        '[MongoSupportTicketRepository] Error in findByStatus:',
        error
      );
      throw error;
    }
  }

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
      console.error('[MongoSupportTicketRepository] Error in create:', error);
      throw error;
    }
  }

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
      console.error('[MongoSupportTicketRepository] Error in update:', error);
      throw error;
    }
  }

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
      console.error(
        '[MongoSupportTicketRepository] Error in addMessage:',
        error
      );
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await (SupportTicket as any).deleteOne({
        _id: new ObjectId(id),
      });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('[MongoSupportTicketRepository] Error in delete:', error);
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
