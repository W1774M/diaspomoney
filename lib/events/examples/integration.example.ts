/**
 * Exemples d'intégration de l'EventBus dans les services existants
 * 
 * Ce fichier montre comment intégrer l'EventBus dans différents services
 */

import { authEvents, bookingEvents, paymentEvents, systemEvents } from '@/lib/events';
import { notificationService } from '@/services/notification/notification.service';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// ============================================================================
// EXEMPLE 1: Intégration dans AuthService
// ============================================================================

/**
 * Exemple d'intégration dans le service d'authentification
 */
export class AuthServiceExample {
  async login(email: string, _password: string) {
    // ... logique de connexion existante
    // Supposons qu'on obtient ces infos après la connexion :
    const userId = "id-résultat-auth"; // Remplacer par la vraie logique
    const ipAddress = "127.0.0.1"; // Remplacer par la vraie récupération IP

    // Après connexion réussie, émettre l'événement
    await authEvents.emitUserLoggedIn({
      userId: userId,
      email: email,
      timestamp: new Date(),
      ipAddress: ipAddress,
    });
  }

  async logout(userId: string) {
    // ... logique de déconnexion
    
    // Émettre l'événement
    await authEvents.emitUserLoggedOut(userId);
  }

  async register(userId: string, email: string) {
    // ... logique d'inscription
    
    // Émettre l'événement
    await authEvents.emitUserRegistered(userId, email);
  }
}

// ============================================================================
// EXEMPLE 2: Intégration dans PaymentService
// ============================================================================

/**
 * Exemple d'intégration dans le service de paiement
 */
export class PaymentServiceExample {
  async processPayment(amount: number, currency: string, userId: string, provider: string, paymentIntentId: string, timestamp: Date ) {
    // ... logique de paiement
    
    // Après paiement réussi
    await paymentEvents.emitPaymentCreated({
      paymentIntentId: paymentIntentId,
      amount: amount,
      currency: currency,
      userId: userId, 
      provider: provider,
      timestamp: timestamp,
    });
  }

  async refund(paymentIntentId: string, amount: number, _timestamp: Date, _currency: string, _userId: string, _provider: string ) {
    // ... logique de remboursement
    await paymentEvents.emitPaymentRefunded(paymentIntentId, amount);
  }
}

// ============================================================================
// EXEMPLE 3: Intégration dans un composant React
// ============================================================================

/**
 * Exemple d'utilisation dans un composant React
 * (utilise useEffect de React, showNotification de votre UI, etc.)
 */
export function useEventListeners() {
  useEffect(() => {
    // Écouter les événements de paiement
    const unsubscribePayment = paymentEvents.onPaymentSucceeded?.((data) => {
      // Afficher une notification
      if (typeof window !== "undefined" && window.alert) {
        window.alert(`Paiement de ${data.amount}${data.currency} réussi`);
      }
    });

    // Écouter les événements d'authentification
    const unsubscribeAuth = authEvents.onUserLoggedIn?.((data) => {
      // Mettre à jour le header (stub)
      // Envoyer à analytics
      if (typeof window !== "undefined" && (window as any).analytics) {
        (window as any).analytics.track('user_logged_in', {
          userId: data.userId,
          email: data.email,
        });
      }
    });

    // Nettoyer à la destruction du composant
    return () => {
      if (unsubscribePayment) unsubscribePayment();
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);
}

// ============================================================================
// EXEMPLE 4: Intégration pour le logging
// ============================================================================

/**
 * Exemple d'intégration pour le logging centralisé
 */
export function setupErrorLogging() {
  // Écouter toutes les erreurs système
  systemEvents.onError((data) => {
    // Logger l'erreur
    console.error('[ERROR]', data.error, data.context);

    // Sentry & monitoring : simulation si non défini
    if (typeof Sentry !== "undefined" && Sentry.captureException) {
      Sentry.captureException(data.error);
    }
  });
}

// ============================================================================
// EXEMPLE 5: Intégration pour les notifications
// ============================================================================

/**
 * Exemple d'intégration pour envoyer des notifications automatiques
 */
export function setupNotificationHandlers() {
  // Quand un paiement réussit, envoyer une notification
  paymentEvents.onPaymentSucceeded?.(async (data) => {
    if (typeof notificationService !== "undefined" && notificationService.sendNotification) {
      await notificationService.sendNotification({
        recipient: data.userId,
        type: 'PAYMENT_SUCCESS',
        template: 'payment_succeeded',
        data: {
          amount: data.amount,
          currency: data.currency,
          transactionId: data.transactionId,
        },
        channels: [{ type: 'EMAIL', enabled: true, priority: 'HIGH' }],
        locale: 'fr',
        priority: 'HIGH',
      });
    }
  });

  // Quand une réservation est créée, envoyer un rappel
  bookingEvents.onBookingCreated?.(async (data) => {
    // Envoyer une notification immédiate
    if (typeof notificationService !== "undefined" && notificationService.sendNotification) {
      await notificationService.sendNotification({
        recipient: data.requesterId,
        type: 'BOOKING_CREATED',
        template: 'booking_created',
        data: {
          bookingId: data.bookingId,
          appointmentDate: data.appointmentDate,
        },
        channels: [{ type: 'EMAIL', enabled: true, priority: 'HIGH' }],
        locale: 'fr',
        priority: 'HIGH',
      });
    }
  });
}

/**
 * Exemple d'intégration pour le tracking analytics
 */
export function setupAnalyticsTracking() { 
  // Tracker les connexions
  authEvents.onUserLoggedIn?.((data) => {
    if (typeof window !== "undefined" && (window as any).analytics) {
      (window as any).analytics.track('user_logged_in', {
        userId: data.userId,
        email: data.email,
        timestamp: data.timestamp,
        ipAddress: data.ipAddress,
      });
    }
  });

  // Tracker les paiements
  paymentEvents.onPaymentSucceeded?.((data) => {
    if (typeof window !== "undefined" && (window as any).analytics) {
      (window as any).analytics.track('payment_completed', {
        transactionId: data.transactionId,
        amount: data.amount,
        currency: data.currency,
        provider: data.provider,
        userId: data.userId,
      });
    }
  });

  // Tracker les réservations
  bookingEvents.onBookingCreated?.((data) => {
    if (typeof window !== "undefined" && (window as any).analytics) {
      (window as any).analytics.track('booking_created', {
        bookingId: data.bookingId,
        serviceId: data.serviceId,
        requesterId: data.requesterId,
        providerId: data.providerId,
      });
    }
  });
}

