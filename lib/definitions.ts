export interface Service {
  name: string;
  price: number;
}

export interface ProviderType {
  id: string | number;
  name: string;
  type: { id: string | number; value: string };
  specialty: string;
  recommended: boolean;
  apiGeo: {
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    lat: string;
    lon: string;
    class: string;
    type: string;
    place_rank: number;
    importance: number;
    addresstype: string;
    name: string;
    display_name: string;
    boundingbox: string[];
  }[];
  images: string[];
  rating: number;
  services: Service[];
}

export interface ProviderCardProps {
  provider: ProviderType;
  onDetails: () => void;
}

export interface FiltersProps {
  specialties: string[];
  filterSpecialty: string;
  setFilterSpecialty: (value: string) => void;
  providerTypes: { id: string | number; value: string }[];
  selectedTypes: string[];
  setSelectedTypes: (value: string[]) => void;
  filters: { priceMin: number; priceMax: number };
  setFilters: (filters: { priceMin: number; priceMax: number }) => void;
  resetFilters: () => void;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

export interface SearchBarProps {
  availableServices: string[];
  selectedService: string;
  setSelectedService: (value: string) => void;
  countries: string[];
  selectedCountry: string;
  setSelectedCountry: (value: string) => void;
  selectedCity: string;
  setSelectedCity: (value: string) => void;
}
