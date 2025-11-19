/**
 * Facades Index
 * 
 * Export centralisé de toutes les facades disponibles
 */

export { BookingFacade, bookingFacade } from './booking.facade';
export { ComplaintFacade, complaintFacade } from './complaint.facade';
export { InvoiceFacade, invoiceFacade } from './invoice.facade';
export { PaymentFacade, paymentFacade } from './payment.facade';
export { BeneficiaryFacade, beneficiaryFacade } from './beneficiary.facade';

// Réexporter les types depuis @/lib/types
export type {
  BookingFacadeData,
  BookingFacadeResult,
  ComplaintFacadeData,
  ComplaintFacadeResult,
  InvoiceFacadeData,
  InvoiceFacadeResult,
  PaymentFacadeData,
  PaymentFacadeResult,
  BeneficiaryFacadeData,
  BeneficiaryFacadeResult,
} from '@/lib/types';

// UpdateBeneficiaryFacadeData est défini localement dans beneficiary.facade.ts
export type { UpdateBeneficiaryFacadeData } from './beneficiary.facade';

