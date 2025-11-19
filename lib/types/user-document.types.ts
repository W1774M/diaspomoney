/**
 * Types pour les documents utilisateur MongoDB - DiaspoMoney
 * 
 * Ce fichier contient les types spécifiques aux documents utilisateur
 * tels qu'ils sont stockés dans MongoDB, avec support pour _id/id,
 * et les types pour les opérations de filtrage et mise à jour.
 */

import { User, UserRole, UserStatus } from './user.types';

/**
 * Document utilisateur tel qu'il est stocké dans MongoDB
 * Supporte à la fois _id (MongoDB) et id (string)
 */
export interface UserDocument extends Omit<Partial<User>, 'preferences' | '_id' | 'createdAt' | 'updatedAt' | 'roles' | 'providerInfo' | 'apiGeo'> {
  // Identifiants (support MongoDB et string)
  _id?:
    | string
    | {
        toString(): string;
      };
  id?: string;

  // Champs de base
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  address?: string;
  country?: string;
  countryOfResidence?: string;
  targetCountry?: string;
  targetCity?: string;

  // Rôles et statut
  roles?: UserRole[] | string[];
  status?: UserStatus;

  // Champs spécifiques
  specialty?: string;
  recommended?: boolean;
  clientNotes?: string;
  monthlyBudget?: number;
  annualBudget?: number;

  // Avatar et préférences
  avatar?: string | { image: string; name: string };
  // preferences est hérité de Partial<User> mais doit être compatible
  // On utilise Omit pour exclure preferences de Partial<User> et le redéfinir
  preferences?: {
    language?: string;
    timezone?: string;
    notifications?: boolean;
  };

  // OAuth
  oauth?: {
    google?: {
      linked?: boolean;
      providerAccountId?: string;
    };
    facebook?: {
      linked?: boolean;
      providerAccountId?: string;
    };
  };

  // Provider info
  providerInfo?: Record<string, unknown>;

  // Dates
  dateOfBirth?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  lastLogin?: Date | string;

  // Email verification
  emailVerified?: boolean;
  isEmailVerified?: boolean;

  // Consentements
  marketingConsent?: boolean;
  kycConsent?: boolean;
  kycStatus?: string;

  // Sécurité
  password?: string;
  securityQuestion?: string;
  securityAnswer?: string;

  // Images
  images?: string[];

  // Services sélectionnés
  selectedServices?: string[];

  // API Geo
  apiGeo?: Array<Record<string, unknown>>;

  // Champs dynamiques (pour compatibilité)
  [key: string]: unknown;
}

/**
 * Filtres pour rechercher des utilisateurs
 */
export interface UserFilters {
  role?: string;
  roles?: UserRole[] | string[];
  status?: string | UserStatus;
  statuses?: UserStatus[] | string[];
  search?: string;
  searchTerm?: string;
  category?: string;
  type?: string;
  isVerified?: boolean;
  limit?: number;
  offset?: number;
  page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: unknown;
}

/**
 * Données pour mettre à jour un utilisateur
 */
export interface UserUpdateData {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  country?: string;
  countryOfResidence?: string;
  targetCountry?: string;
  targetCity?: string;
  roles?: UserRole[] | string[];
  status?: UserStatus | string;
  specialty?: string;
  recommended?: boolean;
  clientNotes?: string;
  monthlyBudget?: number;
  annualBudget?: number;
  avatar?: string | { image: string; name: string };
  preferences?: {
    language?: string;
    timezone?: string;
    notifications?: boolean;
  };
  providerInfo?: Record<string, unknown>;
  dateOfBirth?: Date | string;
  marketingConsent?: boolean;
  kycConsent?: boolean;
  images?: string[];
  selectedServices?: string[];
  [key: string]: unknown;
}

/**
 * Réponse API pour un utilisateur
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
  address: string;
  roles: string[];
  status: string;
  avatar: {
    image: string;
    name: string;
  };
  oauth: {
    google: {
      linked?: boolean;
    };
    facebook: {
      linked?: boolean;
    };
  };
  specialty: string;
  recommended: boolean;
  providerInfo: Record<string, unknown>;
  preferences: {
    language: string;
    timezone: string;
    notifications: boolean;
  };
  dateOfBirth: string | null;
  countryOfResidence: string;
  targetCountry: string;
  targetCity: string;
  monthlyBudget: string;
  marketingConsent: boolean;
  kycConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

