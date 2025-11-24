/**
 * Facades Index
 * 
 * Export centralisé de toutes les facades disponibles
 * 
 * Note: booking.facade.ts a été fusionné dans service-booking.facade.ts
 * Tous les usages de bookingFacade doivent maintenant utiliser serviceBookingFacade
 */

export { ComplaintFacade, complaintFacade } from './complaint.facade';
export { InvoiceFacade, invoiceFacade } from './invoice.facade';
export { PaymentFacade, paymentFacade } from './payment.facade';
export { BeneficiaryFacade, beneficiaryFacade } from './beneficiary.facade';
export { ServiceBookingFacade, serviceBookingFacade } from './service-booking.facade';
export { TransactionFacade, transactionFacade } from './transaction.facade';
export { UserFacade, userFacade } from './user.facade';
export { NotificationFacade, notificationFacade } from './notification.facade';
export { MessagingFacade, messagingFacade } from './messaging.facade';
export { StatisticsFacade, statisticsFacade } from './statistics.facade';
export { SpecialityFacade, specialityFacade } from './speciality.facade';
export { EducationFacade, educationFacade } from './education.facade';
export { BTPFacade, btpFacade } from './btp.facade';

// Alias pour compatibilité (déprécié - utiliser serviceBookingFacade)
// @deprecated Utilisez serviceBookingFacade à la place
export { ServiceBookingFacade as BookingFacade, serviceBookingFacade as bookingFacade } from './service-booking.facade';

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
  TransactionFacadeData,
  TransactionFacadeResult,
  UserFacadeData,
  UserFacadeResult,
  NotificationFacadeData,
  NotificationFacadeResult,
  MessagingFacadeData,
  MessagingFacadeResult,
  StatisticsFacadeData,
  StatisticsFacadeResult,
  SpecialityFacadeData,
  SpecialityFacadeResult,
  EducationFacadeData,
  EducationFacadeResult,
  BTPFacadeData,
  BTPFacadeResult,
} from '@/lib/types';

// UpdateBeneficiaryFacadeData est défini localement dans beneficiary.facade.ts
export type { UpdateBeneficiaryFacadeData } from './beneficiary.facade';

// Types pour ServiceBookingFacade
export type {
  ServiceBookingFacadeData,
  ServiceBookingFacadeResult,
  ServiceType,
  ClientInfo,
  BeneficiaryInfo,
  SelectedService,
} from '@/lib/types/service-booking.types';
export type { ServiceOption } from '@/lib/types/service-options.types';

