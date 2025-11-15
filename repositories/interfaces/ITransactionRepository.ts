/**
 * Interface du repository pour les transactions
 */

import { IPaginatedRepository, PaginatedResult, PaginationOptions } from './IRepository';

export interface Transaction {
  id: string;
  _id?: string;
  payerId: string;
  beneficiaryId: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  fees: number;
  totalAmount: number;
  serviceType: 'HEALTH' | 'BTP' | 'EDUCATION';
  serviceId: string;
  description: string;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  paymentProvider: PaymentProvider;
  paymentIntentId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'MOBILE_MONEY'
  | 'PAYPAL';

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

export interface ITransactionRepository extends IPaginatedRepository<Transaction, string> {
  /**
   * Trouver des transactions par payeur
   */
  findByPayer(payerId: string, options?: PaginationOptions): Promise<PaginatedResult<Transaction>>;

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
  updateStatus(transactionId: string, status: TransactionStatus): Promise<boolean>;

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
  calculateTotalByUser(userId: string, filters?: TransactionFilters): Promise<number>;
}

