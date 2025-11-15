/**
 * Invoice Service - DiaspoMoney
 * Service de gestion des factures utilisant le Repository Pattern
 */

import { getInvoiceRepository, Invoice, InvoiceFilters, PaginatedResult } from '@/repositories';
import * as Sentry from '@sentry/nextjs';

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
      const invoiceNumber = await this.invoiceRepository.generateInvoiceNumber();

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
      console.error('Erreur createInvoice:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer une facture par ID
   */
  async getInvoiceById(id: string): Promise<Invoice> {
    try {
      const invoice = await this.invoiceRepository.findById(id);
      
      if (!invoice) {
        throw new Error('Facture non trouvée');
      }

      return invoice;
    } catch (error) {
      console.error('Erreur getInvoiceById:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les factures d'un utilisateur
   */
  async getUserInvoices(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PaginatedResult<Invoice>> {
    try {
      return await this.invoiceRepository.findByUser(userId, options);
    } catch (error) {
      console.error('Erreur getUserInvoices:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les factures avec filtres
   */
  async getInvoices(
    filters: InvoiceFilters,
    options?: { limit?: number; offset?: number }
  ): Promise<PaginatedResult<Invoice>> {
    try {
      return await this.invoiceRepository.findInvoicesWithFilters(filters, options);
    } catch (error) {
      console.error('Erreur getInvoices:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mettre à jour une facture
   */
  async updateInvoice(
    id: string,
    data: Partial<InvoiceData>
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
          updateData.totalAmount = (data.amount || invoice.amount) + (data.tax || invoice.tax || 0);
        }
      }

      const updatedInvoice = await this.invoiceRepository.update(id, updateData);

      if (!updatedInvoice) {
        throw new Error('Facture non trouvée');
      }

      return updatedInvoice;
    } catch (error) {
      console.error('Erreur updateInvoice:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'une facture
   */
  async updateInvoiceStatus(
    id: string,
    status: Invoice['status']
  ): Promise<boolean> {
    try {
      return await this.invoiceRepository.updateStatus(id, status);
    } catch (error) {
      console.error('Erreur updateInvoiceStatus:', error);
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
      console.error('Erreur markInvoiceAsPaid:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les factures en retard
   */
  async getOverdueInvoices(
    options?: { limit?: number; offset?: number }
  ): Promise<PaginatedResult<Invoice>> {
    try {
      return await this.invoiceRepository.findOverdue(options);
    } catch (error) {
      console.error('Erreur getOverdueInvoices:', error);
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
      console.error('Erreur deleteInvoice:', error);
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

