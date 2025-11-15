/**
 * Types d'événements pour le système EventBus
 * Définit les événements standards de l'application
 */

/**
 * Événements d'authentification
 */
export enum AuthEvents {
  USER_LOGGED_IN = 'auth:user:logged-in',
  USER_LOGGED_OUT = 'auth:user:logged-out',
  USER_REGISTERED = 'auth:user:registered',
  USER_EMAIL_VERIFIED = 'auth:user:email-verified',
  PASSWORD_RESET_REQUESTED = 'auth:password:reset-requested',
  PASSWORD_RESET_COMPLETED = 'auth:password:reset-completed',
  SESSION_EXPIRED = 'auth:session:expired',
  ACCOUNT_SUSPENDED = 'auth:account:suspended',
}

/**
 * Événements de paiement
 */
export enum PaymentEvents {
  PAYMENT_CREATED = 'payment:created',
  PAYMENT_PENDING = 'payment:pending',
  PAYMENT_SUCCEEDED = 'payment:succeeded',
  PAYMENT_FAILED = 'payment:failed',
  PAYMENT_REFUNDED = 'payment:refunded',
  PAYMENT_CANCELLED = 'payment:cancelled',
}

/**
 * Événements de transaction
 */
export enum TransactionEvents {
  TRANSACTION_CREATED = 'transaction:created',
  TRANSACTION_COMPLETED = 'transaction:completed',
  TRANSACTION_FAILED = 'transaction:failed',
  TRANSACTION_REFUNDED = 'transaction:refunded',
}

/**
 * Événements de réservation
 */
export enum BookingEvents {
  BOOKING_CREATED = 'booking:created',
  BOOKING_CONFIRMED = 'booking:confirmed',
  BOOKING_CANCELLED = 'booking:cancelled',
  BOOKING_COMPLETED = 'booking:completed',
  BOOKING_REMINDER = 'booking:reminder',
}

/**
 * Événements de notification
 */
export enum NotificationEvents {
  NOTIFICATION_SENT = 'notification:sent',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_DELETED = 'notification:deleted',
}

/**
 * Événements utilisateur
 */
export enum UserEvents {
  USER_CREATED = 'user:created',
  USER_UPDATED = 'user:updated',
  USER_DELETED = 'user:deleted',
  PROFILE_UPDATED = 'user:profile:updated',
  KYC_SUBMITTED = 'user:kyc:submitted',
  KYC_APPROVED = 'user:kyc:approved',
  KYC_REJECTED = 'user:kyc:rejected',
}

/**
 * Événements de service
 */
export enum ServiceEvents {
  SERVICE_CREATED = 'service:created',
  SERVICE_UPDATED = 'service:updated',
  SERVICE_DELETED = 'service:deleted',
  SERVICE_PUBLISHED = 'service:published',
}

/**
 * Événements système
 */
export enum SystemEvents {
  ERROR_OCCURRED = 'system:error:occurred',
  WARNING_OCCURRED = 'system:warning:occurred',
  CONFIGURATION_CHANGED = 'system:configuration:changed',
}

/**
 * Types de données pour les événements
 */
export interface UserLoggedInEvent {
  userId: string;
  email: string;
  timestamp: Date;
  ipAddress?: string;
}

export interface PaymentSucceededEvent {
  transactionId: string;
  amount: number;
  currency: string;
  userId: string;
  provider: string;
  timestamp: Date;
}

export interface BookingCreatedEvent {
  bookingId: string;
  requesterId: string;
  providerId: string;
  serviceId: string;
  appointmentDate: Date;
  timestamp: Date;
}

export interface NotificationSentEvent {
  notificationId: string;
  userId: string;
  type: string;
  channel: string;
  timestamp: Date;
}

export interface ErrorOccurredEvent {
  error: Error;
  context?: Record<string, any>;
  timestamp: Date;
}

