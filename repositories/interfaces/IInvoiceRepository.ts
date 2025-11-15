/**
 * Interface du repository pour les factures
 */

import { IPaginatedRepository, PaginatedResult, PaginationOptions } from './IRepository';

export interface Invoice {
  id: string;
  _id?: string;
  invoiceNumber: string;
  userId: string;
  transactionId?: string;
  bookingId?: string;
  amount: number;
  currency: string;
  tax?: number;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate?: Date;
  paidAt?: Date;
  items: InvoiceItem[];
  billingAddress?: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceFilters {
  userId?: string;
  transactionId?: string;
  bookingId?: string;
  status?: InvoiceStatus;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  [key: string]: any;
}

export interface IInvoiceRepository extends IPaginatedRepository<Invoice, string> {
  /**
   * Trouver des factures par utilisateur
   */
  findByUser(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Invoice>>;

  /**
   * Trouver des factures par statut
   */
  findByStatus(
    status: InvoiceStatus,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Invoice>>;

  /**
   * Trouver des factures en retard
   */
  findOverdue(options?: PaginationOptions): Promise<PaginatedResult<Invoice>>;

  /**
   * Générer un numéro de facture unique
   */
  generateInvoiceNumber(): Promise<string>;

  /**
   * Mettre à jour le statut d'une facture
   */
  updateStatus(invoiceId: string, status: InvoiceStatus): Promise<boolean>;

  /**
   * Marquer une facture comme payée
   */
  markAsPaid(invoiceId: string, paidAt: Date): Promise<boolean>;

  /**
   * Trouver des factures avec filtres avancés
   */
  findInvoicesWithFilters(
    filters: InvoiceFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Invoice>>;
}

