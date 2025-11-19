import { Provider } from "@/hooks/useProviders";
import { Environment } from ".";

// Services Types and Interfaces

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ServiceConfig {
  name: string;
  version: string;
  environment: Environment;
  config?: Record<string, any>;
}

export interface ServiceFilters {
  service: string;
  city: string;
  specialty: string;
  rating: number;
  category: string;
}

export interface ServiceSearchParams {
  service?: string;
  city?: string;
  specialty?: string;
  rating?: string;
}

export interface ServiceStats {
  totalProviders: number;
  activeProviders: number;
  specialties: string[];
  services: string[];
}

export interface ServiceCardProps {
  provider: Provider;
  onDetails: () => void;
}

export interface ServiceSearchBarProps {
  availableServices: string[];
  selectedService: string;
  setSelectedService: (value: string) => void;
  selectedCity: string;
  setSelectedCity: (value: string) => void;
}

export interface ServiceFiltersProps {
  specialties: string[];
  selectedSpecialty: string;
  setSelectedSpecialty: (value: string) => void;
  minRating: number;
  setMinRating: (value: number) => void;
}

export interface ServiceProviderListProps {
  providers: Provider[];
  loading: boolean;
  error: string | null;
  onProviderSelect: (provider: Provider) => void;
}
