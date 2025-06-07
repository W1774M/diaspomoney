"use client";
import { providers } from "@/lib/datas/providers";
import { providerType } from "@/lib/definitions";
import DefaultTemplate from "@/template/DefaultTemplate";
import { ChevronDown, Clock, MapPin, Search, Star } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

// Helpers pour extraire les valeurs uniques
const getUniqueSpecialties = (providers: providerType[]) =>
  Array.from(new Set(providers.map((p) => p.specialty).filter(Boolean)));

type ProviderType = {
  id: string | number;
  value: string;
};

const getUniqueProviderTypes = (providers: providerType[]): ProviderType[] =>
  Array.from(new Map(providers.map((p) => [p.type.id, p.type])).values());

// Composant de page de recherche de prestataire
export default function SearchPage() {
  // États pour les filtres
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [filterSpecialty, setFilterSpecialty] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [filters, setFilters] = useState<{
    priceMin: number;
    priceMax: number;
  }>({
    priceMin: 0,
    priceMax: 500,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>("Recommandés");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  const specialties = getUniqueSpecialties(providers);
  const providerTypes = getUniqueProviderTypes(providers);
  const itemsPerPage = 6;

  // Handlers pour les filtres
  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterSpecialty(e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setSelectedTypes((prev) =>
      checked ? [...prev, value] : prev.filter((id) => id !== value)
    );
  };

  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      priceMax: parseInt(e.target.value),
    });
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedService(e.target.value);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(e.target.value);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
  };

  // Filtrage principal
  const filteredProviders = providers.filter((p) => {
    const matchType =
      selectedTypes.length === 0 ||
      selectedTypes.includes(p.type.id.toString());
    const matchSpecialty = !filterSpecialty || p.specialty === filterSpecialty;
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
  });

  const resetFilters = () => {
    setSelectedTypes([]);
    setFilterSpecialty("");
    setFilters({
      priceMin: 0,
      priceMax: 500,
    });
    setCurrentPage(1);
    setSortBy("Recommandés");
  };

  // Tri
  const getSortedProviders = () => {
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
  };

  // Pagination
  const sortedProviders = getSortedProviders();
  const totalPages = Math.ceil(sortedProviders.length / itemsPerPage);

  const paginatedProviders = sortedProviders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const availableServices = Array.from(
    new Set(
      providers.flatMap((provider) =>
        provider.services.map((service) => service.name)
      )
    )
  );

  // Remettre à la première page si filtre changé
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSpecialty, selectedTypes, filters.priceMax, sortBy]);

  // Rendu
  return (
    <DefaultTemplate>
      <div className="flex flex-col">
        {/* Barre de recherche principale */}
        <div className="bg-gradient-to-r from-[hsl(23,100%,53%)] to-[hsl(41,86%,46%)] py-6">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service
                  </label>
                  <div className="relative">
                    <select
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      value={selectedService}
                      onChange={handleServiceChange}
                    >
                      <option value="">Tous les services</option>
                      {availableServices.map((service, idx) => (
                        <option key={idx} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={20}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                  </div>
                </div>

                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays
                  </label>
                  <div className="relative">
                    <select
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      value={selectedCountry}
                      onChange={handleCountryChange}
                    >
                      <option value="">Tous les pays</option>
                      <option value="Cameroun">Cameroun</option>
                      <option value="Congo">Congo</option>
                      <option value="Senegal">Senegal</option>
                      <option value="Nigeria">Nigeria</option>
                    </select>
                    <ChevronDown
                      size={20}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                  </div>
                </div>

                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <div className="relative">
                    <select
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      value={selectedCity}
                      onChange={handleCityChange}
                    >
                      <option value="">Toutes les villes</option>
                      <option value="Douala">Douala</option>
                      <option value="Yaoundé">Yaoundé</option>
                      <option value="Bafoussam">Bafoussam</option>
                      <option value="Garoua">Garoua</option>
                    </select>
                    <ChevronDown
                      size={20}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                  </div>
                </div>

                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arrondissement
                  </label>
                  <div className="relative">
                    <select className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                      <option>Tous les quartiers</option>
                      <option>Akwa</option>
                      <option>Bonanjo</option>
                      <option>Bonapriso</option>
                      <option>Makepe</option>
                    </select>
                    <ChevronDown
                      size={20}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                  </div>
                </div>

                <button className="bg-[hsl(25,100%,53%)] text-white cursor-pointer rounded-md px-6 py-2 font-medium hover:bg-[hsl(25, 100%, 60%)] transition flex items-center justify-center self-end">
                  <Search size={18} className="mr-2" />
                  Rechercher
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filtres */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Filtres</h2>
                <div className="space-y-6">
                  {/* Spécialité */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Spécialité
                    </h3>
                    <select
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={filterSpecialty}
                      onChange={handleSpecialtyChange}
                    >
                      <option value="">Toutes les spécialités</option>
                      {specialties.map((specialty, index) => (
                        <option key={index} value={String(specialty)}>
                          {String(specialty)}
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
                            onChange={handleTypeChange}
                          />
                          <span className="ml-2 text-gray-700">
                            {type.value}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Prix */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Prix
                    </h3>
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
                        onChange={handlePriceMaxChange}
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
                    onChange={handleSortChange}
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
                  <div
                    key={provider.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                  >
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
                            <h3 className="text-xl font-semibold">
                              {provider.name}
                            </h3>
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
                                  className={`${
                                    star <= Math.floor(provider.rating)
                                      ? "text-amber-400"
                                      : "text-gray-300"
                                  }`}
                                  fill={
                                    star <= Math.floor(provider.rating)
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              ))}
                            </div>
                            <span className="text-gray-700">
                              {provider.rating} ({provider.reviews})
                            </span>
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
                          <h4 className="font-medium mb-2">
                            Services disponibles:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {provider.services.map((service, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                              >
                                {service.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div className="mb-2 sm:mb-0">
                            <span className="text-gray-500">
                              Prix à partir de:
                            </span>
                            <span className="text-2xl font-bold text-blue-700 ml-2">
                              {Math.min(
                                ...provider.services.map(
                                  (service) => service.price
                                )
                              )}{" "}
                              €
                            </span>
                          </div>

                          <button
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition cursor-pointer"
                            onClick={() => {
                              alert("Réserver un rendez-vous");
                            }}
                          >
                            Voir les détails
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
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
