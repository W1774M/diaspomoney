/**
 * Types pour le processus de réservation de service
 * Utilise les types et constantes centralisés
 */

import type { ServiceType } from './constants.types';
import type { BeneficiaryData } from './beneficiaries.types';
import type { ServiceOption } from './service-options.types';

// Réexporter le type ServiceType centralisé
export type { ServiceType };
// Réexporter ServiceOption pour compatibilité - IMPORTANT: doit être exporté explicitement
export type { ServiceOption } from './service-options.types';

export interface ClientInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}


export interface SelectedService {
  serviceId: string;
  category: string;
  label: string;
  description: string;
  price: number;
  options: ServiceOption[];
}

export interface ServiceBookingStep {
  step: number;
  title: string;
  isCompleted: boolean;
  isActive: boolean;
  isValid: boolean;
}

export interface ServiceBookingState {
  currentStep: number;
  serviceType: ServiceType | null;
  clientInfo: Partial<ClientInfo>;
  beneficiaryInfo: Partial<BeneficiaryData>;
  selectedService: SelectedService | null;
  additionalOptions: ServiceOption[];
  paymentIntentId: string | null;
  paymentConfirmed: boolean; // Indique si le paiement a été confirmé avec succès
  availability: AppointmentAvailability;
  totalAmount: number;
}

export interface ServiceBookingFacadeData {
  serviceType: ServiceType;
  clientInfo: ClientInfo;
  beneficiaryInfo: BeneficiaryData;
  selectedService: SelectedService;
  additionalOptions: ServiceOption[];
  paymentIntentId: string;
  appointmentDate?: string;
  appointmentTime?: string;
  metadata?: Record<string, any>;
}

export interface ServiceBookingFacadeResult {
  success: boolean;
  bookingId?: string;
  reservationNumber?: string;
  booking?: {
    id: string;
    _id: string;
    reservationNumber?: string;
    [key: string]: any;
  };
  transactionId?: string;
  paymentIntentId?: string;
  message?: string;
  error?: string;
}

/**
 * Type pour les disponibilités de rendez-vous
 * Utilisé uniquement pour le type HEALTH
 */
export interface AppointmentAvailability {
  selectedDate: string | null;
  selectedTime: string | null;
}

/**
 * Props pour le composant ServiceBookingWizard
 */
export interface ServiceBookingWizardProps {
  initialServiceType?: ServiceType;
  onComplete?: (bookingId: string) => void;
  onCancel?: () => void;
}

/**
 * Type pour les données de requête de réservation
 */
export interface ServiceBookingRequestData {
  serviceType: ServiceType;
  clientInfo: ClientInfo;
  beneficiaryInfo: BeneficiaryData;
  selectedService: SelectedService;
  additionalOptions: ServiceOption[];
  paymentIntentId: string;
  appointmentDate?: string;
  appointmentTime?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Type pour les erreurs de validation API
 */
export interface ValidationError {
  path?: (string | number)[];
  message: string;
  code?: string;
}

/**
 * Type pour la réponse API de création de réservation
 */
export interface ServiceBookingApiResponse {
  success: boolean;
  bookingId?: string;
  booking?: {
    id?: string;
    _id?: string;
    reservationNumber?: string;
  };
  reservationNumber?: string;
  error?: string | ValidationError | Record<string, unknown>;
  message?: string;
  errors?: (string | ValidationError)[];
}

