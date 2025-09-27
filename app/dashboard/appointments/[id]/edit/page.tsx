"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditAppointmentPage({
  params,
}: {
  params: { id: string };
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated) {
      // Récupérer l'appointment depuis l'API
      const fetchAppointment = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/appointments/${params.id}`);
          
          if (response.ok) {
            const data = await response.json();
            setAppointment(data.appointment);
          } else {
            console.error("Erreur lors de la récupération du rendez-vous");
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du rendez-vous:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchAppointment();
    }
  }, [params["id"], isAuthenticated, isLoading, router]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Rendez-vous non trouvé
          </h2>
          <p className="text-gray-600">
            Le rendez-vous que vous recherchez n'existe pas.
          </p>
          <button
            onClick={() => router.push("/dashboard/appointments")}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retour aux rendez-vous
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() =>
              params["id"] && router.push(`/dashboard/appointments/${params["id"]}`)
            }
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Retour au rendez-vous
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Modifier le rendez-vous #{appointment.reservationNumber}
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="cancelled">Annulé</option>
                <option value="completed">Terminé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Ajouter des notes..."
              ></textarea>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() =>
                  params["id"] && router.push(`/dashboard/appointments/${params["id"]}`)
                }
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  alert("Modifications sauvegardées");
                  params["id"] && router.push(`/dashboard/appointments/${params["id"]}`);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
