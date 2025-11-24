'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';
import * as Sentry from '@sentry/nextjs';

export interface UseBookingOptions {
  bookingId: string | undefined;
}

export interface UseBookingReturn {
  booking: BookingResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateStatus: (status: string) => Promise<boolean>;
  isUpdating: boolean;
}

/**
 * Custom Hook pour récupérer un booking par ID
 * Implémente le Custom Hooks Pattern avec gestion d'erreurs standardisée
 */
export function useBooking(bookingId: string | undefined): UseBookingReturn {
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Mémoriser l'ID pour éviter les re-renders inutiles
  const memoizedBookingId = useMemo(() => bookingId, [bookingId]);

  const fetchBooking = useCallback(async () => {
    if (!memoizedBookingId) {
      setBooking(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/bookings/${encodeURIComponent(memoizedBookingId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          response.status === 404
            ? errorData.error || 'Réservation non trouvée'
            : errorData.error || 'Erreur lors de la récupération de la réservation';

        setError(errorMessage);
        setBooking(null);

        // Capturer les erreurs critiques avec Sentry
        if (response.status >= 500) {
          Sentry.captureException(new Error(errorMessage), {
            tags: {
              component: 'useBooking',
              action: 'fetchBooking',
              status: response.status,
            },
            extra: { bookingId: memoizedBookingId, errorData },
          });
        }

        return;
      }

      const data = await response.json();

      if (!data.success || !data.booking) {
        setError('Données invalides reçues du serveur');
        setBooking(null);
        return;
      }

      setBooking(data.booking);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      setBooking(null);

      Sentry.captureException(err, {
        tags: {
          component: 'useBooking',
          action: 'fetchBooking',
        },
        extra: { bookingId: memoizedBookingId },
      });
    } finally {
      setLoading(false);
    }
  }, [memoizedBookingId]);

  const updateStatus = useCallback(
    async (status: string): Promise<boolean> => {
      if (!memoizedBookingId || !booking || status === booking.status) {
        return false;
      }

      try {
        setIsUpdating(true);
        setError(null);

        const response = await fetch(`/api/bookings/${encodeURIComponent(memoizedBookingId)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (_parseError) {
            await response.text(); // Lire le texte pour éviter les warnings
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
          }
          throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.booking) {
          setBooking(data.booking);
          return true;
        } else {
          throw new Error(data.error || 'Erreur lors de la mise à jour du statut');
        }
      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);

        // Rafraîchir les données en cas d'erreur
        await fetchBooking();

        Sentry.captureException(err, {
          tags: {
            component: 'useBooking',
            action: 'updateStatus',
          },
          extra: { bookingId: memoizedBookingId, status },
        });

        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [memoizedBookingId, booking, fetchBooking],
  );

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  return {
    booking,
    loading,
    error,
    refetch: fetchBooking,
    updateStatus,
    isUpdating,
  };
}

