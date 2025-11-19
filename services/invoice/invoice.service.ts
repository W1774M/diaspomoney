/**
 * Invoice Service - DiaspoMoney
 * Service de gestion des factures utilisant le Repository Pattern
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import {
  createValidationRule,
  Validate,
} from '@/lib/decorators/validate.decorator';
import { logger } from '@/lib/logger';
import { getInvoiceRepository, Invoice, PaginatedResult } from '@/repositories';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

export interface InvoiceData {
  userId: string;
  transactionId?: string;
  bookingId?: string;
  amount: number;
  currency: string;
  tax?: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  dueDate?: Date;
  billingAddress?: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  metadata?: Record<string, any>;
}

/**
 * InvoiceService utilisant le Repository Pattern
 */
export class InvoiceService {
  private static instance: InvoiceService;
  private invoiceRepository = getInvoiceRepository();

  static getInstance(): InvoiceService {
    if (!InvoiceService.instance) {
      InvoiceService.instance = new InvoiceService();
    }
    return InvoiceService.instance;
  }

  /**
   * Créer une nouvelle facture
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      createValidationRule(
        0,
        z
          .object({
            userId: z.string().min(1, 'User ID is required'),
            amount: z.number().positive('Amount must be positive'),
            currency: z.string().length(3, 'Currency must be 3 characters'),
          })
          .passthrough(),
        'data',
      ),
    ],
  })
  @InvalidateCache('InvoiceService:*')
  async createInvoice(data: InvoiceData): Promise<Invoice> {
    try {
      // Validation
      if (!data.userId || !data.amount || !data.currency) {
        throw new Error('Données de facture incomplètes');
      }

      if (data.amount <= 0) {
        throw new Error('Le montant doit être positif');
      }

      // Calculer le total avec taxe
      const tax = data.tax || 0;
      const totalAmount = data.amount + tax;

      // Générer le numéro de facture
      const invoiceNumber =
        await this.invoiceRepository.generateInvoiceNumber();

      // Créer la facture via le repository
      const invoice = await this.invoiceRepository.create({
        invoiceNumber,
        userId: data.userId,
        transactionId: data.transactionId,
        bookingId: data.bookingId,
        amount: data.amount,
        currency: data.currency,
        tax,
        totalAmount,
        status: 'DRAFT',
        dueDate: data.dueDate || this.calculateDueDate(),
        items: data.items,
        billingAddress: data.billingAddress,
        metadata: data.metadata,
      } as Partial<Invoice>);

      return invoice;
    } catch (error) {
      logger.error({ error, data }, 'Erreur createInvoice');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer une facture par ID
   */
  @Log({ level: 'info', logArgs: true })
  @Validate({
    rules: [
      createValidationRule(
        0,
        z.string().min(1, 'Invoice ID is required'),
        'id',
      ),
    ],
  })
  @Cacheable(600, { prefix: 'InvoiceService:getInvoiceById' }) // Cache 10 minutes
  async getInvoiceById(id: string): Promise<Invoice> {
    try {
      const invoice = await this.invoiceRepository.findById(id);

      if (!invoice) {
        throw new Error('Facture non trouvée');
      }

      return invoice;
    } catch (error) {
      logger.error({ error, id }, 'Erreur getInvoiceById');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les factures d'un utilisateur
   */
  @Cacheable(900, { prefix: 'InvoiceService:getUserInvoices' }) // Cache 15 minutes
  async getUserInvoices(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<PaginatedResult<Invoice>> {
    try {
      return await this.invoiceRepository.findByUser(userId, options);
    } catch (error) {
      logger.error({ error, userId }, 'Erreur getUserInvoices');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les factures avec filtres
   */
  @Cacheable(900, { prefix: 'InvoiceService:getInvoices' }) // Cache 15 minutes
  async getInvoices(
    filters: Record<string, any>,
    options?: { limit?: number; offset?: number },
  ): Promise<PaginatedResult<Invoice>> {
    try {
      return await this.invoiceRepository.findInvoicesWithFilters(
        filters,
        options,
      );
    } catch (error) {
      logger.error({ error, filters }, 'Erreur getInvoices');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mettre à jour une facture
   */
  @InvalidateCache('InvoiceService:*')
  async updateInvoice(
    id: string,
    data: Partial<InvoiceData>,
  ): Promise<Invoice> {
    try {
      const updateData: Partial<Invoice> = {
        ...(data.amount && { amount: data.amount }),
        ...(data.tax !== undefined && { tax: data.tax }),
        ...(data.items && { items: data.items }),
        ...(data.billingAddress && { billingAddress: data.billingAddress }),
        ...(data.metadata && { metadata: data.metadata }),
      };

      // Recalculer le total si le montant ou la taxe change
      if (data.amount !== undefined || data.tax !== undefined) {
        const invoice = await this.invoiceRepository.findById(id);
        if (invoice) {
          updateData.totalAmount =
            (data.amount || invoice.amount) + (data.tax || invoice.tax || 0);
        }
      }

      const updatedInvoice = await this.invoiceRepository.update(
        id,
        updateData,
      );

      if (!updatedInvoice) {
        throw new Error('Facture non trouvée');
      }

      return updatedInvoice;
    } catch (error) {
      logger.error({ error, id }, 'Erreur updateInvoice');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'une facture
   */
  async updateInvoiceStatus(
    id: string,
    status: Invoice['status'],
  ): Promise<boolean> {
    try {
      return await this.invoiceRepository.updateStatus(id, status);
    } catch (error) {
      logger.error({ error, id, status }, 'Erreur updateInvoiceStatus');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Marquer une facture comme payée
   */
  async markInvoiceAsPaid(id: string, paidAt?: Date): Promise<boolean> {
    try {
      return await this.invoiceRepository.markAsPaid(id, paidAt || new Date());
    } catch (error) {
      logger.error({ error, id }, 'Erreur markInvoiceAsPaid');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les factures en retard
   */
  async getOverdueInvoices(options?: {
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResult<Invoice>> {
    try {
      return await this.invoiceRepository.findOverdue(options);
    } catch (error) {
      logger.error({ error }, 'Erreur getOverdueInvoices');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Supprimer une facture
   */
  async deleteInvoice(id: string): Promise<boolean> {
    try {
      return await this.invoiceRepository.delete(id);
    } catch (error) {
      logger.error({ error, id }, 'Erreur deleteInvoice');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Calculer la date d'échéance (30 jours par défaut)
   */
  private calculateDueDate(): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate;
  }
}

// Export singleton
export const invoiceService = InvoiceService.getInstance();
