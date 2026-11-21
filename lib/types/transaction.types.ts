/**
 * Types transaction - DiaspoMoney
 */

import { BaseEntity } from './index';

// === TYPES TRANSACTION ===
export interface Transaction extends BaseEntity {
  id: string; // Alias pour _id
  payerId: string;
  beneficiaryId: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  fees: number;
  totalAmount: number;
  serviceType: 'HEALTH' | 'BTP' | 'EDUCATION';
  serviceId?: string; // ID du service associé
  description?: string; // Description de la transaction
  status: TransactionStatus;
  type: TransactionType;
  paymentMethod?: string; // Méthode de paiement
  paymentProvider?: string; // Fournisseur de paiement
  metadata?: Record<string, any>;
  paymentIntentId?: string;
  refundId?: string;
  completedAt?: Date; // Date de complétion
  failedAt?: Date; // Date d'échec
  failureReason?: string; // Raison de l'échec
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  TRANSFER = 'TRANSFER',
  FEE = 'FEE',
}

// === TYPES PAIEMENT ===
export interface Payment extends BaseEntity {
  userId: string;
  transactionId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  paymentIntentId: string;
  clientSecret: string;
  metadata: Record<string, any>;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  PAYPAL = 'PAYPAL',
}

// === TYPES DE REQUÊTES ===
export interface CreateTransactionRequest {
  userId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  description: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number;
  reason: string;
}

export interface TransactionFilters {
  userId?: string;
  payerId?: string;
  beneficiaryId?: string;
  status?: TransactionStatus[];
  type?: TransactionType[];
  serviceType?: 'HEALTH' | 'BTP' | 'EDUCATION';
  currency?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
}

// === TYPES DE RÉPONSES ===
export interface TransactionResponse {
  transaction: Transaction;
  message: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface PaymentResponse {
  payment: Payment;
  clientSecret: string;
  message: string;
}

export interface RefundResponse {
  refund: Transaction;
  message: string;
}

// === TYPES WEBHOOK ===
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

export interface PaymentIntentWebhook {
  id: string;
  status: string;
  amount: number;
  currency: string;
  metadata: Record<string, any>;
}

// === TYPES FRAIS ===
export interface FeeCalculation {
  baseAmount: number;
  feeAmount: number;
  totalAmount: number;
  currency: string;
  feeRate: number;
  feeType: 'PERCENTAGE' | 'FIXED';
}

export interface CurrencyConversion {
  from: string;
  to: string;
  rate: number;
  amount: number;
  convertedAmount: number;
  timestamp: Date;
}

export interface TransactionData {
  payerId: string;
  beneficiaryId: string;
  amount: number;
  currency: string;
  serviceType: 'HEALTH' | 'BTP' | 'EDUCATION';
  serviceId: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  successRate?: number;
  averageAmount?: number;
  totalSuccessTransactions?: number;
  totalFailedTransactions?: number;
  totalRefundedTransactions?: number;
  totalCancelledTransactions?: number;
  totalFees?: number;
  currencyBreakdown?: Record<string, { count: number; amount: number }>;
  serviceTypeBreakdown?: Record<string, { count: number; amount: number }>;
}

// === TYPES TRANSACTION ALTERNATIVE (pour compatibilité) ===
// Note: Cette interface est une version simplifiée de Transaction
// Utilisez Transaction (ligne 8) pour les transactions complètes avec payerId/beneficiaryId
export interface SimpleTransaction extends BaseEntity {
  userId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  metadata?: Record<string, any>;
  paymentIntentId?: string;
  refundId?: string;
}

export interface PaymentTransaction extends Transaction {
  paymentIntentId: string;
  clientSecret?: string;
  metadata?: Record<string, any>;
}