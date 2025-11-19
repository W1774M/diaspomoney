/**
 * Types et interfaces pour les hooks personnalisés
 */

import type React from 'react';
import { AvailabilityRule, CreateAvailabilityRuleData, UpdateAvailabilityRuleData } from './availability.types';
import { Beneficiary } from './beneficiaries.types';
import { Complaint } from './complaints.types';
import { Invoice as IInvoice } from './invoices.types';
import { ISpeciality } from './index';
import { UINotification } from './notifications.types';
import {
  PaymentReceipt,
  UIAccountBalance,
  UIBillingAddress,
  UIPaymentMethod,
  PaymentData,
} from './payments.types';
import { ProviderInfo } from './user.types';
import { PersonalStatistics } from './statistics.types';
import { AppointmentData } from './bookings.types';

/**
 * Interface de retour du hook usePayments
 */
export interface UsePaymentsReturn {
  paymentMethods: UIPaymentMethod[];
  billingAddresses: UIBillingAddress[];
  balance: UIAccountBalance | null;
  loading: boolean;
  error: string | null;
  fetchPaymentMethods: () => Promise<void>;
  fetchBillingAddresses: () => Promise<void>;
  fetchBalance: () => Promise<void>;
  setDefaultPaymentMethod: (
    type: 'card' | 'paypal',
    id: string
  ) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  deletePaymentMethod: (type: 'card' | 'paypal', id: string) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
}

/**
 * Interface de retour du hook useNotifications
 */
export interface UseNotificationsReturn {
  notifications: UINotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  totalPages: number;
  page: number;
  fetchNotifications: (
    filter?: 'all' | 'unread' | 'read',
    pageNum?: number
  ) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setPage: (page: number) => void;
}

/**
 * Interface de retour du hook useSpeciality
 */
export interface UseSpecialityReturn {
  speciality: ISpeciality | null;
  loading: boolean;
  error: string | null;
  fetchSpeciality: (id: string) => Promise<void>;
  deleteSpeciality: (id: string) => Promise<void>;
}

/**
 * Interface de retour du hook useStatistics
 */
export interface UseStatisticsReturn {
  statistics: PersonalStatistics | null;
  loading: boolean;
  error: string | null;
  fetchStatistics: () => Promise<void>;
}

/**
 * Interface de retour du hook useComplaints
 */
export interface UseComplaintsReturn {
  complaints: Complaint[];
  loading: boolean;
  error: string | null;
  total: number;
  fetchComplaints: (options?: UseComplaintsOptions) => Promise<void>;
}

/**
 * Options pour le hook useComplaints
 */
