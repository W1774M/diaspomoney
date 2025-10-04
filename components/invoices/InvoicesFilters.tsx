"use client";

import { InvoicesFiltersProps } from "@/types/invoices";
import { Search } from "lucide-react";
import React, { useCallback } from "react";

const InvoicesFilters = React.memo<InvoicesFiltersProps>(
  function InvoicesFilters({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
  }) {
    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
      },
      [setSearchTerm]
    );

    const handleStatusChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value as any);
      },
      [setStatusFilter]
    );

    const handleDateChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateFilter(e.target.value);
      },
      [setDateFilter]
    );

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Numéro, client, prestataire..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PAID">Payée</option>
              <option value="PENDING">En attente</option>
              <option value="OVERDUE">En retard</option>
              <option value="CANCELLED">Annulée</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date d&apos;émission
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    );
  }
);

InvoicesFilters.displayName = "InvoicesFilters";

export default InvoicesFilters;
