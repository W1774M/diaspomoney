/**
 * Types utilisateur - DiaspoMoney
 */

import { BaseEntity } from './index';

// === TYPES UTILISATEUR ===
export interface User extends BaseEntity {
  email: string;
  name: string;
  phone?: string;
  company?: string;
  address?: string;
  roles: UserRole[];
  status: UserStatus;
  specialty?: string;
  recommended: boolean;
  providerInfo?: ProviderInfo;
  apiGeo?: ApiGeo[];
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PROVIDER = 'PROVIDER',
  CUSTOMER = 'CUSTOMER',
  BENEFICIARY = 'BENEFICIARY',
  CSM = 'CSM'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED'
}

export enum ProviderType {
  INDIVIDUAL = 'INDIVIDUAL',
  INSTITUTION = 'INSTITUTION'
}

export enum ProviderCategory {
  HEALTH = 'HEALTH',
  BTP = 'BTP',
  EDUCATION = 'EDUCATION'
}

export interface ProviderInfo {
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
  availability: Availability;
  pricing: Pricing;
  documents: Document[];
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
  website: string;
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

export interface Availability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
  timezone: string;
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
  CUSTOM = 'CUSTOM'
}

export interface Discount {
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  conditions: string;
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
  OTHER = 'OTHER'
}

export interface ApiGeo {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
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
  roles?: UserRole[];
  status?: UserStatus[];
  category?: ProviderCategory[];
  type?: ProviderType[];
  isVerified?: boolean;
  search?: string;
}

// === TYPES DE RÉPONSES ===
export interface UserResponse {
  user: User;
  message: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}
