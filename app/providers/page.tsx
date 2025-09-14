"use client";
import { ProviderStats } from "@/components/features/providers/ProviderStats";
import { StatusBadge } from "@/components/ui";
import { MOCK_USERS } from "@/mocks";
import { IUser } from "@/types";
import { Clock, MapPin, Star } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";

// Fonctions utilitaires pour extraire les données uniques
const getUniqueSpecialties = (providers: IUser[]) =>
  [...new Set(providers.map(p => p.specialty).filter(Boolean))].sort();

const getUniqueProviderTypes = (
  providers: IUser[]
): { id: string | number; value: string }[] => {
  // Créer des types basés sur les spécialités des prestataires
  const specialties = getUniqueSpecialties(providers);
  return specialties.map((specialty, index) => ({
    id: index + 1,
    value: specialty || "Spécialité non définie",
  }));
};

const getAvailableServices = (providers: IUser[]) =>
  providers
    .flatMap(p => (p.selectedServices ? [p.selectedServices] : []))
    .filter((service): service is string => Boolean(service))
    .sort();

// Hook personnalisé pour récupérer les prestataires
const useProviders = () => {
  const [providers, setProviders] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        // Utiliser les mocks au lieu de l'API
        // Filtrer uniquement les prestataires ACTIFS
        const providerUsers = MOCK_USERS.filter(
          user => user.roles.includes("PROVIDER") && user.status === "ACTIVE"
        );
        setProviders(providerUsers);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  return { providers, loading, error };
};

