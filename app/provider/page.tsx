"use client";
import { useProviders } from "@/hooks/api";
import {
  FiltersProps,
  Provider,
  ProviderCardProps,
  SearchBarProps,
  Service,
} from "@/lib/definitions";
import DefaultTemplate from "@/template/DefaultTemplate";
import { Clock, MapPin, Star } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";

// Fonctions utilitaires pour extraire les données uniques
const getUniqueSpecialties = (providers: Provider[]) =>
  [...new Set(providers.map((p) => p.specialty))].sort();

const getUniqueProviderTypes = (providers: Provider[]): Provider["type"][] => {
  const seen = new Set();
  return providers
    .map((p) => p.type)
    .filter((type) => {
      if (seen.has(type.id)) return false;
      seen.add(type.id);
      return true;
    });
};

const getAvailableServices = (providers: Provider[]) =>
  providers
    .flatMap((p) => p.services)
    .filter(
      (service, index, self) =>
        index === self.findIndex((s) => s.name === service.name)
    )
    .map((s) => s.name)
    .sort();

const getCountries = (providers: Provider[]) =>
  providers
    .flatMap((p) => p.apiGeo)
    .map((geo) => geo.name)
    .filter((name, index, self) => self.indexOf(name) === index)
    .sort();

const SearchBar = React.memo(function SearchBar({
  availableServices,
  selectedService,
  setSelectedService,
  countries,
  selectedCountry,
  setSelectedCountry,
  selectedCity,
  setSelectedCity,
}: SearchBarProps) {
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

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="bg-gradient-to-r from-[hsl(23,100%,53%)] to-[hsl(41,86%,46%)] py-6">
      <div className="container mx-auto px-4">
        <form
          className="bg-white rounded-lg p-4 shadow-md"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Service Autocomplete */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Rechercher un service..."
                value={selectedService}
                onChange={handleServiceChange}
                list="services-list"
                autoComplete="off"
              />
              <datalist id="services-list">
                {availableServices.map((service) => (
                  <option key={`service-${service}`} value={service} />
                ))}
              </datalist>
            </div>
            {/* Lieu Autocomplete */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lieu
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ville, pays..."
                value={selectedCity || selectedCountry}
                onChange={handleLocationChange}
                list="locations-list"
                autoComplete="off"
              />
              <datalist id="locations-list">
                {countries.map((country, index) => (
                  <option key={`country-${country}-${index}`} value={country} />
                ))}
                {["Douala", "Yaoundé", "Bafoussam", "Garoua"].map((city) => (
                  <option key={`city-${city}`} value={city} />
                ))}
              </datalist>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

const Filters = React.memo(function Filters({
  specialties,
  filterSpecialty,
  setFilterSpecialty,
  providerTypes,
  selectedTypes,
  setSelectedTypes,
  selectedGroup,
  setSelectedGroup,
  filters,
  setFilters,
  resetFilters,
}: FiltersProps & {
  selectedGroup: string;
  setSelectedGroup: (value: string) => void;
}) {
  const handleGroupChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedGroup(e.target.value);
    },
    [setSelectedGroup]
  );

  const handleSpecialtyChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilterSpecialty(e.target.value);
    },
    [setFilterSpecialty]
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value, checked } = e.target;
      if (checked) {
        setSelectedTypes([...selectedTypes, value]);
      } else {
        setSelectedTypes(selectedTypes.filter((id) => id !== value));
      }
    },
    [selectedTypes, setSelectedTypes]
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Filtres</h2>
      <div className="space-y-6">
        {/* Types */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Types</h3>
          <select
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedGroup}
            onChange={handleGroupChange}
          >
            <option value="">Tous les types</option>
            <option value="sante">Santé</option>
            <option value="edu">Éducation</option>
            <option value="immo">Immobilier</option>
          </select>
        </div>
        {/* Spécialité */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Spécialité</h3>
          <select
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterSpecialty}
            onChange={handleSpecialtyChange}
          >
            <option value="">Toutes les spécialités</option>
            {specialties.map((specialty: string) => (
              <option key={`specialty-${specialty}`} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>
        {/* Type de prestataire */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Type de prestataire
          </h3>
          <div className="space-y-2">
            {providerTypes.map((type) => (
              <label
                key={`provider-type-key-${type.id}`}
                className="flex items-center"
              >
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500"
                  value={type.id}
                  checked={selectedTypes.includes(type.id.toString())}
                  onChange={handleTypeChange}
                />
                <span className="ml-2 text-gray-700">{type.value}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Prix */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Prix</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">
                Min: {filters.priceMin} €
              </span>
              <span className="text-gray-600 text-sm">
                Max: {filters.priceMax} €
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={filters.priceMax}
              onChange={(e) =>
                setFilters({ ...filters, priceMax: parseInt(e.target.value) })
              }
              className="w-full"
            />
          </div>
        </div>
        {/* Réinitialiser */}
        <button
          className="w-full bg-gray-100 text-gray-700 rounded-md py-2 font-medium hover:bg-gray-200 transition cursor-pointer"
          onClick={resetFilters}
        >
          Réinitialiser les filtres
        </button>
      </div>
    </div>
  );
});

function ProviderCard({ provider, onDetails }: ProviderCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/4">
          <Image
            src={provider.images[0]}
            width={300}
            height={200}
            alt={provider.name}
            className="w-full h-48 md:h-full object-cover"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        </div>
        <div className="p-6 md:w-3/4">
          <div className="flex flex-col sm:flex-row justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">{provider.name}</h3>
              <p className="text-gray-500">
                {provider.type.value} • {provider.specialty}
              </p>
            </div>
            <div className="flex items-center mt-2 sm:mt-0">
              <div className="flex items-center mr-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={`star-key-${star}`}
                    size={16}
                    className={
                      star <= Math.floor(provider.rating)
                        ? "text-amber-400"
                        : "text-gray-300"
                    }
                    fill={
                      star <= Math.floor(provider.rating)
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </div>
              <span className="text-gray-700">{provider.rating}</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center mb-4">
            <div className="flex items-center mb-2 md:mb-0 md:mr-4">
              <MapPin size={16} className="text-gray-500 mr-1" />
              <span className="text-gray-700">
                {provider.apiGeo[0].display_name.toLocaleLowerCase()}
              </span>
            </div>
            <div className="flex items-center text-blue-600">
              <Clock size={16} className="mr-1" />
              <span>Disponible sous 24h</span>
            </div>
          </div>
          <div className="mb-4">
            <h4 className="font-medium mb-2">Services disponibles:</h4>
            <div className="flex flex-wrap gap-2">
              {provider.services.map((service: Service, index: number) => (
                <span
                  key={`service-${service.name}-${index}`}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  {service.name}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="mb-2 sm:mb-0">
              <span className="text-gray-500">Prix à partir de:</span>
              <span className="text-2xl font-bold text-blue-700 ml-2">
                {Math.min(...provider.services.map((s: Service) => s.price))} €
              </span>
            </div>
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition cursor-pointer"
              onClick={onDetails}
            >
              Voir les détails
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function SearchPage() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>(""); // Nouveau état pour le groupe
  const [filterSpecialty, setFilterSpecialty] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [filters, setFilters] = useState({ priceMin: 0, priceMax: 500 });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>("Recommandés");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const router = useRouter();

  // Récupérer le type de service depuis l'URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const serviceType = urlParams.get("type");

      if (serviceType) {
        // Mapper les types de service vers les types de prestataires
        const typeMapping: { [key: string]: string[] } = {
          sante: ["1", "2", "3", "4"], // Clinique, Centre médical, Médecin, Hopital
          education: ["5", "6", "7"], // École, Université, Formation
          btp: ["8", "9", "10"], // Construction, Immobilier, Rénovation
        };

        const mappedTypes = typeMapping[serviceType] || [];
        setSelectedTypes(mappedTypes);
      }
    }
  }, []);

  // Utiliser le hook pour récupérer les prestataires filtrés
  const {
    providers: filteredProviders,
    loading,
    error,
  } = useProviders({
    type: selectedTypes.join(","),
    group: selectedGroup || undefined, // Ajouter le filtrage par groupe
    specialty: filterSpecialty,
    service: selectedService,
    country: selectedCountry,
    city: selectedCity,
    priceMax: filters.priceMax,
    sortBy:
      sortBy === "Recommandés"
        ? "recommended"
        : sortBy === "Prix croissant"
        ? "price_asc"
        : sortBy === "Prix décroissant"
        ? "price_desc"
        : sortBy === "Meilleures évaluations"
        ? "rating"
        : "recommended",
  });

  // Utiliser le hook pour récupérer TOUS les prestataires (pour les options de filtres)
  const { providers: allProviders } = useProviders({});

  const specialties = useMemo(
    () => getUniqueSpecialties(allProviders),
    [allProviders]
  );
  const providerTypes = useMemo(
    () => getUniqueProviderTypes(allProviders),
    [allProviders]
  );
  const availableServices = useMemo(
    () => getAvailableServices(allProviders),
    [allProviders]
  );
  const countries = useMemo(() => getCountries(allProviders), [allProviders]);
  const itemsPerPage = 3;

  // Pagination
  const totalPages = Math.ceil(filteredProviders.length / itemsPerPage);
  const paginatedProviders = filteredProviders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number): void => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedGroup(""); // Réinitialiser le groupe
    setFilterSpecialty("");
    setFilters({ priceMin: 0, priceMax: 500 });
    setCurrentPage(1);
    setSortBy("Recommandés");
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterSpecialty, selectedTypes, selectedGroup, filters.priceMax, sortBy]);

  return (
    <DefaultTemplate>
      <div className="flex flex-col">
        <SearchBar
          availableServices={availableServices}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          countries={countries}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filtres */}
            <div className="lg:w-1/4">
              <Filters
                specialties={specialties}
                filterSpecialty={filterSpecialty}
                setFilterSpecialty={setFilterSpecialty}
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
                    : `${filteredProviders.length} prestataires trouvés`}
                </h2>
                <div className="flex items-center">
                  <span className="text-gray-700 mr-2">Trier par:</span>
                  <select
                    className="border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
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
                ) : (
                  paginatedProviders.map((provider: Provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      onDetails={() => router.push(`/provider/${provider.id}`)}
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
    </DefaultTemplate>
  );
}
