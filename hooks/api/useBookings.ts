import { BookingListItem, UseBookingsReturn } from '@/lib/types';
import { useEffect, useState } from 'react';

export function useBookings(): UseBookingsReturn {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/bookings');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des réservations');
      }

      const data = await response.json();
      // Le nouveau format standardisé utilise data directement pour les listes
      if (data.success) {
        setBookings(Array.isArray(data.data) ? data.data : []);
      } else {
        throw new Error(data.error || 'Erreur lors de la récupération des réservations');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
  };
}
