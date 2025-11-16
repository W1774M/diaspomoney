/**
 * Types et interfaces pour les hooks personnalisés
 */

import { Complaint } from './complaints';
import { ISpeciality } from './index';
import { UINotification } from './notifications';
import {
  PaymentReceipt,
  UIAccountBalance,
  UIBillingAddress,
  UIPaymentMethod,
} from './payments';
import { PersonalStatistics } from './statistics';

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
