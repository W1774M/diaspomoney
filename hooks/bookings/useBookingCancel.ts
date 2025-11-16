'use client';

/**
 * Custom Hook pour annuler une réservation
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services (évite les imports MongoDB côté client)
 */

import { UseBookingCancelReturn } from '@/types/hooks';
import { useCallback, useState } from 'react';

/**
 * Custom Hook pour gérer l'annulation d'une réservation
 * Implémente le Custom Hooks Pattern
 */
export function useBookingCancel(): UseBookingCancelReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelBooking = useCallback(async (bookingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Erreur lors de l'annulation de la réservation"
        );
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Erreur inconnue');
      }

      return result.booking;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      // Le logging est fait côté serveur via les services avec @Log decorator
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cancelBooking,
    loading,
    error,
  };
}
