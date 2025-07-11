import { AppointmentListItem, UseAppointmentsReturn } from "@/lib/definitions";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

// Cache mémoire simple (clé = user email)
const appointmentsCache: Record<string, AppointmentListItem[]> = {};

export function useAppointments(): UseAppointmentsReturn {
  const { data: session, status } = useSession();
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    if (status !== "authenticated" || !session?.user?.email) {
      return;
    }
    setLoading(true);
    setError(null);
    const cacheKey = session.user.email;
    if (appointmentsCache[cacheKey]) {
      setAppointments(appointmentsCache[cacheKey]);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/appointments");
      const data = await response.json();
      if (response.ok) {
        setAppointments(data.appointments);
        appointmentsCache[cacheKey] = data.appointments;
      } else {
        setError(
          data.error || "Erreur lors de la récupération des rendez-vous"
        );
      }
    } catch (err) {
      setError("Erreur réseau lors de la récupération des rendez-vous");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email, status]);

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
  };
}
