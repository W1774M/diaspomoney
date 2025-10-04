"use client";

import { useProviders } from "@/hooks";
import { useServiceFilters, useServiceStats } from "@/hooks/services";
import { getUsersByRole } from "@/mocks";
import { IUser } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import ServicesFilters from "./ServicesFilters";
import ServicesProviderList from "./ServicesProviderList";
import ServicesSearchBar from "./ServicesSearchBar";
import ServicesStats from "./ServicesStats";

const ServicesPage = React.memo(function ServicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading, error } = useProviders();
  const [isClient, setIsClient] = useState(false);

  const providers = [
    ...getUsersByRole("{PROVIDER:INDIVIDUAL}"),
    ...getUsersByRole("{PROVIDER:INSTITUTION}"),
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    filters,
    filteredProviders,
    availableServices,
    availableSpecialties,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  } = useServiceFilters(providers as any);

  // Gérer le filtrage par catégorie depuis l'URL
  useEffect(() => {
    const category = searchParams.get("type");
    if (category && ["HEALTH", "EDU", "IMMO"].includes(category)) {
      updateFilter("category", category);
    } else {
      // Reset les filtres si pas de paramètres d'URL
      updateFilter("category", "");
    }
  }, [searchParams, updateFilter]);

  const stats = useServiceStats(providers as any);

  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleProviderSelect = useCallback(
    (provider: IUser) => {
      router.push(`/services/${provider._id}`);
    },
    [router]
  );

  const handleServiceChange = useCallback(
    (value: string) => {
      updateFilter("service", value);
    },
    [updateFilter]
  );

  const handleCityChange = useCallback(
    (value: string) => {
      updateFilter("city", value);
    },
    [updateFilter]
  );

  const handleSpecialtyChange = useCallback(
    (value: string) => {
      updateFilter("specialty", value);
    },
    [updateFilter]
  );

  const handleRatingChange = useCallback(
    (value: number) => {
      updateFilter("rating", value);
    },
    [updateFilter]
  );

  // Logique de pagination
  const totalPages = Math.ceil(filteredProviders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProviders = filteredProviders.slice(startIndex, endIndex);

  // Reset de la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll vers le haut de la page
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Trouvez votre prestataire
          </h1>
          <p className="text-gray-600">
            Découvrez nos prestataires qualifiés et réservez vos services en
            ligne.
          </p>
        </div>

        {/* Category Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => updateFilter("category", "")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !filters.category
                  ? "bg-[hsl(25,100%,53%)] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tous les services
            </button>
            <button
              onClick={() => updateFilter("category", "HEALTH")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filters.category === "HEALTH"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🏥 Santé
            </button>
            <button
              onClick={() => updateFilter("category", "EDU")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filters.category === "EDU"
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🎓 Éducation
            </button>
            <button
              onClick={() => updateFilter("category", "IMMO")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filters.category === "IMMO"
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🏠 Immobilier
            </button>
          </div>
        </div>

        {/* Stats */}
        {isClient && <ServicesStats stats={stats} />}

        {/* Search Bar */}
        <div className="mb-6">
          <ServicesSearchBar
            availableServices={availableServices}
            selectedService={filters.service}
            setSelectedService={handleServiceChange}
            selectedCity={filters.city}
            setSelectedCity={handleCityChange}
          />
        </div>

        {/* Filters Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filtres avancés
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-1 bg-[hsl(25,100%,53%)] text-white text-xs rounded-full">
                Actifs
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mb-6">
            <ServicesFilters
              specialties={availableSpecialties}
              selectedSpecialty={filters.specialty}
              setSelectedSpecialty={handleSpecialtyChange}
              minRating={filters.rating}
              setMinRating={handleRatingChange}
            />

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Effacer tous les filtres
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {isClient && (
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredProviders.length} prestataire
                {filteredProviders.length !== 1 ? "s" : ""} trouvé
                {filteredProviders.length !== 1 ? "s" : ""}
                {totalPages > 1 && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (Page {currentPage} sur {totalPages})
                  </span>
                )}
              </h2>

              {hasActiveFilters && (
                <span className="text-sm text-gray-600">Filtres appliqués</span>
              )}
            </div>
          </div>
        )}

        {/* Provider List */}
        <ServicesProviderList
          providers={paginatedProviders}
          loading={loading}
          error={error}
          onProviderSelect={handleProviderSelect}
        />

        {/* Pagination */}
        {isClient && totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              {/* Bouton Précédent */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>

              {/* Numéros de page */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Afficher seulement les pages proches de la page actuelle
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1);

                if (!showPage) {
                  // Afficher des points de suspension
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span
                        key={page}
                        className="px-3 py-2 text-sm text-gray-500"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? "bg-[hsl(25,100%,53%)] text-white"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              {/* Bouton Suivant */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
});

ServicesPage.displayName = "ServicesPage";

export default ServicesPage;
