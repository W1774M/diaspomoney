/**
 * Mappers pour les paiements
 * Transforme les documents payment en réponses API
 */

import type { IMapper, MappingOptions } from '@/lib/types';
import type { PaymentIntent, PaymentMethodType } from '@/lib/types/payments.types';
import { PaymentStatus } from '@/lib/types/transaction.types';
import { CURRENCIES } from '@/lib/constants';

/**
 * Type pour un document Payment MongoDB
 */
export interface PaymentDocument {
  _id?: any;
  id?: string;
  userId?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  method?: string;
  status?: string;
  paymentIntentId?: string;
  clientSecret?: string;
  metadata?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

/**
 * Type pour une réponse API de payment
 */
export interface PaymentResponse {
  id: string;
  _id: string;
  userId: string;
  transactionId: string;
  amount: number;
  currency: string;
  method: PaymentMethodType;
  status: PaymentStatus;
  paymentIntentId: string;
  clientSecret?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convertit une date en ISO string de manière sécurisée
 */
function toISOString(date: Date | string | undefined | null): string {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  try {
    return new Date(date as string | number).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Mappe le statut depuis le format MongoDB vers le format Payment
 */
function mapStatus(status: string | undefined): PaymentStatus {
  if (!status) return PaymentStatus.PENDING;
  
  const statusMap: Record<string, PaymentStatus> = {
    pending: PaymentStatus.PENDING,
    processing: PaymentStatus.PROCESSING,
    succeeded: PaymentStatus.SUCCEEDED,
    failed: PaymentStatus.FAILED,
    cancelled: PaymentStatus.CANCELLED,
    canceled: PaymentStatus.CANCELLED,
    refunded: PaymentStatus.REFUNDED,
  };
  
  const normalizedStatus = status.toLowerCase();
  return statusMap[normalizedStatus] || PaymentStatus.PENDING;
}

/**
 * Mappe la méthode de paiement
 */
function mapMethod(method: string | undefined): PaymentMethodType {
  if (!method) return 'CARD';
  
  const methodMap: Record<string, PaymentMethodType> = {
    card: 'CARD',
    bank_transfer: 'BANK_TRANSFER',
    banktransfer: 'BANK_TRANSFER',
    mobile_money: 'MOBILE_MONEY',
    mobilemoney: 'MOBILE_MONEY',
    paypal: 'PAYPAL',
    stripe: 'STRIPE',
  };
  
  const normalizedMethod = method.toLowerCase();
  return methodMap[normalizedMethod] || 'CARD';
}

/**
 * Classe PaymentMapper implémentant IMapper
 */
export class PaymentMapper implements IMapper<PaymentDocument, PaymentResponse> {
  /**
   * Transforme un document payment vers une réponse API
   */
  map(input: PaymentDocument, options?: MappingOptions): PaymentResponse {
    return mapPaymentToResponse(input, options);
  }

  /**
   * Transforme un tableau de documents payment
   */
  mapMany(inputs: PaymentDocument[], options?: MappingOptions): PaymentResponse[] {
    return inputs.map((input) => this.map(input, options));
  }
}

/**
 * Instance singleton du mapper
 */
export const paymentMapper = new PaymentMapper();

/**
 * Mappe un document payment vers une réponse API
 * 
 * @param paymentDoc - Document payment depuis le repository
 * @param options - Options de mapping
 * @returns Réponse API formatée
 */
export function mapPaymentToResponse(
  paymentDoc: PaymentDocument,
  _options?: MappingOptions,
): PaymentResponse {
  // Extraire l'ID
  const id = paymentDoc.id || paymentDoc._id?.toString() || '';
  const _id = paymentDoc._id?.toString() || id;

  return {
    id,
    _id,
    userId: paymentDoc.userId || '',
    transactionId: paymentDoc.transactionId || '',
    amount: paymentDoc.amount || 0,
    currency: paymentDoc.currency || CURRENCIES.EUR.code,
    method: mapMethod(paymentDoc.method),
    status: mapStatus(paymentDoc.status),
    paymentIntentId: paymentDoc.paymentIntentId || '',
    ...(paymentDoc.clientSecret && { clientSecret: paymentDoc.clientSecret }),
    ...(paymentDoc.metadata && { metadata: paymentDoc.metadata }),
    createdAt: toISOString(paymentDoc.createdAt),
    updatedAt: toISOString(paymentDoc.updatedAt),
  };
}

/**
 * Mappe un PaymentIntent Stripe vers une réponse API
 */
export function mapPaymentIntentToResponse(
  paymentIntent: PaymentIntent,
  _options?: MappingOptions,
): PaymentResponse {
  // Mapper le statut Stripe vers PaymentStatus
  let status: PaymentStatus = PaymentStatus.PENDING;
  if (paymentIntent.status === 'succeeded') {
    status = PaymentStatus.SUCCEEDED;
  } else if (paymentIntent.status === 'processing') {
    status = PaymentStatus.PROCESSING;
  } else if (paymentIntent.status === 'canceled') {
    status = PaymentStatus.CANCELLED;
  }

  return {
    id: paymentIntent.id,
    _id: paymentIntent.id,
    userId: paymentIntent.metadata?.['userId'] || '',
    transactionId: paymentIntent.metadata?.['transactionId'] || '',
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    method: 'CARD', // Par défaut pour Stripe
    status,
    paymentIntentId: paymentIntent.id,
    ...(paymentIntent.clientSecret && { clientSecret: paymentIntent.clientSecret }),
    metadata: paymentIntent.metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

