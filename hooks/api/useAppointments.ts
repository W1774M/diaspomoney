import { AppointmentListItem, UseAppointmentsReturn } from "@/types";
import { useEffect, useState } from "react";

export function useAppointments(): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/appointments");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des rendez-vous");
      }

      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
  };
}
