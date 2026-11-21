'use client';

/**
 * Custom Hook pour supprimer complètement une réservation — thin API client via fetchJson.
 */

import { fetchJson } from '@/lib/api/fetchJson';
import { useCallback, useState } from 'react';

export interface UseBookingDeleteReturn {
  deleteBooking: (bookingId: string) => Promise<{
    success: boolean;
    deleted: {
      booking: boolean;
      transaction: boolean;
      invoice: boolean;
      stripePaymentIntent: boolean;
    };
  }>;
  isLoading: boolean;
  /** @deprecated alias isLoading */
  loading: boolean;
  error: string | null;
}

export function useBookingDelete(): UseBookingDeleteReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteBooking = useCallback(async (bookingId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchJson<{
        success?: boolean;
        deleted?: {
          booking: boolean;
          transaction: boolean;
          invoice: boolean;
          stripePaymentIntent: boolean;
        };
        error?: string;
      }>(`/api/bookings/${encodeURIComponent(bookingId)}/delete`, {
        method: 'DELETE',
      });

      if (!result.success) {
        throw new Error(result.error || 'Erreur inconnue');
      }

      return result as {
        success: boolean;
        deleted: {
          booking: boolean;
          transaction: boolean;
          invoice: boolean;
          stripePaymentIntent: boolean;
        };
      };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    deleteBooking,
    isLoading,
    loading: isLoading,
    error,
  };
}
