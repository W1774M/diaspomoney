"use client";

import { BeneficiaryRelationship, BeneficiaryFilters } from "@/lib/types";
import React, { useCallback } from "react";

interface BeneficiariesFiltersProps {
  filters: BeneficiaryFilters;
  onFilterChange: (key: keyof BeneficiaryFilters, value: string | boolean | undefined) => void;
  availableRelationships: BeneficiaryRelationship[];
}

const BeneficiariesFilters = React.memo<BeneficiariesFiltersProps>(
  function BeneficiariesFilters({
    filters,
    onFilterChange,
    availableRelationships,
  }: BeneficiariesFiltersProps) {
    const handleRelationshipChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value || undefined;
        onFilterChange("relationship", value as BeneficiaryRelationship | undefined);
      },
      [onFilterChange],
    );

    const handleAccountStatusChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'true') {
          onFilterChange("hasAccount", true);
        } else if (value === 'false') {
          onFilterChange("hasAccount", false);
        } else {
          onFilterChange("hasAccount", undefined);
        }
      },
      [onFilterChange],
    );

    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relation
            </label>
            <select
              title="Relation"
              value={filters.relationship ?? ""}
              onChange={handleRelationshipChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
            >
              <option value="">Toutes les relations</option>
              {availableRelationships.map((relationship: BeneficiaryRelationship, idx: number) => (
                <option key={idx} value={relationship}>
                  {relationship}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut du compte
            </label>
            <select
              title="Statut du compte"
              value={filters.hasAccount === undefined ? "" : (filters.hasAccount ? "true" : "false")}
              onChange={handleAccountStatusChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="with">Avec compte</option>
              <option value="without">Sans compte</option>
            </select>
          </div>
        </div>
      </div>
    );
  },
);

BeneficiariesFilters.displayName = "BeneficiariesFilters";

export default BeneficiariesFilters;
