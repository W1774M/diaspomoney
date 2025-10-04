import { useEffect, useState } from "react";

export interface Booking {
  _id: string;
  userId: string;
  providerId: string;
  date: Date;
  status: string;
  paymentStatus: string;
  reservationNumber: string;
  price: number;
  totalAmount: number;
  requester: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  recipient: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialties: string[];
  };
  selectedService: {
    id: string;
    name: string;
    description: string;
    price: number;
  };
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

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

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();

      if (options.userId) searchParams.append("userId", options.userId);
      if (options.providerId)
        searchParams.append("providerId", options.providerId);
      if (options.status) searchParams.append("status", options.status);
      if (options.limit) searchParams.append("limit", options.limit.toString());
      if (options.offset)
        searchParams.append("offset", options.offset.toString());

      const response = await fetch(`/api/bookings?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des réservations");
      }

      const data = await response.json();
      setBookings(data.bookings);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [
    options.userId,
    options.providerId,
    options.status,
    options.limit,
    options.offset,
  ]);

  return {
    bookings,
    loading,
    error,
    total,
    refetch: fetchBookings,
  };
};
