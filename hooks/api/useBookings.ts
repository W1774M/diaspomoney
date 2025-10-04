import { BookingListItem, UseBookingsReturn } from "@/types";
import { useEffect, useState } from "react";

export function useBookings(): UseBookingsReturn {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/bookings");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des réservations");
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
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
