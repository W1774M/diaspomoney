/**
 * Interface du repository pour les transactions
 */

import {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';
import type { Transaction, TransactionStatus, PaymentMethod } from '@/lib/types';

// Re-export pour compatibilité
export type { Transaction, TransactionStatus, PaymentMethod };

export type PaymentProvider = 'STRIPE' | 'PAYPAL' | 'MOBILE_MONEY';

export interface TransactionFilters {
  payerId?: string;
  beneficiaryId?: string;
  status?: TransactionStatus;
  paymentMethod?: PaymentMethod;
  paymentProvider?: PaymentProvider;
  serviceType?: 'HEALTH' | 'BTP' | 'EDUCATION';
  serviceId?: string;
  currency?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  [key: string]: any;
}

export interface ITransactionRepository
  extends IPaginatedRepository<Transaction, string> {
  /**
   * Trouver des transactions par payeur
   */
  findByPayer(
    payerId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Transaction>>;

  /**
   * Trouver des transactions par bénéficiaire
   */
  findByBeneficiary(
    beneficiaryId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Transaction>>;

  /**
   * Trouver des transactions par statut
   */
  findByStatus(
    status: TransactionStatus,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Transaction>>;

  /**
   * Mettre à jour le statut d'une transaction
   */
  updateStatus(
    transactionId: string,
    status: TransactionStatus
  ): Promise<boolean>;

  /**
   * Trouver une transaction par paymentIntentId
   */
  findByPaymentIntentId(paymentIntentId: string): Promise<Transaction | null>;

  /**
   * Mettre à jour une transaction avec métadonnées (statut, dates, etc.)
   */
  updateWithMetadata(
    transactionId: string,
    data: {
      status?: TransactionStatus;
      completedAt?: Date;
      failedAt?: Date;
      failureReason?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Transaction | null>;

  /**
   * Trouver des transactions avec filtres avancés
   */
  findTransactionsWithFilters(
    filters: TransactionFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Transaction>>;

  /**
   * Calculer le total des transactions pour un utilisateur
   */
  calculateTotalByUser(
    userId: string,
    filters?: TransactionFilters
  ): Promise<number>;
}
