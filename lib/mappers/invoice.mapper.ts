/**
 * Mappers pour les factures/invoices
 * Transforme les documents invoice en réponses API
 */

import type { IMapper, MappingOptions } from '@/lib/types';
import { InvoiceStatus } from '@/lib/types/invoices.types';
import { CURRENCIES } from '@/lib/constants';
// Invoice type is used in the function signatures

/**
 * Type pour un document Invoice MongoDB
 */
export interface InvoiceDocument {
  _id?: any;
  id?: string;
  invoiceNumber?: string;
  customerId?: string;
  userId?: string;
  providerId?: string;
  transactionId?: string;
  bookingId?: string;
  amount?: number;
  currency?: string;
  tax?: number;
  totalAmount?: number;
  status?: string;
  issueDate?: Date | string;
  dueDate?: Date | string;
  paymentDate?: Date | string;
  paidDate?: Date | string;
  paidAt?: Date | string;
  items?: Array<{
    description?: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  }>;
  notes?: string;
  metadata?: Record<string, any>;
  billingAddress?: {
    street?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

/**
 * Type pour une réponse API d'invoice
 */
export interface InvoiceResponse {
  id: string;
  _id: string;
  invoiceNumber: string;
  customerId: string;
  providerId: string;
  transactionId?: string;
  bookingId?: string;
  amount: number;
  currency: string;
  tax?: number;
  totalAmount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paymentDate?: string;
  paidDate?: string;
  paidAt?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
  metadata?: Record<string, any>;
  billingAddress?: {
    street?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
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
 * Mappe le statut depuis le format MongoDB vers le format Invoice
 */
function mapStatus(status: string | undefined): InvoiceStatus {
  if (!status) return InvoiceStatus.PENDING;
  
  const statusMap: Record<string, InvoiceStatus> = {
    draft: InvoiceStatus.DRAFT,
    pending: InvoiceStatus.PENDING,
    paid: InvoiceStatus.PAID,
    overdue: InvoiceStatus.OVERDUE,
    cancelled: InvoiceStatus.CANCELLED,
    canceled: InvoiceStatus.CANCELLED,
  };
  
  const normalizedStatus = status.toLowerCase();
  return statusMap[normalizedStatus] || InvoiceStatus.PENDING;
}

/**
 * Classe InvoiceMapper implémentant IMapper
 */
export class InvoiceMapper implements IMapper<InvoiceDocument, InvoiceResponse> {
  /**
   * Transforme un document invoice vers une réponse API
   */
  map(input: InvoiceDocument, options?: MappingOptions): InvoiceResponse {
    return mapInvoiceToResponse(input, options);
  }

  /**
   * Transforme un tableau de documents invoice
   */
  mapMany(inputs: InvoiceDocument[], options?: MappingOptions): InvoiceResponse[] {
    return inputs.map((input) => this.map(input, options));
  }
}

/**
 * Instance singleton du mapper
 */
export const invoiceMapper = new InvoiceMapper();

/**
 * Mappe un document invoice vers une réponse API
 * 
 * @param invoiceDoc - Document invoice depuis le repository
 * @param options - Options de mapping
 * @returns Réponse API formatée
 */
export function mapInvoiceToResponse(
  invoiceDoc: InvoiceDocument,
  _options?: MappingOptions,
): InvoiceResponse {
  // Extraire l'ID
  const id = invoiceDoc.id || invoiceDoc._id?.toString() || '';
  const _id = invoiceDoc._id?.toString() || id;

  const amount = invoiceDoc.amount || 0;
  const tax = invoiceDoc.tax || 0;
  const totalAmount = invoiceDoc.totalAmount || (amount + tax);

  // Mapper les items
  const items = (invoiceDoc.items || []).map(item => ({
    description: item.description || '',
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice || 0,
    total: item.total || (item.unitPrice || 0) * (item.quantity || 1),
  }));

  const response: InvoiceResponse = {
    id,
    _id,
    invoiceNumber: invoiceDoc.invoiceNumber || '',
    customerId: invoiceDoc.customerId || invoiceDoc.userId || '',
    providerId: invoiceDoc.providerId || '',
    ...(invoiceDoc.transactionId && { transactionId: invoiceDoc.transactionId }),
    ...(invoiceDoc.bookingId && { bookingId: invoiceDoc.bookingId }),
    amount,
    currency: invoiceDoc.currency || CURRENCIES.EUR.code,
    ...(tax > 0 && { tax }),
    totalAmount,
    status: mapStatus(invoiceDoc.status),
    issueDate: toISOString(invoiceDoc.issueDate) || new Date().toISOString(),
    dueDate: toISOString(invoiceDoc.dueDate) || new Date().toISOString(),
    ...(invoiceDoc.paymentDate || invoiceDoc.paidDate || invoiceDoc.paidAt ? {
      paymentDate: toISOString(invoiceDoc.paymentDate || invoiceDoc.paidDate || invoiceDoc.paidAt) || '',
    } : {}),
    ...(invoiceDoc.paidDate || invoiceDoc.paidAt ? {
      paidDate: toISOString(invoiceDoc.paidDate || invoiceDoc.paidAt) || '',
    } : {}),
    items,
    ...(invoiceDoc.notes && { notes: invoiceDoc.notes }),
    ...(invoiceDoc.metadata && { metadata: invoiceDoc.metadata }),
    ...(invoiceDoc.billingAddress && { billingAddress: invoiceDoc.billingAddress }),
    createdAt: toISOString(invoiceDoc.createdAt) || new Date().toISOString(),
    updatedAt: toISOString(invoiceDoc.updatedAt) || new Date().toISOString(),
  };
  
  return response;
}

