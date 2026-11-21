/**
 * Mappers pour les transactions
 * Transforme les documents transaction en réponses API
 */

import type { IMapper, MappingOptions } from '@/lib/types';
import { TransactionStatus, TransactionType } from '@/lib/types/transaction.types';
import { CURRENCIES } from '@/lib/constants';
// Transaction type is used in the function signatures

/**
 * Type pour un document Transaction MongoDB
 */
export interface TransactionDocument {
  _id?: any;
  id?: string;
  payerId?: string;
  beneficiaryId?: string;
  amount?: number;
  currency?: string;
  exchangeRate?: number;
  fees?: number;
  totalAmount?: number;
  serviceType?: 'HEALTH' | 'BTP' | 'EDUCATION';
  serviceId?: string;
  description?: string;
  status?: string;
  type?: string;
  paymentMethod?: string;
  paymentProvider?: string;
  metadata?: Record<string, any>;
  paymentIntentId?: string;
  refundId?: string;
  completedAt?: Date | string;
  failedAt?: Date | string;
  failureReason?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

/**
 * Type pour une réponse API de transaction
 */
export interface TransactionResponse {
  id: string;
  _id: string;
  payerId: string;
  beneficiaryId: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  fees: number;
  totalAmount: number;
  serviceType: 'HEALTH' | 'BTP' | 'EDUCATION';
  serviceId?: string;
  description?: string;
  status: TransactionStatus;
  type: TransactionType;
  paymentMethod?: string;
  paymentProvider?: string;
  metadata?: Record<string, any>;
  paymentIntentId?: string;
  refundId?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convertit une date en ISO string de manière sécurisée
 */
function toISOString(date: Date | string | undefined | null): string | undefined {
  if (!date) return undefined;
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  try {
    return new Date(date as string | number).toISOString();
  } catch {
    return undefined;
  }
}

/**
 * Mappe le statut depuis le format MongoDB vers le format Transaction
 */
function mapStatus(status: string | undefined): TransactionStatus {
  if (!status) return TransactionStatus.PENDING;
  
  const statusMap: Record<string, TransactionStatus> = {
    pending: TransactionStatus.PENDING,
    processing: TransactionStatus.PROCESSING,
    completed: TransactionStatus.COMPLETED,
    failed: TransactionStatus.FAILED,
    cancelled: TransactionStatus.CANCELLED,
    canceled: TransactionStatus.CANCELLED,
    refunded: TransactionStatus.REFUNDED,
  };
  
  const normalizedStatus = status.toLowerCase();
  return statusMap[normalizedStatus] || TransactionStatus.PENDING;
}

/**
 * Mappe le type de transaction
 */
function mapType(type: string | undefined): TransactionType {
  if (!type) return TransactionType.PAYMENT;
  
  const typeMap: Record<string, TransactionType> = {
    payment: TransactionType.PAYMENT,
    refund: TransactionType.REFUND,
    transfer: TransactionType.TRANSFER,
    fee: TransactionType.FEE,
  };
  
  const normalizedType = type.toLowerCase();
  return typeMap[normalizedType] || TransactionType.PAYMENT;
}

/**
 * Classe TransactionMapper implémentant IMapper
 */
export class TransactionMapper implements IMapper<TransactionDocument, TransactionResponse> {
  /**
   * Transforme un document transaction vers une réponse API
   */
  map(input: TransactionDocument, options?: MappingOptions): TransactionResponse {
    return mapTransactionToResponse(input, options);
  }

  /**
   * Transforme un tableau de documents transaction
   */
  mapMany(inputs: TransactionDocument[], options?: MappingOptions): TransactionResponse[] {
    return inputs.map((input) => this.map(input, options));
  }
}

/**
 * Instance singleton du mapper
 */
export const transactionMapper = new TransactionMapper();

/**
 * Mappe un document transaction vers une réponse API
 * 
 * @param transactionDoc - Document transaction depuis le repository
 * @param options - Options de mapping
 * @returns Réponse API formatée
 */
export function mapTransactionToResponse(
  transactionDoc: TransactionDocument,
  _options?: MappingOptions,
): TransactionResponse {
  // Extraire l'ID
  const id = transactionDoc.id || transactionDoc._id?.toString() || '';
  const _id = transactionDoc._id?.toString() || id;

  const amount = transactionDoc.amount || 0;
  const fees = transactionDoc.fees || 0;
  const totalAmount = transactionDoc.totalAmount || (amount + fees);

  const response: TransactionResponse = {
    id,
    _id,
    payerId: transactionDoc.payerId || '',
    beneficiaryId: transactionDoc.beneficiaryId || '',
    amount,
    currency: transactionDoc.currency || CURRENCIES.EUR.code,
    ...(transactionDoc.exchangeRate !== undefined && { exchangeRate: transactionDoc.exchangeRate }),
    fees,
    totalAmount,
    serviceType: transactionDoc.serviceType || 'HEALTH',
    ...(transactionDoc.serviceId && { serviceId: transactionDoc.serviceId }),
    ...(transactionDoc.description && { description: transactionDoc.description }),
    status: mapStatus(transactionDoc.status),
    type: mapType(transactionDoc.type),
    ...(transactionDoc.paymentMethod && { paymentMethod: transactionDoc.paymentMethod }),
    ...(transactionDoc.paymentProvider && { paymentProvider: transactionDoc.paymentProvider }),
    ...(transactionDoc.metadata && { metadata: transactionDoc.metadata }),
    ...(transactionDoc.paymentIntentId && { paymentIntentId: transactionDoc.paymentIntentId }),
    ...(transactionDoc.refundId && { refundId: transactionDoc.refundId }),
    ...(transactionDoc.completedAt && (() => {
      const completedAtValue = toISOString(transactionDoc.completedAt);
      return completedAtValue ? { completedAt: completedAtValue } : {};
    })()),
    ...(transactionDoc.failedAt && (() => {
      const failedAtValue = toISOString(transactionDoc.failedAt);
      return failedAtValue ? { failedAt: failedAtValue } : {};
    })()),
    ...(transactionDoc.failureReason && { failureReason: transactionDoc.failureReason }),
    createdAt: toISOString(transactionDoc.createdAt) || new Date().toISOString(),
    updatedAt: toISOString(transactionDoc.updatedAt) || new Date().toISOString(),
  };
  
  return response;
}

