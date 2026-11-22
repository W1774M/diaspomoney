"use client";

import { QuotesFiltersProps } from "@/lib/types";
import { Search } from "lucide-react";
import React, { useCallback } from "react";

const QuotesFilters = React.memo<QuotesFiltersProps>(function QuotesFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
}: QuotesFiltersProps) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [setSearchTerm],
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setStatusFilter(e.target.value as any);
    },
    [setStatusFilter],
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateFilter(e.target.value);
    },
    [setDateFilter],
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor='quotes-filters-search-term' className="block text-sm font-medium text-gray-700 mb-1">
            Rechercher
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input id='quotes-filters-search-term'
              type="text"
              placeholder="Numéro, titre, prestataire..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            />
          </div>
        </div>

        <div>
          <label htmlFor='quotes-filters-status-filter' className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select id='quotes-filters-status-filter'
            title="Statut"
            value={statusFilter}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvé</option>
            <option value="REJECTED">Rejeté</option>
            <option value="EXPIRED">Expiré</option>
          </select>
        </div>

        <div>
          <label htmlFor='quotes-filters-date-filter' className="block text-sm font-medium text-gray-700 mb-1">
            Date de création
          </label>
          <input id='quotes-filters-date-filter'
            title="Date de création"
            type="date"
            value={dateFilter}
            onChange={handleDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          />
        </div>
      </div>
    </div>
  );
});

QuotesFilters.displayName = "QuotesFilters";

export default QuotesFilters;
