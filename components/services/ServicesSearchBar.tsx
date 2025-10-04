"use client";

import { ServiceSearchBarProps } from "@/types/services";
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
      [setSelectedService]
    );

    const handleCityChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedCity(e.target.value);
      },
      [setSelectedCity]
    );

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service
            </label>
            <input
              type="text"
              placeholder="Rechercher un service..."
              value={selectedService}
              onChange={handleServiceChange}
              list="services-list"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="services-list">
              {availableServices.map((service, idx) => (
                <option key={idx} value={service} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localisation
            </label>
            <input
              type="text"
              placeholder="Rechercher une localisation (pays ou ville)..."
              value={selectedCity}
              onChange={handleCityChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    );
  }
);

ServicesSearchBar.displayName = "ServicesSearchBar";

export default ServicesSearchBar;