const SearchBar = React.memo(function SearchBar({
  selectedService,
  setSelectedService,
  selectedCity,
  setSelectedCity,
}: {
  selectedService: string;
  setSelectedService: (value: string) => void;
  selectedCity: string;
  setSelectedCity: (value: string) => void;
}) {
  const handleServiceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedService(e.target.value);
    },
    [setSelectedService]
  );

  const handleLocationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedCity(e.target.value);
      setSelectedCountry(e.target.value);
    },
    [setSelectedCity, setSelectedCountry]
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input pour le service */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service
          </label>
          <input
            type="text"
            placeholder="Rechercher un service..."
            value={selectedService}
            onChange={handleServiceChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Input pour la localisation (pays ou ville) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Localisation
          </label>
          <input
            type="text"
            placeholder="Rechercher une localisation (pays ou ville)..."
            value={selectedCity}
            onChange={e => {
              setSelectedCity(e.target.value);
              setSelectedCountry(e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
});

const ProviderCard = React.memo(function ProviderCard({
  provider,
  onDetails,
}: {
  provider: IUser;
  onDetails: () => void;
}) {
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4.0) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 4.0) return "Très bien";
    if (rating >= 3.5) return "Bien";
    return "Moyen";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Image et informations de base */}
        <div className="lg:w-1/3">
          <div className="relative w-full h-48 lg:h-32 rounded-lg overflow-hidden bg-gray-100">
            {provider.avatar ? (
              <Image
                src={provider.avatar.image}
                alt={provider.avatar.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <span className="text-gray-500 text-2xl">
                  {provider.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="lg:w-2/3">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {provider.name}
                </h3>
                <StatusBadge status="ACTIVE" size="sm" />
              </div>
              <p className="text-gray-600 mb-2">{provider.specialty}</p>
              {provider.company && (
                <p className="text-sm text-gray-500 mb-2">{provider.company}</p>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-2 lg:mt-0">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 mr-1" />
                <span
                  className={`font-semibold ${getRatingColor(provider.rating || 0)}`}
                >
                  {provider.rating || "N/A"}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                ({getRatingText(provider.rating || 0)})
              </span>
            </div>
          </div>

          {/* Localisation */}
          {provider.apiGeo && provider.apiGeo.length > 0 && (
            <div className="flex items-center text-gray-600 mb-3">
              <MapPin className="w-4 h-4 mr-2" />
              <span>
                {provider.apiGeo
                  .map(geo => geo?.display_name || geo?.name)
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}

          {/* Services disponibles */}
          {provider.selectedServices && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Services disponibles:
              </p>
              <div className="flex flex-wrap gap-2">
                {provider.selectedServices.split(",").map((service, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {service.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Disponibilité */}
          <div className="flex items-center text-gray-600 mb-4">
            <Clock className="w-4 h-4 mr-2" />
            <span className="text-sm">Disponible maintenant</span>
          </div>

          {/* Bouton de détails */}
          <button
            onClick={onDetails}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors w-full lg:w-auto"
          >
            Voir les détails
          </button>
        </div>
      </div>
    </div>
  );
});

const FilterSidebar = React.memo(function FilterSidebar({
  providerTypes,
  selectedTypes,
  setSelectedTypes,
  selectedGroup,
  setSelectedGroup,
  filters,
  setFilters,
  resetFilters,
}: {
  providerTypes: { id: string | number; value: string }[];
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
  selectedGroup: string;
  setSelectedGroup: (group: string) => void;
  filters: any;
  setFilters: (filters: any) => void;
  resetFilters: () => void;
}) {
  const handleTypeChange = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleGroupChange = (group: string) => {
    setSelectedGroup(group === selectedGroup ? "" : group);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Filtres</h3>
        <button
          onClick={resetFilters}
          className="text-blue-600 text-sm hover:text-blue-800"
        >
          Réinitialiser
        </button>
      </div>

      {/* Types de prestataires */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">
          Types de prestataires
        </h4>
        <div className="space-y-2">
          {providerTypes.map(type => (
            <label key={type.id} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type.value)}
                onChange={() => handleTypeChange(type.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{type.value}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Groupes */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Groupes</h4>
        <div className="space-y-2">
          {["Santé", "Finance", "Formation", "Immobilier"].map(group => (
            <label key={group} className="flex items-center">
              <input
                type="radio"
                name="group"
                checked={selectedGroup === group}
                onChange={() => handleGroupChange(group)}
                className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{group}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Prix */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Fourchette de prix</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">0€ - 50€</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">50€ - 100€</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">100€+</span>
          </label>
        </div>
      </div>
    </div>
  );
});

export default function ProvidersPage() {
  const router = useRouter();
  const { providers, loading, error } = useProviders();

  // États pour les filtres
  const [selectedService, setSelectedService] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [sortBy, setSortBy] = useState("Recommandés");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Données dérivées
  const availableServices = useMemo(
    () => getAvailableServices(providers),
    [providers]
  );
  const providerTypes = useMemo(
    () => getUniqueProviderTypes(providers),
    [providers]
  );

  // Filtrage des prestataires
  const filteredProviders = useMemo(() => {
    let filtered = providers;

    if (selectedService) {
      filtered = filtered.filter(p =>
        p.selectedServices
          ?.toLowerCase()
          .includes(selectedService.toLowerCase())
      );
    }

    if (selectedCountry) {
      filtered = filtered.filter(p =>
        p.apiGeo?.some(
          geo =>
            geo?.name === selectedCountry ||
            geo?.display_name?.includes(selectedCountry)
        )
      );
    }

    if (selectedCity) {
      filtered = filtered.filter(p =>
        p.apiGeo?.some(
          geo =>
            geo?.name?.toLowerCase().includes(selectedCity.toLowerCase()) ||
            geo?.display_name
              ?.toLowerCase()
              .includes(selectedCity.toLowerCase())
        )
      );
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(p =>
        selectedTypes.includes(p.specialty || "")
      );
    }

    if (selectedGroup) {
      filtered = filtered.filter(p => p.specialty === selectedGroup);
    }

    return filtered;
  }, [
    providers,
    selectedService,
    selectedCountry,
    selectedCity,
    selectedTypes,
    selectedGroup,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredProviders.length / itemsPerPage);
  const paginatedProviders = filteredProviders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const resetFilters = () => {
    setSelectedService("");
    setSelectedCountry("");
    setSelectedCity("");
    setSelectedTypes([]);
    setSelectedGroup("");
    setCurrentPage(1);
  };

  const filters = {
    selectedService,
    selectedCountry,
    selectedCity,
    selectedTypes,
    selectedGroup,
  };

  const setFilters = (newFilters: any) => {
    setSelectedService(newFilters.selectedService || "");
    setSelectedCountry(newFilters.selectedCountry || "");
    setSelectedCity(newFilters.selectedCity || "");
    setSelectedTypes(newFilters.selectedTypes || []);
    setSelectedGroup(newFilters.selectedGroup || "");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Trouvez le prestataire idéal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez des prestataires qualifiés et actifs dans votre région
            pour tous vos besoins
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Seuls les prestataires actifs sont affichés
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-8">
          <SearchBar
            availableServices={availableServices}
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
          />
        </div>

        {/* Statistiques des prestataires */}
        <ProviderStats
          totalProviders={
            MOCK_USERS.filter(user => user.roles.includes("PROVIDER")).length
          }
          activeProviders={providers.length}
          totalSpecialties={providerTypes.length}
          totalCountries={countries.length}
        />

        {/* Contenu principal */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar des filtres */}
          <div className="lg:w-1/4">
            <FilterSidebar
              providerTypes={providerTypes}
              selectedTypes={selectedTypes}
              setSelectedTypes={setSelectedTypes}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
              filters={filters}
              setFilters={setFilters}
              resetFilters={resetFilters}
            />
          </div>
          {/* Résultats */}
          <div className="lg:w-3/4">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h2 className="text-xl font-bold mb-2 sm:mb-0">
                {loading
                  ? "Chargement..."
                  : `${filteredProviders.length} prestataire${filteredProviders.length > 1 ? "s" : ""} trouvé${filteredProviders.length > 1 ? "s" : ""}`}
              </h2>
              <div className="flex items-center">
                <span className="text-gray-700 mr-2">Trier par:</span>
                <select
                  className="border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="Recommandés">Recommandés</option>
                  <option value="Prix croissant">Prix croissant</option>
                  <option value="Prix décroissant">Prix décroissant</option>
                  <option value="Meilleures évaluations">
                    Meilleures évaluations
                  </option>
                </select>
              </div>
            </div>
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">
                    Chargement des prestataires...
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">Erreur: {error}</p>
                </div>
              ) : paginatedProviders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-2">
                    Aucun prestataire actif trouvé.
                  </p>
                  <p className="text-sm text-gray-500">
                    Essayez de modifier vos critères de recherche ou revenez
                    plus tard.
                  </p>
                </div>
              ) : (
                paginatedProviders.map((provider: IUser) => (
                  <ProviderCard
                    key={provider._id}
                    provider={provider}
                    onDetails={() => router.push(`/providers/${provider._id}`)}
                  />
                ))
              )}
            </div>
            {/* Pagination */}
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-1">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Précédent
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={`pagination-${i + 1}`}
                    className={`px-4 py-2 border rounded-md ${
                      currentPage === i + 1
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => goToPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
