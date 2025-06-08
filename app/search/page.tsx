"use client";
import { providers } from "@/lib/datas/providers";
import {
  FiltersProps,
  ProviderCardProps,
  ProviderType,
  SearchBarProps,
} from "@/lib/definitions";
import DefaultTemplate from "@/template/DefaultTemplate";
import { Clock, MapPin, Star } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// Helpers
const getUniqueSpecialties = (providers: ProviderType[]) =>
  Array.from(new Set(providers.map((p) => p.specialty).filter(Boolean)));

const getUniqueProviderTypes = (
  providers: ProviderType[]
): ProviderType["type"][] =>
  Array.from(new Map(providers.map((p) => [p.type.id, p.type])).values());

const getAvailableServices = (providers: ProviderType[]) =>
  Array.from(
    new Set(
      providers.flatMap((provider) => provider.services.map((s) => s.name))
    )
  );

function SearchBar({
  availableServices,
  selectedService,
  setSelectedService,
  countries,
  selectedCountry,
  setSelectedCountry,
  selectedCity,
  setSelectedCity,
}: SearchBarProps) {
  return (
    <div className="bg-gradient-to-r from-[hsl(23,100%,53%)] to-[hsl(41,86%,46%)] py-6">
      <div className="container mx-auto px-4">
        <form
          className="bg-white rounded-lg p-4 shadow-md"
          onSubmit={(e) => {
            e.preventDefault();
          }}
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
                onChange={(e) => setSelectedService(e.target.value)}
                list="services-list"
                autoComplete="off"
              />
              <datalist id="services-list">
                {availableServices.map((service, idx) => (
                  <option key={idx} value={service} />
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
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedCountry(e.target.value);
                }}
                list="locations-list"
                autoComplete="off"
              />
              <datalist id="locations-list">
                {countries.map((country, idx) => (
                  <option key={country + idx} value={country} />
                ))}
                {["Douala", "Yaoundé", "Bafoussam", "Garoua"].map(
                  (city, idx) => (
                    <option key={city + idx} value={city} />
                  )
                )}
              </datalist>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Filters({
  specialties,
  filterSpecialty,
  setFilterSpecialty,
  providerTypes,
  selectedTypes,
  setSelectedTypes,
  filters,
  setFilters,
  resetFilters,
}: FiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Filtres</h2>
      <div className="space-y-6">
        {/* Spécialité */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Spécialité</h3>
          <select
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
          >
            <option value="">Toutes les spécialités</option>
            {specialties.map((specialty: string, index: number) => (
              <option key={index} value={specialty}>
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
              <label key={type.id} className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500"
                  value={type.id}
                  checked={selectedTypes.includes(type.id.toString())}
                  onChange={(e) => {
                    const { value, checked } = e.target;
                    if (checked) {
                      setSelectedTypes([...selectedTypes, value]);
                    } else {
                      setSelectedTypes(
                        selectedTypes.filter((id) => id !== value)
                      );
                    }
                  }}
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
}

function ProviderCard({ provider, onDetails }: ProviderCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/4">
          <Image
            src={provider.images[0]}
            width={100}
            height={50}
            alt={provider.name}
            className="w-full h-full object-fit"
            loading="lazy"
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
                    key={star}
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
              {provider.services.map(
                (service: { name: string; price: number }, index: number) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {service.name}
                  </span>
                )
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="mb-2 sm:mb-0">
              <span className="text-gray-500">Prix à partir de:</span>
              <span className="text-2xl font-bold text-blue-700 ml-2">
                {Math.min(
                  ...provider.services.map(
                    (s: { name: string; price: number }) => s.price
                  )
                )}{" "}
                €
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
  const [filterSpecialty, setFilterSpecialty] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [filters, setFilters] = useState({ priceMin: 0, priceMax: 500 });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>("Recommandés");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const router = useRouter();

  const specialties = useMemo(() => getUniqueSpecialties(providers), []);
  const providerTypes = useMemo(() => getUniqueProviderTypes(providers), []);
  const availableServices = useMemo(() => getAvailableServices(providers), []);
  const itemsPerPage = 3;

  // Pays dynamiques selon le service sélectionné
  const countries = useMemo(
    () =>
      Array.from(
        new Set(
          providers
            .filter((provider) =>
              selectedService === ""
                ? true
                : provider.services.some(
                    (service) => service.name === selectedService
                  )
            )
            .map(
              (provider) =>
                provider.apiGeo &&
                provider.apiGeo[0]?.display_name?.split(",").pop()?.trim()
            )
            .filter(
              (country): country is string =>
                typeof country === "string" && country.length > 0
            )
        )
      ),
    [selectedService]
  );

  // Filtrage principal
  const filteredProviders = useMemo(
    () =>
      providers.filter((p) => {
        const matchType =
          selectedTypes.length === 0 ||
          selectedTypes.includes(p.type.id.toString());
        const matchSpecialty =
          !filterSpecialty || p.specialty === filterSpecialty;
        const minPrice = Math.min(...p.services.map((s) => s.price));
        const matchPrice = minPrice <= filters.priceMax;
        const matchService =
          !selectedService ||
          p.services.some((service) => service.name === selectedService);
        const matchCountry =
          !selectedCountry ||
          (p.apiGeo &&
            p.apiGeo[0]?.display_name
              ?.toLowerCase()
              .includes(selectedCountry.toLowerCase()));
        const matchCity =
          !selectedCity ||
          (p.apiGeo &&
            p.apiGeo[0]?.display_name
              ?.toLowerCase()
              .includes(selectedCity.toLowerCase()));
        return (
          matchType &&
          matchSpecialty &&
          matchPrice &&
          matchService &&
          matchCountry &&
          matchCity
        );
      }),
    [
      selectedTypes,
      filterSpecialty,
      filters.priceMax,
      selectedService,
      selectedCountry,
      selectedCity,
    ]
  );

  // Tri
  const sortedProviders = useMemo(() => {
    if (!sortBy || sortBy === "Recommandés") {
      return [
        ...filteredProviders.filter((p) => p.recommended),
        ...filteredProviders.filter((p) => !p.recommended),
      ];
    }
    if (sortBy === "Prix croissant") {
      return [...filteredProviders].sort(
        (a, b) =>
          Math.min(...a.services.map((s) => s.price)) -
          Math.min(...b.services.map((s) => s.price))
      );
    }
    if (sortBy === "Prix décroissant") {
      return [...filteredProviders].sort(
        (a, b) =>
          Math.max(...b.services.map((s) => s.price)) -
          Math.max(...a.services.map((s) => s.price))
      );
    }
    if (sortBy === "Meilleures évaluations") {
      return [...filteredProviders].sort((a, b) => b.rating - a.rating);
    }
    return filteredProviders;
  }, [filteredProviders, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedProviders.length / itemsPerPage);
  const paginatedProviders = sortedProviders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number): void => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const resetFilters = () => {
    setSelectedTypes([]);
    setFilterSpecialty("");
    setFilters({ priceMin: 0, priceMax: 500 });
    setCurrentPage(1);
    setSortBy("Recommandés");
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterSpecialty, selectedTypes, filters.priceMax, sortBy]);

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
                filters={filters}
                setFilters={setFilters}
                resetFilters={resetFilters}
              />
            </div>
            {/* Résultats */}
            <div className="lg:w-3/4">
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <h2 className="text-xl font-bold mb-2 sm:mb-0">
                  {sortedProviders.length} prestataires trouvés
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
                {paginatedProviders.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onDetails={() => router.push(`/provider/${provider.id}`)}
                  />
                ))}
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
                      key={i + 1}
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
