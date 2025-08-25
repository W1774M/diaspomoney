"use client";
import { useAppointments } from "@/hooks/api";
import DefaultTemplate from "@/template/DefaultTemplate";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Euro,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function AppointmentsPage() {
  const { appointments, loading, error, refetch } = useAppointments();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filtrer les rendez-vous
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesSearch =
        appointment.provider.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        appointment.service?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        appointment.reservationNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  // Fonction pour obtenir l'icône et la couleur du statut
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
          label: "Confirmé",
        };
      case "pending":
        return {
          icon: AlertCircle,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          label: "En attente",
        };
      case "cancelled":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          label: "Annulé",
        };
      case "completed":
        return {
          icon: CheckCircle,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          label: "Terminé",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          label: status,
        };
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <DefaultTemplate>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Chargement de vos rendez-vous...</p>
          </div>
        </div>
      </DefaultTemplate>
    );
  }

  if (error) {
    return (
      <DefaultTemplate>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </DefaultTemplate>
    );
  }

  return (
    <DefaultTemplate>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Mes rendez-vous
                </h1>
                <p className="text-gray-600">
                  Gérez tous vos rendez-vous et réservations
                </p>
              </div>
              <button
                onClick={refetch}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualiser</span>
              </button>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Recherche */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher par prestataire, service ou numéro de réservation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Filtre par statut */}
              <div className="md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
            </div>

            {/* Statistiques */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>Total: {filteredAppointments.length} rendez-vous</span>
                <span>•</span>
                <span>
                  Confirmés:{" "}
                  {
                    filteredAppointments.filter((a) => a.status === "confirmed")
                      .length
                  }
                </span>
                <span>•</span>
                <span>
                  En attente:{" "}
                  {
                    filteredAppointments.filter((a) => a.status === "pending")
                      .length
                  }
                </span>
                <span>•</span>
                <span>
                  Terminés:{" "}
                  {
                    filteredAppointments.filter((a) => a.status === "completed")
                      .length
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Liste des rendez-vous */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Aucun rendez-vous trouvé
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== "all"
                  ? "Aucun rendez-vous ne correspond à vos critères de recherche."
                  : "Vous n'avez pas encore de rendez-vous. Commencez par réserver un service !"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Link
                  href="/provider"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Réserver un service
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => {
                const statusInfo = getStatusInfo(appointment.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={`appointment-key${appointment.id}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Informations principales */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {appointment.provider.name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {appointment.provider.specialty}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div
                              className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
                            >
                              <div className="flex items-center space-x-1">
                                <StatusIcon className="w-4 h-4" />
                                <span>{statusInfo.label}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {formatDate(appointment.timeslot)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {appointment.provider.location}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Euro className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 font-medium">
                              {appointment.totalAmount} €
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {appointment.service?.name ||
                                "Service non spécifié"}
                            </span>
                          </div>
                        </div>

                        {/* Numéro de réservation */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Réservation:{" "}
                            <span className="font-mono font-medium">
                              {appointment.reservationNumber}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col space-y-2 lg:ml-4">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                          Voir les détails
                        </button>
                        {appointment.status === "pending" && (
                          <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm">
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DefaultTemplate>
  );
}
