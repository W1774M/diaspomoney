/**
 * Listeners pour l'analytics
 * Track les événements pour l'analyse des données
 */

import { authEvents, BookingCreatedEvent, bookingEvents, paymentEvents, PaymentSucceededEvent, UserLoggedInEvent } from '@/lib/events';
import { logger } from '@/lib/logger';

/**
 * Service d'analytics (mock - à remplacer par votre service réel)
 */
class AnalyticsService {
  track(event: string, properties: Record<string, any>) {
    // Implémentation réelle avec Google Analytics, Mixpanel, etc.
    logger.debug({ event, properties }, '[Analytics] Track');
    
    // Exemple avec Google Analytics (si disponible)
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('event', event, properties);
    // }
  }

  identify(userId: string, traits: Record<string, any>) {
    logger.debug({ userId, traits }, '[Analytics] Identify');
  }
}

const analytics = new AnalyticsService();

/**
 * Initialiser tous les listeners d'analytics
 */
export function setupAnalyticsEventListeners() {
  // Tracker les connexions
  authEvents.onUserLoggedIn((data: UserLoggedInEvent) => {
    analytics.track('user_logged_in', {
      userId: data.userId,
      email: data.email,
      timestamp: data.timestamp.toISOString(),
      ipAddress: data.ipAddress,
    });
  });

  // Tracker les inscriptions
  authEvents.onUserRegistered((data) => {
    analytics.track('user_registered', {
      userId: data.userId,
      email: data.email,
      timestamp: new Date().toISOString(),
    });

    // Identifier l'utilisateur
    analytics.identify(data.userId, {
      email: data.email,
    });
  });

  // Tracker les déconnexions
  authEvents.onUserLoggedOut((data) => {
    analytics.track('user_logged_out', {
      userId: data.userId,
      timestamp: new Date().toISOString(),
    });
  });

  // Tracker les paiements réussis
  paymentEvents.onPaymentSucceeded((data: PaymentSucceededEvent) => {
    analytics.track('payment_completed', {
      transactionId: data.transactionId,
      amount: data.amount,
      currency: data.currency,
      provider: data.provider,
      userId: data.userId,
      timestamp: data.timestamp.toISOString(),
    });
  });

  // Tracker les paiements échoués
  paymentEvents.onPaymentFailed((data) => {
    analytics.track('payment_failed', {
      transactionId: data.transactionId,
      error: data.error,
      timestamp: new Date().toISOString(),
    });
  });

  // Tracker les remboursements
  paymentEvents.onPaymentRefunded((data) => {
    analytics.track('payment_refunded', {
      transactionId: data.transactionId,
      amount: data.amount,
      timestamp: new Date().toISOString(),
    });
  });

  // Tracker les réservations créées
  bookingEvents.onBookingCreated((data: BookingCreatedEvent) => {
    analytics.track('booking_created', {
      bookingId: data.bookingId,
      serviceId: data.serviceId,
      requesterId: data.requesterId,
      providerId: data.providerId,
      appointmentDate: data.appointmentDate.toISOString(),
      timestamp: data.timestamp.toISOString(),
    });
  });

  // Tracker les réservations confirmées
  bookingEvents.onBookingConfirmed((data) => {
    analytics.track('booking_confirmed', {
      bookingId: data.bookingId,
      timestamp: new Date().toISOString(),
    });
  });

  // Tracker les réservations annulées
  bookingEvents.onBookingCancelled((data) => {
    analytics.track('booking_cancelled', {
      bookingId: data.bookingId,
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });
  });
}

