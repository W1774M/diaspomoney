"use client";
import { useAppointment } from "@/components/features/providers";
import DefaultTemplate from "@/template/DefaultTemplate";
import { CheckCircle, Clock, Mail, Phone, User } from "lucide-react";
import { useMemo } from "react";

export default function AppointmentRecapPage() {
  const { data: appointment } = useAppointment();

  const formattedDate = useMemo(() => {
    if (!appointment?.timeslot) return "";
    return new Date(appointment.timeslot).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [appointment?.timeslot]);

  if (!appointment) {
    return (
      <DefaultTemplate>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Aucune réservation en cours
            </h1>
            <p className="text-gray-600">
              Vous n&apos;avez pas de réservation active à afficher.
            </p>
          </div>
        </div>
      </DefaultTemplate>
    );
  }

  return (
    <DefaultTemplate>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Récapitulatif de votre réservation
            </h1>
            <p className="text-gray-600">
              Détails de votre réservation confirmée
            </p>
          </div>

          {/* Statut de la réservation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Réservation confirmée
                </h2>
                <p className="text-green-600 font-medium">
                  Votre réservation a été confirmée avec succès
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Détails du service */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Détails du service
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Service :</span>
                  <span className="font-semibold text-gray-900">
                    {appointment.selectedService?.name}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Prix :</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {appointment.selectedService?.price} €
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Prestataire :</span>
                  <span className="font-semibold text-gray-900">
                    {appointment.provider.name}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Spécialité :</span>
                  <span className="text-gray-900">
                    {appointment.provider.specialty}
                  </span>
                </div>
              </div>
            </div>

            {/* Informations de rendez-vous */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Rendez-vous
              </h3>

              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold text-orange-800">
                      Date et heure
                    </span>
                  </div>
                  <p className="text-orange-700 font-medium">{formattedDate}</p>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Statut :</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Confirmé
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Paiement :</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Payé
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Informations des personnes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Demandeur */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Demandeur
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {appointment.requester.firstName}{" "}
                      {appointment.requester.lastName}
                    </p>
                    <p className="text-sm text-gray-600">Demandeur principal</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{appointment.requester.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{appointment.requester.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bénéficiaire */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Bénéficiaire
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {appointment.recipient.firstName}{" "}
                      {appointment.recipient.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Bénéficiaire du service
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{appointment.recipient.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actions disponibles
            </h3>

            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
                Télécharger la confirmation
              </button>
              <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium">
                Modifier la réservation
              </button>
              <button className="px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 font-medium">
                Annuler la réservation
              </button>
            </div>
          </div>
        </div>
      </div>
    </DefaultTemplate>
  );
}
