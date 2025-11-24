import { useEffect, useState, useCallback, useMemo } from "react";
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

// Utiliser BookingResponse du mapper comme type principal
export type Booking = BookingResponse;

export interface UseBookingsOptions {
  userId?: string | undefined;
  providerId?: string | undefined;
  status?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export const useBookings = (options: UseBookingsOptions = {}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Mémoriser les options pour éviter les re-renders inutiles
  // Utiliser JSON.stringify pour comparer les valeurs plutôt que la référence de l'objet
  const optionsString = JSON.stringify(options);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedOptions = useMemo(() => options, [optionsString]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();

      if (memoizedOptions.userId) searchParams.append("userId", memoizedOptions.userId);
      if (memoizedOptions.providerId)
        searchParams.append("providerId", memoizedOptions.providerId);
      if (memoizedOptions.status) searchParams.append("status", memoizedOptions.status);
      if (memoizedOptions.limit) searchParams.append("limit", memoizedOptions.limit.toString());
      if (memoizedOptions.offset)
        searchParams.append("offset", memoizedOptions.offset.toString());

      const response = await fetch(`/api/bookings?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des réservations");
      }

      const data = await response.json();
      
      // Le nouveau format standardisé utilise data directement pour les listes
      if (data.success) {
        setBookings(Array.isArray(data.data) ? data.data : []);
        setTotal(data.pagination?.total || 0);
      } else {
        throw new Error(data.error || 'Erreur lors de la récupération des réservations');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur inconnue");
      setBookings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [memoizedOptions]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    error,
    total,
    refetch: fetchBookings,
  };
};
