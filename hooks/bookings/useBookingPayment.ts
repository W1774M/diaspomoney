'use client';

/**
 * Confirmation paiement réservation — thin API client.
 * Source de vérité events : serveur (ConfirmBookingPayment).
 */

import { fetchJson } from '@/lib/api/fetchJson';
import { logger } from '@/lib/logger';
import { useCallback, useState } from 'react';
import type { PaymentData, AppointmentData } from '@/lib/types';

export interface BookingPaymentResult {
  success: boolean;
  reservationNumber?: string;
  error?: string;
}

export interface UseBookingPaymentReturn {
  isLoading: boolean;
  /** @deprecated alias isLoading */
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

export function useBookingPayment(): UseBookingPaymentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmPayment = useCallback(
    async (
      appointment: AppointmentData,
      paymentData: PaymentData,
    ): Promise<BookingPaymentResult> => {
      try {
        setIsLoading(true);
        setError(null);

        if (!paymentData.paymentIntentId && !paymentData.checkoutSessionId) {
          throw new Error(
            'Identifiant Stripe manquant (paymentIntentId ou checkoutSessionId)',
          );
        }

        const result = await fetchJson<{
          reservationNumber?: string;
          paymentIntentId?: string;
        }>('/api/bookings/confirm-payment', {
          method: 'POST',
          body: JSON.stringify({ appointment, paymentData }),
        });

        logger.info(
          {
            bookingId: appointment.id || (appointment as { _id?: string })._id,
            reservationNumber: result.reservationNumber,
            paymentIntentId:
              result.paymentIntentId || paymentData.paymentIntentId,
          },
          'Payment confirmed via useBookingPayment',
        );

        return {
          success: true,
          ...(result.reservationNumber
            ? { reservationNumber: result.reservationNumber }
            : {}),
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        logger.error(
          { error: err, bookingId: appointment.id },
          'Error confirming payment via useBookingPayment',
        );
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const sendPaymentError = useCallback(
    async (
      appointment: AppointmentData,
      paymentData: PaymentData,
      errorMessage: string,
    ): Promise<boolean> => {
      try {
        setError(null);
        await fetchJson('/api/bookings/payment-error', {
          method: 'POST',
          body: JSON.stringify({ appointment, paymentData, errorMessage }),
        });
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(msg);
        return false;
      }
    },
    [],
  );

  return {
    isLoading,
    confirming: isLoading,
    error,
    confirmPayment,
    sendPaymentError,
  };
}
