/**
 * Helpers pour faciliter l'utilisation de l'EventBus
 */

import { eventBus, EventCallback, EventUnsubscribe } from './EventBus';
import {
  AuthEvents,
  BookingCreatedEvent,
  BookingEvents,
  ErrorOccurredEvent,
  NotificationEvents,
  NotificationSentEvent,
  PaymentEvents,
  PaymentSucceededEvent,
  SystemEvents,
  UserLoggedInEvent,
} from './EventTypes';

/**
 * Helpers pour les événements d'authentification
 */
export const authEvents = {
  onUserLoggedIn: (callback: EventCallback<UserLoggedInEvent>): EventUnsubscribe =>
    eventBus.on(AuthEvents.USER_LOGGED_IN, callback),

  onUserLoggedOut: (callback: EventCallback<{ userId: string }>): EventUnsubscribe =>
    eventBus.on(AuthEvents.USER_LOGGED_OUT, callback),

  onUserRegistered: (callback: EventCallback<{ userId: string; email: string }>): EventUnsubscribe =>
    eventBus.on(AuthEvents.USER_REGISTERED, callback),

  emitUserLoggedIn: (data: UserLoggedInEvent): Promise<void> =>
    eventBus.emit(AuthEvents.USER_LOGGED_IN, data),

  emitUserLoggedOut: (userId: string): Promise<void> =>
    eventBus.emit(AuthEvents.USER_LOGGED_OUT, { userId }),

  emitUserRegistered: (userId: string, email: string): Promise<void> =>
    eventBus.emit(AuthEvents.USER_REGISTERED, { userId, email }),
};

/**
 * Helpers pour les événements de paiement
 */
export const paymentEvents = {
  onPaymentSucceeded: (callback: EventCallback<PaymentSucceededEvent>): EventUnsubscribe =>
    eventBus.on(PaymentEvents.PAYMENT_SUCCEEDED, callback),

  onPaymentFailed: (callback: EventCallback<{ transactionId: string; error: string }>): EventUnsubscribe =>
    eventBus.on(PaymentEvents.PAYMENT_FAILED, callback),

  onPaymentRefunded: (callback: EventCallback<{ transactionId: string; amount: number }>): EventUnsubscribe =>
    eventBus.on(PaymentEvents.PAYMENT_REFUNDED, callback),

  emitPaymentSucceeded: (data: PaymentSucceededEvent): Promise<void> =>
    eventBus.emit(PaymentEvents.PAYMENT_SUCCEEDED, data),

  emitPaymentFailed: (transactionId: string, error: string): Promise<void> =>
    eventBus.emit(PaymentEvents.PAYMENT_FAILED, { transactionId, error }),

  emitPaymentRefunded: (transactionId: string, amount: number): Promise<void> =>
    eventBus.emit(PaymentEvents.PAYMENT_REFUNDED, { transactionId, amount }),

  onPaymentCreated: (callback: EventCallback<{ paymentIntentId: string; amount: number; currency: string; userId: string; provider: string; timestamp: Date }>): EventUnsubscribe =>
    eventBus.on(PaymentEvents.PAYMENT_CREATED, callback),

  emitPaymentCreated: (data: { paymentIntentId: string; amount: number; currency: string; userId: string; provider: string; timestamp: Date }): Promise<void> =>
    eventBus.emit(PaymentEvents.PAYMENT_CREATED, data),
};

/**
 * Helpers pour les événements de réservation
 */
export const bookingEvents = {
  onBookingCreated: (callback: EventCallback<BookingCreatedEvent>): EventUnsubscribe =>
    eventBus.on(BookingEvents.BOOKING_CREATED, callback),

  onBookingConfirmed: (callback: EventCallback<{ bookingId: string }>): EventUnsubscribe =>
    eventBus.on(BookingEvents.BOOKING_CONFIRMED, callback),

  onBookingCancelled: (callback: EventCallback<{ bookingId: string; reason?: string }>): EventUnsubscribe =>
    eventBus.on(BookingEvents.BOOKING_CANCELLED, callback),

  emitBookingCreated: (data: BookingCreatedEvent): Promise<void> =>
    eventBus.emit(BookingEvents.BOOKING_CREATED, data),

  emitBookingConfirmed: (bookingId: string): Promise<void> =>
    eventBus.emit(BookingEvents.BOOKING_CONFIRMED, { bookingId }),

  emitBookingCancelled: (bookingId: string, reason?: string): Promise<void> =>
    eventBus.emit(BookingEvents.BOOKING_CANCELLED, { bookingId, reason }),
};

/**
 * Helpers pour les événements de notification
 */
export const notificationEvents = {
  onNotificationSent: (callback: EventCallback<NotificationSentEvent>): EventUnsubscribe =>
    eventBus.on(NotificationEvents.NOTIFICATION_SENT, callback),

  emitNotificationSent: (data: NotificationSentEvent): Promise<void> =>
    eventBus.emit(NotificationEvents.NOTIFICATION_SENT, data),
};

/**
 * Helpers pour les événements système
 */
export const systemEvents = {
  onError: (callback: EventCallback<ErrorOccurredEvent>): EventUnsubscribe =>
    eventBus.on(SystemEvents.ERROR_OCCURRED, callback),

  emitError: (error: Error, context?: Record<string, any>): Promise<void> =>
    eventBus.emit(SystemEvents.ERROR_OCCURRED, { error, context, timestamp: new Date() }),
};

/**
 * Helper générique pour créer des helpers personnalisés
 */
export function createEventHelpers<T extends Record<string, string>>(
  _events: T,
): {
  on: <D = any>(event: T[keyof T], callback: EventCallback<D>) => EventUnsubscribe;
  once: <D = any>(event: T[keyof T], callback: EventCallback<D>) => EventUnsubscribe;
  emit: <D = any>(event: T[keyof T], data?: D) => Promise<void>;
  emitSync: <D = any>(event: T[keyof T], data?: D) => void;
  off: (event: T[keyof T]) => void;
} {
  return {
    on: <D = any>(event: T[keyof T], callback: EventCallback<D>) =>
      eventBus.on(event as string, callback),
    once: <D = any>(event: T[keyof T], callback: EventCallback<D>) =>
      eventBus.once(event as string, callback),
    emit: <D = any>(event: T[keyof T], data?: D) =>
      eventBus.emit(event as string, data),
    emitSync: <D = any>(event: T[keyof T], data?: D) =>
      eventBus.emitSync(event as string, data),
    off: (event: T[keyof T]) => eventBus.off(event as string),
  };
}

