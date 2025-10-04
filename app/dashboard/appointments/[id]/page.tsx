"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppointmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Authentication is handled by the layout, no need to check here

  useEffect(() => {
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
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
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
            onClick={() => router.push("/dashboard/appointments")}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Retour aux rendez-vous
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Rendez-vous #{appointment.reservationNumber}
            </h1>
            <div className="flex items-center space-x-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  appointment.status === "confirmed"
                    ? "bg-green-100 text-green-800"
                    : appointment.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : appointment.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {appointment.status === "confirmed"
                  ? "Confirmé"
                  : appointment.status === "pending"
                    ? "En attente"
                    : appointment.status === "cancelled"
                      ? "Annulé"
                      : "Terminé"}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  appointment.paymentStatus === "paid"
                    ? "bg-green-100 text-green-800"
                    : appointment.paymentStatus === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : appointment.paymentStatus === "failed"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {appointment.paymentStatus === "paid"
                  ? "Payé"
                  : appointment.paymentStatus === "pending"
                    ? "En attente"
                    : appointment.paymentStatus === "failed"
                      ? "Échoué"
                      : "Remboursé"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations du prestataire */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Prestataire
              </h2>
              <div className="space-y-2">
                <p>
                  <strong>Nom:</strong> {appointment.provider?.name}
                </p>
                <p>
                  <strong>Spécialité:</strong> {appointment.provider?.specialty}
                </p>
                <p>
                  <strong>Service:</strong> {appointment.selectedService?.name}
                </p>
                <p>
                  <strong>Prix:</strong> {appointment.selectedService?.price} €
                </p>
              </div>
            </div>

            {/* Informations du rendez-vous */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Détails du rendez-vous
              </h2>
              <div className="space-y-2">
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(appointment.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Heure:</strong> {appointment.time}
                </p>
                <p>
                  <strong>Montant total:</strong> {appointment.totalAmount} €
                </p>
                <p>
                  <strong>Créé le:</strong>{" "}
                  {new Date(appointment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Informations du demandeur */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Informations du demandeur
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>Nom:</strong> {appointment.requester?.firstName}{" "}
                  {appointment.requester?.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {appointment.requester?.email}
                </p>
              </div>
              <div>
                <p>
                  <strong>Téléphone:</strong> {appointment.requester?.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Informations du destinataire */}
          {appointment.recipient && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Informations du destinataire
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>Nom:</strong> {appointment.recipient?.firstName}{" "}
                    {appointment.recipient?.lastName}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Téléphone:</strong> {appointment.recipient?.phone}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Notes
              </h2>
              <p className="text-gray-700">{appointment.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() =>
                router.push(`/dashboard/appointments/${params.id}/edit`)
              }
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Modifier
            </button>
            <button
              onClick={() => {
                if (
                  confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")
                ) {
                  // Ici vous pourriez appeler une API pour annuler le rendez-vous
                  alert("Rendez-vous annulé");
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
