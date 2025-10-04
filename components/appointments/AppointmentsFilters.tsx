"use client";

import { AppointmentsFiltersProps } from "@/types/appointments";
import React, { useCallback } from "react";

const AppointmentsFilters = React.memo<AppointmentsFiltersProps>(
  function AppointmentsFilters({
    filters,
    onFilterChange,
    availableStatuses,
    availablePaymentStatuses,
  }) {
    const handleStatusChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange("status", e.target.value);
      },
      [onFilterChange]
    );

    const handlePaymentStatusChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange("paymentStatus", e.target.value);
      },
      [onFilterChange]
    );

    const handleDateRangeChange = useCallback(
      (field: "start" | "end") => (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDateRange = {
          ...filters.dateRange,
          [field]: e.target.value,
        };
        onFilterChange("dateRange", newDateRange);
      },
      [filters.dateRange, onFilterChange]
    );

    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={handleStatusChange}
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
            onChange={handlePaymentStatusChange}
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

          {/* Date Range Start */}
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={handleDateRangeChange("start")}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Date de début"
          />

          {/* Date Range End */}
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={handleDateRangeChange("end")}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Date de fin"
          />
        </div>
      </div>
    );
  }
);

AppointmentsFilters.displayName = "AppointmentsFilters";

export default AppointmentsFilters;
