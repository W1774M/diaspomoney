/**
 * Tests unitaires pour EventHelpers
 * 
 * Teste les helpers pour faciliter l'utilisation de l'EventBus
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  authEvents,
  paymentEvents,
  bookingEvents,
  notificationEvents,
  systemEvents,
  createEventHelpers,
} from '@/lib/events/EventHelpers';
import { eventBus } from '@/lib/events/EventBus';
import {
  AuthEvents,
  PaymentEvents,
  BookingEvents,
  NotificationEvents,
  SystemEvents,
} from '@/lib/events/EventTypes';

// Mock eventBus
vi.mock('@/lib/events/EventBus', () => {
  const mockUnsubscribe = vi.fn();
  const mockOn = vi.fn(() => mockUnsubscribe);
  const mockOnce = vi.fn(() => mockUnsubscribe);
  const mockEmit = vi.fn(() => Promise.resolve());
  const mockEmitSync = vi.fn();
  const mockOff = vi.fn();

  return {
    eventBus: {
      on: mockOn,
      once: mockOnce,
      emit: mockEmit,
      emitSync: mockEmitSync,
      off: mockOff,
    },
  };
});

describe('lib/events/EventHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authEvents', () => {
    it('devrait enregistrer un listener pour USER_LOGGED_IN', () => {
      const callback = vi.fn();
      const unsubscribe = authEvents.onUserLoggedIn(callback);

      expect(eventBus.on).toHaveBeenCalledWith(AuthEvents.USER_LOGGED_IN, callback);
      expect(unsubscribe).toBeDefined();
    });

    it('devrait enregistrer un listener pour USER_LOGGED_OUT', () => {
      const callback = vi.fn();
      authEvents.onUserLoggedOut(callback);

      expect(eventBus.on).toHaveBeenCalledWith(AuthEvents.USER_LOGGED_OUT, callback);
    });

    it('devrait enregistrer un listener pour USER_REGISTERED', () => {
      const callback = vi.fn();
      authEvents.onUserRegistered(callback);

      expect(eventBus.on).toHaveBeenCalledWith(AuthEvents.USER_REGISTERED, callback);
    });

    it('devrait émettre USER_LOGGED_IN', async () => {
      const data = {
        userId: 'user123',
        email: 'test@example.com',
        timestamp: new Date(),
      };

      await authEvents.emitUserLoggedIn(data);

      expect(eventBus.emit).toHaveBeenCalledWith(AuthEvents.USER_LOGGED_IN, data);
    });

    it('devrait émettre USER_LOGGED_OUT', async () => {
      await authEvents.emitUserLoggedOut('user123');

      expect(eventBus.emit).toHaveBeenCalledWith(AuthEvents.USER_LOGGED_OUT, {
        userId: 'user123',
      });
    });

    it('devrait émettre USER_REGISTERED', async () => {
      await authEvents.emitUserRegistered('user123', 'test@example.com');

      expect(eventBus.emit).toHaveBeenCalledWith(AuthEvents.USER_REGISTERED, {
        userId: 'user123',
        email: 'test@example.com',
      });
    });
  });

  describe('paymentEvents', () => {
    it('devrait enregistrer un listener pour PAYMENT_SUCCEEDED', () => {
      const callback = vi.fn();
      paymentEvents.onPaymentSucceeded(callback);

      expect(eventBus.on).toHaveBeenCalledWith(PaymentEvents.PAYMENT_SUCCEEDED, callback);
    });

    it('devrait enregistrer un listener pour PAYMENT_FAILED', () => {
      const callback = vi.fn();
      paymentEvents.onPaymentFailed(callback);

      expect(eventBus.on).toHaveBeenCalledWith(PaymentEvents.PAYMENT_FAILED, callback);
    });

    it('devrait enregistrer un listener pour PAYMENT_REFUNDED', () => {
      const callback = vi.fn();
      paymentEvents.onPaymentRefunded(callback);

      expect(eventBus.on).toHaveBeenCalledWith(PaymentEvents.PAYMENT_REFUNDED, callback);
    });

    it('devrait enregistrer un listener pour PAYMENT_CREATED', () => {
      const callback = vi.fn();
      paymentEvents.onPaymentCreated(callback);

      expect(eventBus.on).toHaveBeenCalledWith(PaymentEvents.PAYMENT_CREATED, callback);
    });

    it('devrait émettre PAYMENT_SUCCEEDED', async () => {
      const data = {
        transactionId: 'tx123',
        amount: 100,
        currency: 'EUR',
        userId: 'user123',
        provider: 'stripe',
        timestamp: new Date(),
      };

      await paymentEvents.emitPaymentSucceeded(data);

      expect(eventBus.emit).toHaveBeenCalledWith(PaymentEvents.PAYMENT_SUCCEEDED, data);
    });

    it('devrait émettre PAYMENT_FAILED', async () => {
      await paymentEvents.emitPaymentFailed('tx123', 'Insufficient funds');

      expect(eventBus.emit).toHaveBeenCalledWith(PaymentEvents.PAYMENT_FAILED, {
        transactionId: 'tx123',
        error: 'Insufficient funds',
      });
    });

    it('devrait émettre PAYMENT_REFUNDED', async () => {
      await paymentEvents.emitPaymentRefunded('tx123', 50);

      expect(eventBus.emit).toHaveBeenCalledWith(PaymentEvents.PAYMENT_REFUNDED, {
        transactionId: 'tx123',
        amount: 50,
      });
    });

    it('devrait émettre PAYMENT_CREATED', async () => {
      const data = {
        paymentIntentId: 'pi123',
        amount: 100,
        currency: 'EUR',
        userId: 'user123',
        provider: 'stripe',
        timestamp: new Date(),
      };

      await paymentEvents.emitPaymentCreated(data);

      expect(eventBus.emit).toHaveBeenCalledWith(PaymentEvents.PAYMENT_CREATED, data);
    });
  });

  describe('bookingEvents', () => {
    it('devrait enregistrer un listener pour BOOKING_CREATED', () => {
      const callback = vi.fn();
      bookingEvents.onBookingCreated(callback);

      expect(eventBus.on).toHaveBeenCalledWith(BookingEvents.BOOKING_CREATED, callback);
    });

    it('devrait enregistrer un listener pour BOOKING_CONFIRMED', () => {
      const callback = vi.fn();
      bookingEvents.onBookingConfirmed(callback);

      expect(eventBus.on).toHaveBeenCalledWith(BookingEvents.BOOKING_CONFIRMED, callback);
    });

    it('devrait enregistrer un listener pour BOOKING_CANCELLED', () => {
      const callback = vi.fn();
      bookingEvents.onBookingCancelled(callback);

      expect(eventBus.on).toHaveBeenCalledWith(BookingEvents.BOOKING_CANCELLED, callback);
    });

    it('devrait émettre BOOKING_CREATED', async () => {
      const data = {
        bookingId: 'booking123',
        requesterId: 'user1',
        providerId: 'user2',
        serviceId: 'service1',
        appointmentDate: new Date(),
        timestamp: new Date(),
      };

      await bookingEvents.emitBookingCreated(data);

      expect(eventBus.emit).toHaveBeenCalledWith(BookingEvents.BOOKING_CREATED, data);
    });

    it('devrait émettre BOOKING_CONFIRMED', async () => {
      await bookingEvents.emitBookingConfirmed('booking123');

      expect(eventBus.emit).toHaveBeenCalledWith(BookingEvents.BOOKING_CONFIRMED, {
        bookingId: 'booking123',
      });
    });

    it('devrait émettre BOOKING_CANCELLED avec raison', async () => {
      await bookingEvents.emitBookingCancelled('booking123', 'User cancelled');

      expect(eventBus.emit).toHaveBeenCalledWith(BookingEvents.BOOKING_CANCELLED, {
        bookingId: 'booking123',
        reason: 'User cancelled',
      });
    });

    it('devrait émettre BOOKING_CANCELLED sans raison', async () => {
      await bookingEvents.emitBookingCancelled('booking123');

      expect(eventBus.emit).toHaveBeenCalledWith(BookingEvents.BOOKING_CANCELLED, {
        bookingId: 'booking123',
      });
    });
  });

  describe('notificationEvents', () => {
    it('devrait enregistrer un listener pour NOTIFICATION_SENT', () => {
      const callback = vi.fn();
      notificationEvents.onNotificationSent(callback);

      expect(eventBus.on).toHaveBeenCalledWith(
        NotificationEvents.NOTIFICATION_SENT,
        callback,
      );
    });

    it('devrait émettre NOTIFICATION_SENT', async () => {
      const data = {
        notificationId: 'notif123',
        userId: 'user123',
        type: 'email',
        channel: 'EMAIL',
        timestamp: new Date(),
      };

      await notificationEvents.emitNotificationSent(data);

      expect(eventBus.emit).toHaveBeenCalledWith(NotificationEvents.NOTIFICATION_SENT, data);
    });
  });

  describe('systemEvents', () => {
    it('devrait enregistrer un listener pour ERROR_OCCURRED', () => {
      const callback = vi.fn();
      systemEvents.onError(callback);

      expect(eventBus.on).toHaveBeenCalledWith(SystemEvents.ERROR_OCCURRED, callback);
    });

    it('devrait émettre ERROR_OCCURRED avec contexte', async () => {
      const error = new Error('Test error');
      const context = { userId: 'user123', action: 'test' };

      await systemEvents.emitError(error, context);

      expect(eventBus.emit).toHaveBeenCalledWith(
        SystemEvents.ERROR_OCCURRED,
        expect.objectContaining({
          error,
          context,
          timestamp: expect.any(Date),
        }),
      );
    });

    it('devrait émettre ERROR_OCCURRED sans contexte', async () => {
      const error = new Error('Test error');

      await systemEvents.emitError(error);

      expect(eventBus.emit).toHaveBeenCalledWith(
        SystemEvents.ERROR_OCCURRED,
        expect.objectContaining({
          error,
          timestamp: expect.any(Date),
        }),
      );
    });
  });

  describe('createEventHelpers', () => {
    it('devrait créer des helpers personnalisés avec on', () => {
      const customEvents = {
        CUSTOM_EVENT_1: 'custom:event:1',
        CUSTOM_EVENT_2: 'custom:event:2',
      } as const;

      const helpers = createEventHelpers(customEvents);
      const callback = vi.fn();

      helpers.on(customEvents.CUSTOM_EVENT_1, callback);

      expect(eventBus.on).toHaveBeenCalledWith('custom:event:1', callback);
    });

    it('devrait créer des helpers personnalisés avec once', () => {
      const customEvents = {
        CUSTOM_EVENT: 'custom:event',
      } as const;

      const helpers = createEventHelpers(customEvents);
      const callback = vi.fn();

      helpers.once(customEvents.CUSTOM_EVENT, callback);

      expect(eventBus.once).toHaveBeenCalledWith('custom:event', callback);
    });

    it('devrait créer des helpers personnalisés avec emit', async () => {
      const customEvents = {
        CUSTOM_EVENT: 'custom:event',
      } as const;

      const helpers = createEventHelpers(customEvents);
      const data = { test: 'data' };

      await helpers.emit(customEvents.CUSTOM_EVENT, data);

      expect(eventBus.emit).toHaveBeenCalledWith('custom:event', data);
    });

    it('devrait créer des helpers personnalisés avec emitSync', () => {
      const customEvents = {
        CUSTOM_EVENT: 'custom:event',
      } as const;

      const helpers = createEventHelpers(customEvents);
      const data = { test: 'data' };

      helpers.emitSync(customEvents.CUSTOM_EVENT, data);

      expect(eventBus.emitSync).toHaveBeenCalledWith('custom:event', data);
    });

    it('devrait créer des helpers personnalisés avec off', () => {
      const customEvents = {
        CUSTOM_EVENT: 'custom:event',
      } as const;

      const helpers = createEventHelpers(customEvents);

      helpers.off(customEvents.CUSTOM_EVENT);

      expect(eventBus.off).toHaveBeenCalledWith('custom:event');
    });

    it('devrait permettre d\'utiliser emit sans données', async () => {
      const customEvents = {
        CUSTOM_EVENT: 'custom:event',
      } as const;

      const helpers = createEventHelpers(customEvents);

      await helpers.emit(customEvents.CUSTOM_EVENT);

      expect(eventBus.emit).toHaveBeenCalledWith('custom:event', undefined);
    });
  });
});
