/**
 * Types et interfaces pour les réservations/bookings
 */

import { BaseEntity, PaymentData } from ".";

// === TYPES APPOINTMENT ===
export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface Appointment extends BaseEntity {
  userId: string;
  providerId: string;
  serviceId: string;
  date: Date;
  time: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  metadata?: Record<string, any>;
  timeslot?: string;
  selectedService?: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  requester?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  recipient?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  provider?: {
    id: string;
    name: string;
    specialty: string;
  };
}

export interface AppointmentData {
  id: string;
  providerId: string;
  serviceId: string;
  date: Date;
  time: string;
  duration: number;
  status: string;
  notes?: string;
  timeslot?: string;
  selectedService?: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  requester?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  recipient?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  provider?: {
    id: string;
    name: string;
    specialty: string;
  };
}

export type IAppointment = Appointment;


// Types pour les services
export interface BookingData {
  requesterId: string;
  providerId: string;
  serviceId: string;
  serviceType: 'HEALTH' | 'BTP' | 'EDUCATION';
  appointmentDate?: Date;
  timeslot?: string;
  consultationMode?: 'video' | 'cabinet';
  recipient?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  metadata?: Record<string, any>;
}

export interface BookingServiceFilters {
  userId?: string;
  providerId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

// Types UI pour les composants
export interface Booking {
  _id: string;
  userId: string;
  providerId: string;
  date: Date;
  status: string;
  paymentStatus: string;
  reservationNumber: string;
  price: number;
  totalAmount: number;
  requester: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  recipient: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialties: string[];
  };
  selectedService: {
    id: string;
    name: string;
    description: string;
    price: number;
  };
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface BookingFilters {
  searchTerm: string;
  status: string;
  paymentStatus: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalRevenue: number;
  averageAmount: number;
}

export interface BookingCardProps {
  booking: Booking;
  onView: (booking: Booking) => void;
  onEdit: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
}

export interface BookingFormProps {
  booking?: Booking;
  onSubmit: (data: BookingFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export interface BookingFormData {
  date: string;
  time: string;
  providerId: string;
  requesterId: string;
  totalAmount: number;
  notes?: string;
}

export interface BookingsHeaderProps {
  onNewBooking: () => void;
}

export interface BookingsSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export interface BookingsFiltersProps {
  filters: BookingFilters;
  onFilterChange: (
    key: keyof BookingFilters,
    value: string | { start: string; end: string }
  ) => void;
  availableStatuses: string[];
  availablePaymentStatuses: string[];
}

export interface BookingsTableProps {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  onView: (booking: Booking) => void;
  onEdit: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
}

export interface BookingsPageProps {
  // Props for the main page component
}

export interface BookingListItem {
  id: string;
  serviceName: string;
  providerName: string;
  date: Date;
  status: string;
  price: number;
  currency: string;
}

export interface UseBookingsReturn {
  bookings: BookingListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface IBooking extends BaseEntity {
  userId: string;
  providerId: string;
  serviceId: string;
  date: Date;
  time: string;
  status: string;
  price: number;
  reservationNumber: string;
}


// === TYPES BOOKING EXTENDED ===
export interface BookingExtended extends Omit<Booking, 'totalAmount'> {
  totalAmount?: number;
  requesterInfo?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  recipientInfo?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  selectedService?: {
    id: string | number;
    name: string;
    price: number;
    duration?: number;
    description?: string;
  };
  timeslot?: {
    start: string;
    end: string;
    date: string;
  };
  beneficiary?: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  reservationNumber?: string;
  status?: string;
}

/**
 * Type pour un document Booking tel qu'il est stocké dans MongoDB
 * Utilisé pour typer les documents retournés par Mongoose
 */
export interface BookingDocument extends BookingExtended {
  _id: any; // ObjectId de MongoDB
  userId?: string;
  [key: string]: any; // Propriétés dynamiques du document
}

export interface ModalPreviewPropsExtended {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentExtended;
  paymentData?: PaymentData;
  setSteps?: (steps: number) => void;
}

export interface AppointmentExtended extends AppointmentData {
  selectedService?: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  provider?: {
    id: string;
    name: string;
    specialty: string;
  };
}