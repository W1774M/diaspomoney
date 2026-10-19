'use client';

/**
 * Custom Hook pour la confirmation de paiement de réservation
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes qui utilisent BookingFacade et PaymentFacade
 * Utilise EventObserver (EventBus) pour émettre des événements
 */

import { logger } from '@/lib/logger';
import { useCallback, useState } from 'react';
import type { PaymentData, AppointmentData } from '@/lib/types';

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
 * Custom Hook pour gérer la confirmation de paiement de réservation
 * Utilise les facades via les API routes
 */
export function useBookingPayment(): UseBookingPaymentReturn {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Confirmer le paiement d'une réservation
   * Utilise l'API route qui utilise BookingFacade et PaymentFacade
   */
  const confirmPayment = useCallback(
    async (
      appointment: AppointmentData,
      paymentData: PaymentData,
    ): Promise<BookingPaymentResult> => {
      try {
        setConfirming(true);
        setError(null);

        if (!paymentData.paymentIntentId && !paymentData.checkoutSessionId) {
          throw new Error(
            'Identifiant Stripe manquant (paymentIntentId ou checkoutSessionId)',
          );
        }

        const response = await fetch('/api/bookings/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointment,
            paymentData,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Erreur lors de la confirmation du paiement',
          );
        }

        const result = await response.json();

        // Source de vérité : events domaine émis côté serveur (ConfirmBookingPayment)
        logger.info(
          {
            appointmentId: appointment.id || (appointment as any)._id,
            reservationNumber: result.reservationNumber,
            paymentIntentId:
              result.paymentIntentId || paymentData.paymentIntentId,
            amount: paymentData.amount,
          },
          'Payment confirmed successfully via useBookingPayment (Stripe-verified)',
        );

        return {
          success: true,
          reservationNumber: result.reservationNumber,
        };
      } catch (error) {
        logger.error(
          {
            error,
            appointmentId: appointment.id || (appointment as any)._id,
            paymentData: {
              amount: paymentData.amount,
              currency: paymentData.currency,
            },
          },
          'Error confirming payment via useBookingPayment',
        );

        const errorMessage =
          error instanceof Error ? error.message : 'Erreur inconnue';
        setError(errorMessage);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setConfirming(false);
      }
    },
    [],
  );

  /**
   * Envoyer un email d'erreur de paiement
   * Utilise l'API route qui utilise EmailService
   */
  const sendPaymentError = useCallback(
    async (
      appointment: AppointmentData,
      paymentData: PaymentData,
      errorMessage: string,
    ): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch('/api/bookings/payment-error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointment,
            paymentData,
            errorMessage,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Erreur lors de l'envoi de l'email d'erreur",
          );
        }

        logger.info(
          { appointmentId: appointment.id || (appointment as any)._id },
          'Payment error email sent successfully via useBookingPayment',
        );

        return true;
      } catch (error) {
        logger.error(
          { error, appointmentId: appointment.id || (appointment as any)._id },
          'Error sending payment error email via useBookingPayment',
        );

        const errorMessage =
          error instanceof Error ? error.message : 'Erreur inconnue';
        setError(errorMessage);

        return false;
      }
    },
    [],
  );

  return {
    confirming,
    error,
    confirmPayment,
    sendPaymentError,
  };
}

