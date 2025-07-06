export interface Service {
  id?: number;
  name: string;
  price: number;
}

export interface ProviderType {
  id: string | number;
  name: string;
  type: { id: string | number; value: string; group: string };
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
  reviews?: number;
  distance?: string;
  services: Service[];
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  availabilities?: string[];
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

export interface AppointmentInterface {
  requester: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  recipient: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  provider: ProviderType;
  selectedService: { id: number; name: string; price: number } | null;
  timeslot: string;
}

export interface paymentDataInterface {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}
