"use client";

import { useAppointments } from "@/hooks";
import {
  useAppointmentFilters,
} from "@/hooks/appointments";
import { Appointment } from "@/types/appointments";
import { useRouter } from "next/navigation";
import React, { useCallback } from "react";
import AppointmentsHeader from "./AppointmentsHeader";
import AppointmentsSearch from "./AppointmentsSearch";
import AppointmentsTable from "./AppointmentsTable";

const AppointmentsPage = React.memo(function AppointmentsPage() {
  const router = useRouter();
  const { appointments, loading, error } = useAppointments({
    limit: 1000,
  });

  const {
    filters,
    filteredAppointments,
    availableStatuses,
    availablePaymentStatuses,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  } = useAppointmentFilters(appointments as Appointment[]);

  // const stats = useAppointmentStats(appointments as Appointment[]);

  const handleViewAppointment = useCallback(
    (appointment: Appointment) => {
      router.push(`/dashboard/appointments/${appointment._id}`);
    },
    [router],
  );

  const handleEditAppointment = useCallback(
    (appointment: Appointment) => {
      router.push(`/dashboard/appointments/${appointment._id}/edit`);
    },
    [router],
  );

  const handleCancelAppointment = useCallback(() => {
    if (confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")) {
      // TODO: Implement cancel appointment logic
      // console.log("Cancel appointment");
    }
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      updateFilter("searchTerm", value);
    },
    [updateFilter],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      updateFilter("status", value);
    },
    [updateFilter],
  );

  const handlePaymentStatusChange = useCallback(
    (value: string) => {
      updateFilter("paymentStatus", value);
    },
    [updateFilter],
  );

  // const handleDateRangeChange = useCallback(
  //   (field: "start" | "end") => (value: string) => {
  //     const newDateRange = {
  //       ...filters.dateRange,
  //       [field]: value,
  //     };
  //     updateFilter("dateRange", newDateRange);
  //   },
  //   [filters.dateRange, updateFilter],
  // );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AppointmentsHeader onNewAppointment={() => {}} />

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <AppointmentsSearch
              searchTerm={filters.searchTerm}
              setSearchTerm={handleSearchChange}
            />

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={e => handleStatusChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tous les statuts</option>
              {availableStatuses.map((status, idx) => (
                <option key={idx} value={status}>
                  {status === "confirmed"
                    ? "Confirmé"
                    : status === "pending"
                      ? "En attente"
                      : status === "cancelled"
                        ? "Annulé"
                        : "Terminé"}
                </option>
              ))}
            </select>

            {/* Payment Status Filter */}
            <select
              value={filters.paymentStatus}
              onChange={e => handlePaymentStatusChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tous les paiements</option>
              {availablePaymentStatuses.map((status, idx) => (
                <option key={idx} value={status}>
                  {status === "paid"
                    ? "Payé"
                    : status === "pending"
                      ? "En attente"
                      : status === "failed"
                        ? "Échoué"
                        : "Remboursé"}
                </option>
              ))}
            </select>

            {/* Reset Filters */}
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredAppointments.length} rendez-vous trouvé
            {filteredAppointments.length !== 1 ? "s" : ""}
          </h2>
          {hasActiveFilters && (
            <p className="text-sm text-gray-600">Filtres appliqués</p>
          )}
        </div>

        {/* Table */}
        <AppointmentsTable
          appointments={filteredAppointments}
          loading={loading}
          error={error}
          onView={handleViewAppointment}
          onEdit={handleEditAppointment}
          onCancel={handleCancelAppointment}
        />
      </div>
    </div>
  );
});

AppointmentsPage.displayName = "AppointmentsPage";

export default AppointmentsPage;
