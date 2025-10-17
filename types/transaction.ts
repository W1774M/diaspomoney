/**
 * Types transaction - DiaspoMoney
 */

import { BaseEntity } from './index';

// === TYPES TRANSACTION ===
export interface Transaction extends BaseEntity {
  payerId: string;
  beneficiaryId: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  fees: number;
  totalAmount: number;
  serviceType: 'HEALTH' | 'BTP' | 'EDUCATION';
  status: TransactionStatus;
  type: TransactionType;
  metadata?: Record<string, any>;
  paymentIntentId?: string;
  refundId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  TRANSFER = 'TRANSFER',
  FEE = 'FEE'
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
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  PAYPAL = 'PAYPAL'
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
  status?: TransactionStatus[];
  type?: TransactionType[];
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