export interface UseComplaintsOptions {
  userId?: string;
  provider?: string;
  appointmentId?: string;
  type?: string;
  priority?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Interface de retour du hook useBookingCancel
 */
export interface UseBookingCancelReturn {
  cancelBooking: (bookingId: string) => Promise<any>;
  loading: boolean;
  error: string | null;
}

/**
 * Interface de retour du hook usePaymentReceipts
 */
export interface UsePaymentReceiptsReturn {
  receipts: PaymentReceipt[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * === INVOICES HOOKS ===
 */
export interface UseInvoiceReturn {
  invoice: IInvoice | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseInvoicesProps {
  limit?: number;
  offset?: number;
  userId?: string | undefined;
  isAdmin?: boolean;
  isProvider?: boolean;
  isCustomer?: boolean;
}

export interface UseInvoicesReturn {
  invoices: IInvoice[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseInvoiceCreateReturn {
  createInvoice: (data: Partial<IInvoice>) => Promise<IInvoice | null>;
  creating: boolean;
  error: string | null;
}

export interface UseInvoiceEditReturn {
  updateInvoice: (
    invoiceId: string,
    data: Partial<IInvoice>
  ) => Promise<IInvoice | null>;
  saving: boolean;
  error: string | null;
}

export interface UseInvoiceActionsReturn {
  downloadInvoice: (invoiceId: string) => Promise<void>;
  sendInvoiceByEmail: (invoiceId: string) => Promise<void>;
  isDownloading: boolean;
  isSending: boolean;
}

export interface UserOption {
  id: string;
  name: string;
  email?: string;
  label: string;
}

export interface UseInvoiceUsersReturn {
  customers: UserOption[];
  providers: UserOption[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * === PAYMENTS HOOKS ===
 */
export interface CardFormData {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  isDefault: boolean;
}

export interface PayPalFormData {
  email: string;
  password: string;
  isDefault: boolean;
}

export interface UsePaymentMethodCreateReturn {
  createCard: (data: CardFormData) => Promise<UIPaymentMethod | null>;
  createPayPal: (data: PayPalFormData) => Promise<UIPaymentMethod | null>;
  loading: boolean;
  error: string | null;
}

export interface BillingAddressFormData {
  name: string;
  address: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  type: 'home' | 'work' | 'other';
}

export interface UseBillingAddressCreateReturn {
  createAddress: (
    data: BillingAddressFormData
  ) => Promise<UIBillingAddress | null>;
  loading: boolean;
  error: string | null;
}

/**
 * === NOTIFICATIONS HOOKS ===
 */
export interface PreferencesData {
  language: string;
  timezone: string;
  notifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface UseNotificationPreferencesReturn {
  preferences: PreferencesData;
  loading: boolean;
  saving: boolean;
  error: string | null;
  setPreferences: React.Dispatch<React.SetStateAction<PreferencesData>>;
  updatePreferences: (preferences: Partial<PreferencesData>) => Promise<void>;
}

/**
 * === PROVIDERS HOOKS ===
 */
export interface ProviderRatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface UseProviderDetailReturn {
  provider: ProviderInfo | null;
  ratingStats: ProviderRatingStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface ProviderFilters {
  category?: string;
  city?: string;
  specialty?: string;
  service?: string;
  minRating?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface UseProvidersReturn {
  providers: ProviderInfo[];
  loading: boolean;
  error: string | null;
  total: number;
  hasResults: boolean;
  refetch: () => void;
}

/**
 * === AVAILABILITIES HOOKS ===
 */
export interface UseAvailabilitiesReturn {
  availabilities: AvailabilityRule[];
  loading: boolean;
  error: string | null;
  createAvailabilityRule: (
    ruleData: CreateAvailabilityRuleData,
  ) => Promise<AvailabilityRule | null>;
  updateAvailabilityRule: (
    ruleId: string,
    ruleData: UpdateAvailabilityRuleData,
  ) => Promise<AvailabilityRule | null>;
  deleteAvailabilityRule: (ruleId: string) => Promise<boolean>;
  toggleAvailabilityRuleStatus: (ruleId: string) => Promise<boolean>;
  refreshAvailabilities: (type?: 'weekly' | 'monthly' | 'custom') => Promise<void>;
}

/**
 * === BOOKINGS HOOKS ===
 */
export interface BookingPaymentResult {
  success: boolean;
  reservationNumber?: string;
  error?: string;
}

export interface UseBookingPaymentReturn {
  confirming: boolean;
  error: string | null;
  confirmPayment: (
    appointment: AppointmentData,
    paymentData: PaymentData,
  ) => Promise<BookingPaymentResult>;
  sendPaymentError: (
    appointment: AppointmentData,
    paymentData: PaymentData,
    errorMessage: string,
  ) => Promise<boolean>;
}

/**
 * === BENEFICIARIES HOOKS ===
 */
export interface CreateBeneficiaryData {
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  firstName?: string;
  lastName?: string;
  country?: string;
}

export interface UpdateBeneficiaryData {
  name?: string;
  email?: string;
  phone?: string;
  relationship?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
}

export interface UseBeneficiariesReturn {
  beneficiaries: Beneficiary[];
  loading: boolean;
  error: string | null;
  createBeneficiary: (
    beneficiaryData: CreateBeneficiaryData
  ) => Promise<Beneficiary | null>;
  updateBeneficiary: (
    beneficiaryId: string,
    beneficiaryData: UpdateBeneficiaryData
  ) => Promise<Beneficiary | null>;
  deleteBeneficiary: (beneficiaryId: string) => Promise<boolean>;
  refreshBeneficiaries: () => Promise<void>;
}
