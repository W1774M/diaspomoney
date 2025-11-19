"use client";

import { ServiceFiltersProps } from "@/lib/types";
import React, { useCallback } from "react";

const ServicesFilters = React.memo<ServiceFiltersProps>(
  function ServicesFilters({
    specialties,
    selectedSpecialty,
    setSelectedSpecialty,
    minRating,
    setMinRating,
  }: ServiceFiltersProps) {
    const handleSpecialtyChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSpecialty(e.target.value);
      },
      [setSelectedSpecialty],
    );

    const handleRatingChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setMinRating(Number(e.target.value));
      },
      [setMinRating],
    );

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spécialité
            </label>
            <select
              title="Spécialité"
              value={selectedSpecialty}
              onChange={handleSpecialtyChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les spécialités</option>
              {specialties.map((specialty, idx) => (
                <option key={idx} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note minimum: {minRating} ⭐
            </label>
            <input
              title="Note minimum"
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={minRating}
              onChange={handleRatingChange}
              className="w-full"
            />
          </div>
        </div>
      </div>
    );
  },
);

ServicesFilters.displayName = "ServicesFilters";

export default ServicesFilters;
