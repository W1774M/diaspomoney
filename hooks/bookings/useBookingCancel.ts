'use client';

/**
 * Custom Hook pour annuler une réservation — thin API client via fetchJson.
 */

import { fetchJson } from '@/lib/api/fetchJson';
import type { UseBookingCancelReturn } from '@/lib/types';
import { useCallback, useState } from 'react';

export function useBookingCancel(): UseBookingCancelReturn & {
  isLoading: boolean;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelBooking = useCallback(async (bookingId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchJson<{
        success?: boolean;
        booking?: unknown;
        error?: string;
      }>(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (!result.success) {
        throw new Error(result.error || 'Erreur inconnue');
      }

      return result.booking;
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
    cancelBooking,
    isLoading,
    loading: isLoading,
    error,
  };
}
