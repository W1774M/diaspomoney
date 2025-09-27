import { useState, useEffect } from "react";

export interface Appointment {
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

export interface UseAppointmentsOptions {
  userId?: string | undefined;
  providerId?: string | undefined;
  status?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export const useAppointments = (options: UseAppointmentsOptions = {}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      
      if (options.userId) searchParams.append("userId", options.userId);
      if (options.providerId) searchParams.append("providerId", options.providerId);
      if (options.status) searchParams.append("status", options.status);
      if (options.limit) searchParams.append("limit", options.limit.toString());
      if (options.offset) searchParams.append("offset", options.offset.toString());

      const response = await fetch(`/api/appointments?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des rendez-vous");
      }

      const data = await response.json();
      setAppointments(data.appointments);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [options.userId, options.providerId, options.status, options.limit, options.offset]);

  return {
    appointments,
    loading,
    error,
    total,
    refetch: fetchAppointments
  };
};
