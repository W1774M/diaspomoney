"use client";

import { ComplaintsFiltersProps } from "@/lib/types";
import { Filter } from "lucide-react";
import React, { useCallback } from "react";

const ComplaintsFilters = React.memo<ComplaintsFiltersProps>(
  function ComplaintsFilters({
    filters,
    onFilterChange,
    availableStatuses,
    availableTypes,
    availablePriorities,
  }: ComplaintsFiltersProps) {
    const handleStatusChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange("status", e.target.value);
      },
      [onFilterChange],
    );

    const handleTypeChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange("type", e.target.value);
      },
      [onFilterChange],
    );

    const handlePriorityChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange("priority", e.target.value);
      },
      [onFilterChange],
    );

    return (
      <div className="flex gap-2">
        <select 
          title="Statut"
          value={filters.status}
          onChange={handleStatusChange}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
        >
          <option value="all">Tous les statuts</option>
          {availableStatuses.map((status, idx) => (
            <option key={idx} value={status}>
              {status === "OPEN"
                ? "Ouverte"
                : status === "IN_PROGRESS"
                  ? "En cours"
                  : status === "RESOLVED"
                    ? "Résolue"
                    : "Fermée"}
            </option>
          ))}
        </select>

        <select
          title="Type"
          value={filters.type}
          onChange={handleTypeChange}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
        >
          <option value="all">Tous les types</option>
          {availableTypes.map((type, idx) => (
            <option key={idx} value={type}>
              {type === "QUALITY"
                ? "Qualité"
                : type === "DELAY"
                  ? "Retard"
                  : type === "BILLING"
                    ? "Facturation"
                    : "Communication"}
            </option>
          ))}
        </select>

        <select
          title="Priorité"
          value={filters.priority}
          onChange={handlePriorityChange}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
        >
          <option value="all">Toutes les priorités</option>
          {availablePriorities.map((priority, idx) => (
            <option key={idx} value={priority}>
              {priority === "HIGH"
                ? "Élevée"
                : priority === "MEDIUM"
                  ? "Moyenne"
                  : "Faible"}
            </option>
          ))}
        </select>

        <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Filtres
        </button>
      </div>
    );
  },
);

ComplaintsFilters.displayName = "ComplaintsFilters";

export default ComplaintsFilters;
