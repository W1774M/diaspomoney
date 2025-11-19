/**
 * Types utilisateur - DiaspoMoney
 */

import { BaseEntity, Service } from './index';

export type IUser = User;

 

// === TYPES UTILISATEUR ===
export interface User extends BaseEntity {
  id: string; // Alias pour _id
  clientNotes?: string;
  avatar?: any;
  preferences?: { language?: string; timezone?: string; notifications?: boolean };
  email: string;
  name: string;
  firstName?: string; // Prénom
  lastName?: string; // Nom de famille
  phone?: string;
  company?: string;
  address?: string;
  roles: UserRole[];
  status: UserStatus;
  specialty?: string;
  specialties?: string[]; // Spécialités (pour les providers)
  recommended?: boolean;
  providerInfo?: ProviderInfo;
  apiGeo?: ApiGeo[];
  selectedServices?: string[];
  availabilities?: Availability[];
  category?: string;
  type?: string;
  acceptsFirstConsultation?: boolean;
  acceptsVideoConsultation?: boolean;
  [key: string]: any; // Index signature pour compatibilité
}

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  PROVIDER = 'PROVIDER',
  CUSTOMER = 'CUSTOMER',
  BENEFICIARY = 'BENEFICIARY',
  CSM = 'CSM',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}

export enum ProviderType {
  INDIVIDUAL = 'INDIVIDUAL',
  INSTITUTION = 'INSTITUTION',
}

export enum ProviderCategory {
  HEALTH = 'HEALTH',
  BTP = 'BTP',
  EDUCATION = 'EDUCATION',
}

export const USER_ROLES = Object.values(UserRole);
export const USER_STATUSES = Object.values(UserStatus);
export const PROVIDER_TYPES = Object.values(ProviderType);
export const PROVIDER_CATEGORIES = Object.values(ProviderCategory);

// === TYPES USER ROLE EXTENDED ===
export interface UserRoleExtended {
  value: string;
  label: string;
}

// === TYPES USER STATUS EXTENDED ===
export interface UserStatusExtended {
  value: string;
  label: string;
}

// ProviderInfo is an extension of User to avoid duplication but overridable properties are made optional for flexibility
export interface ProviderInfo extends User {
  type: ProviderType;
  category: ProviderCategory;
  specialties: string[];
  description?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  institution?: InstitutionInfo;
  individual?: IndividualInfo;
  professionalContact?: ProfessionalContact;
  professionalAddress?: ProfessionalAddress;
  availability?: Availability;
  pricing?: Pricing;
  documents: Document[];
  profileImage?: string;
  specialty?: string;
  company?: string;
  recommended?: boolean;
  address?: string;
  appointments?: { start: string; end: string }[];
  images?: string[];
  services?: Service[];
}

export interface InstitutionInfo {
  legalName: string;
  registrationNumber: string;
  taxId: string;
  establishedYear: number;
  employees: number;
  certifications: string[];
}

export interface IndividualInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  qualifications: string[];
  experience: number;
  languages: string[];
}

export interface ProfessionalContact {
  phone: string;
  email: string;
  website?: string;
}

export interface ProfessionalAddress {
  street: string;
  city: string;
  country: string;
  postalCode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// Unified, minimal, and valid Availability type for all uses
export interface Availability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
  timezone?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  isAvailable: boolean;
  maxBookings: number;
  currentBookings: number;
}

export interface Pricing {
  basePrice: number;
  currency: string;
  pricingModel: PricingModel;
  discounts: Discount[];
}

export enum PricingModel {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
  PER_SQM = 'PER_SQM',
  CUSTOM = 'CUSTOM',
}

export interface Discount {
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  conditions?: string;
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  uploadedAt: Date;
  expiresAt?: Date;
}

export enum DocumentType {
  LICENSE = 'LICENSE',
  CERTIFICATE = 'CERTIFICATE',
  INSURANCE = 'INSURANCE',
  PORTFOLIO = 'PORTFOLIO',
  OTHER = 'OTHER',
}

export interface ApiGeo {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  [key: string]: unknown; // Index signature pour compatibilité
  display_name: string;
  class: string;
  type: string;
  importance: number;
}

// === TYPES DE REQUÊTES ===
export interface CreateUserRequest {
  email: string;
  name: string;
  phone?: string;
  company?: string;
  address?: string;
  roles?: UserRole[];
  providerInfo?: Partial<ProviderInfo>;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  company?: string;
  address?: string;
  status?: UserStatus;
  providerInfo?: Partial<ProviderInfo>;
}

export interface UserFilters {
  role?: string;
  email?: string;
  country?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  kycStatus?: string;
  specialty?: string;
  city?: string;
  roles?: UserRole[];
  status?: UserStatus[];
  category?: ProviderCategory[];
  type?: ProviderType[];
  isVerified?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

// === TYPES DE RÉPONSES ===
export interface UserApiResponse {
  user: User;
  message: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

 // === TYPES PROVIDER ===
 export interface ProviderService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

// === TYPES UI ===
/**
 * Type pour les couleurs de rôle (utilisé dans les composants UI)
 */
export type RoleColor =
  | 'bg-red-100 text-red-800'
  | 'bg-purple-100 text-purple-800'
  | 'bg-[hsl(25,100%,53%)]/10 text-[hsl(25,100%,53%)]'
  | 'bg-blue-100 text-blue-800'
  | 'bg-gray-100 text-gray-800';

/**
 * Type pour les couleurs de statut (utilisé dans les composants UI)
 */
export type StatusColor =
  | 'bg-green-100 text-green-800'
  | 'bg-red-100 text-red-800'
  | 'bg-yellow-100 text-yellow-800'
  | 'bg-gray-100 text-gray-800';

/**
 * Interface pour les données du formulaire d'édition d'utilisateur
 */
export interface UserEditFormData {
  email: string;
  name: string;
  phone: string;
  company: string;
  address: string;
  roles: string[];
  status: string;
  specialty: string;
  recommended: boolean;
  clientNotes: string;
  avatar: string;
  preferences: {
    language: string;
    timezone: string;
    notifications: boolean;
  };
}

/**
 * Interface pour les statistiques utilisateur
 */
export interface UserStatistics {
  invoices: number;
  tasks: number;
  projects: number;
}

export interface UseProviderReturn {
  provider: IUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}


// === TYPES USER EXTENDED ===
export interface UserExtended extends IUser {
  clientNotes?: string;
  avatar?: any;
  preferences?: { language: string; timezone: string; notifications: boolean };
  availabilities?: Availability[];
  selectedServices?: string[];
  category?: string;
  type?: string;
  acceptsFirstConsultation?: boolean;
  acceptsVideoConsultation?: boolean;
}

export interface CreateUserInput {
  [x: string]: any;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  avatar?: string;
  preferences?: Record<string, any>;
  clientNotes?: string;
  selectedServices?: string[];
  category?: string;
  availabilities?: Availability[];
  // Optional extras used by forms
  company?: string;
  address?: string;
  specialty?: string;
  roles?: UserRole[];
}