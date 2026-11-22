"use client";

import type { ServiceSearchBarProps } from "@/lib/types";
import React, { useCallback } from "react";

const ServicesSearchBar = React.memo<ServiceSearchBarProps>(
  function ServicesSearchBar({
    availableServices,
    selectedService,
    setSelectedService,
    selectedCity,
    setSelectedCity,
  }) {
    const handleServiceChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedService(e.target.value);
      },
      [setSelectedService],
    );

    const handleCityChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedCity(e.target.value);
      },
      [setSelectedCity],
    );

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor='services-search-bar-selected-service' className="block text-sm font-medium text-gray-700 mb-1">
              Service
            </label>
            <input id='services-search-bar-selected-service'
              type="text"
              placeholder="Rechercher un service..."
              value={selectedService}
              onChange={handleServiceChange}
              list="services-list"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            />
            <datalist id="services-list">
              {availableServices.map((service: string, idx: number) => (
                <option key={idx} value={service} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor='services-search-bar-selected-city' className="block text-sm font-medium text-gray-700 mb-1">
              Localisation
            </label>
            <input id='services-search-bar-selected-city'
              type="text"
              placeholder="Rechercher une localisation (pays ou ville)..."
              value={selectedCity}
              onChange={handleCityChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            />
          </div>
        </div>
      </div>
    );
  },
);

ServicesSearchBar.displayName = "ServicesSearchBar";

export default ServicesSearchBar;
