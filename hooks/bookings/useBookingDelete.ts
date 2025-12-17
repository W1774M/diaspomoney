'use client';

/**
 * Custom Hook pour supprimer complètement une réservation
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services (évite les imports MongoDB côté client)
 */

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
  loading: boolean;
  error: string | null;
}

/**
 * Custom Hook pour gérer la suppression complète d'une réservation
 * Implémente le Custom Hooks Pattern
 */
export function useBookingDelete(): UseBookingDeleteReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteBooking = useCallback(async (bookingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 'Erreur lors de la suppression complète de la réservation',
        );
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Erreur inconnue');
      }

      return result;
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
    deleteBooking,
    loading,
    error,
  };
}

