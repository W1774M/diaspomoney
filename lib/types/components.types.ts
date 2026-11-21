/**
 * Types et interfaces pour les composants React
 */

import type { ProviderType } from './user.types';

/**
 * Props pour le formulaire de devis BTP
 */
export interface BTPQuoteFormProps {
  provider?: {
    id: string;
    name: string;
    type: ProviderType;
    specialties: string[];
    rating: number;
    reviewCount: number;
    contact: {
      phone: string;
      email: string;
    };
  };
}

/**
 * Données du formulaire de devis
 */
export interface QuoteFormData {
  projectType: string;
  area: number | string;
  features: string[];
  budget: number | string;
  timeline: string;
  location: {
    city: string;
    country: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  description: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
}

