/**
 * Types et interfaces pour le domaine BTP (Bâtiment et Travaux Publics)
 */

import type { Quote } from './quotes.types';

/**
 * Type pour créer un devis BTP (sans les champs générés automatiquement)
 */
export type CreateQuoteData = Omit<Quote, 'id' | '_id' | 'createdAt' | 'updatedAt'>;

/**
 * Type de propriété immobilière
 */
export type PropertyType = 'LAND' | 'HOUSE' | 'APARTMENT' | 'COMMERCIAL' | 'INDUSTRIAL';

/**
 * Statut d'une propriété
 */
export type PropertyStatus = 'FOR_SALE' | 'FOR_RENT' | 'SOLD' | 'RENTED' | 'UNDER_CONSTRUCTION';

/**
 * Propriété immobilière
 */
export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  currency: string;
  pricePerSqm?: number;
  area: number; // m²
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  yearBuilt?: number;
  location: {
    address: string;
    city: string;
    country: string;
    postalCode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    neighborhood?: string;
  };
  features: PropertyFeature[];
  images: PropertyImage[];
  documents: PropertyDocument[];
  owner: {
    id: string;
    name: string;
    type: 'INDIVIDUAL' | 'COMPANY';
    contact: {
      phone: string;
      email: string;
    };
  };
  agent?: {
    id: string;
    name: string;
    company: string;
    phone: string;
    email: string;
  };
  isActive: boolean;
  isFeatured: boolean;
  views: number;
  favorites: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Catégorie de caractéristique de propriété
 */
export type PropertyFeatureCategory = 'GENERAL' | 'EXTERIOR' | 'INTERIOR' | 'UTILITIES' | 'SECURITY';

/**
 * Caractéristique d'une propriété
 */
export interface PropertyFeature {
  category: PropertyFeatureCategory;
  name: string;
  value: string;
  icon?: string;
}

/**
 * Type d'image de propriété
 */
export type PropertyImageType = 'MAIN' | 'GALLERY' | 'FLOOR_PLAN' | 'VIRTUAL_TOUR';

/**
 * Image d'une propriété
 */
export interface PropertyImage {
  id: string;
  url: string;
  alt: string;
  type: PropertyImageType;
  order: number;
  isActive: boolean;
}

/**
 * Type de document de propriété
 */
export type PropertyDocumentType = 'TITLE_DEED' | 'SURVEY' | 'PERMIT' | 'CONTRACT' | 'OTHER';

/**
 * Document d'une propriété
 */
export interface PropertyDocument {
  id: string;
  name: string;
  type: PropertyDocumentType;
  url: string;
  size: number;
  uploadedAt: Date;
}

/**
 * Type de contractant
 */
export type ContractorType = 'GENERAL_CONTRACTOR' | 'SPECIALIST' | 'SUPPLIER';

/**
 * Contractant (entrepreneur, fournisseur)
 */
export interface Contractor {
  id: string;
  name: string;
  type: ContractorType;
  specialties: string[];
  description: string;
  experience: number; // years
  rating: number;
  reviewCount: number;
  location: {
    city: string;
    country: string;
    serviceRadius: number; // km
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  portfolio: Project[];
  certifications: Certification[];
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type de projet
 */
export type ProjectType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'RENOVATION';

/**
 * Statut d'un projet
 */
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

/**
 * Projet de construction
 */
export interface Project {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  budget: number;
  currency: string;
  duration: number; // months
  startDate: Date;
  endDate?: Date;
  images: string[];
  client: {
    name: string;
    type: 'INDIVIDUAL' | 'COMPANY';
  };
  location: {
    city: string;
    country: string;
  };
}

/**
 * Certification professionnelle
 */
export interface Certification {
  name: string;
  issuer: string;
  issuedAt: Date;
  expiresAt?: Date;
  documentUrl?: string;
}

/**
 * Catégorie de matériau
 */
export type MaterialCategory =
  | 'CONSTRUCTION'
  | 'FINISHING'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'ROOFING';

/**
 * Unité de mesure pour les matériaux
 */
export type MaterialUnit = 'PIECE' | 'SQM' | 'METER' | 'TON' | 'KG';

/**
 * Matériau de construction
 */
export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  description: string;
  specifications: Record<string, string>;
  price: number;
  currency: string;
  unit: MaterialUnit;
  supplier: {
    id: string;
    name: string;
    contact: {
      phone: string;
      email: string;
    };
  };
  availability: {
    inStock: boolean;
    quantity?: number;
    leadTime?: number; // days
  };
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type de projet de construction
 */
export type ConstructionProjectType = 'NEW_CONSTRUCTION' | 'RENOVATION' | 'EXTENSION' | 'REPAIR';

/**
 * Statut d'un projet de construction
 */
export type ConstructionProjectStatus =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED';

/**
 * Projet de construction complet
 */
export interface ConstructionProject {
  id: string;
  name: string;
  description: string;
  type: ConstructionProjectType;
  status: ConstructionProjectStatus;
  budget: number;
  currency: string;
  actualCost?: number;
  startDate: Date;
  expectedEndDate: Date;
  actualEndDate?: Date;
  clientId: string;
  contractorId?: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  milestones: ProjectMilestone[];
  materials: ProjectMaterial[];
  documents: ProjectDocument[];
  progress: number; // percentage
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Statut d'un jalon de projet
 */
export type ProjectMilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';

/**
 * Statut de paiement d'un jalon
 */
export type MilestonePaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

/**
 * Jalon de projet
 */
export interface ProjectMilestone {
  id: string;
  name: string;
  description: string;
  status: ProjectMilestoneStatus;
  dueDate: Date;
  completedDate?: Date;
  paymentAmount?: number;
  paymentStatus: MilestonePaymentStatus;
  dependencies?: string[]; // Other milestone IDs
}

/**
 * Statut d'un matériau de projet
 */
export type ProjectMaterialStatus = 'ORDERED' | 'DELIVERED' | 'USED' | 'RETURNED';

/**
 * Matériau utilisé dans un projet
 */
export interface ProjectMaterial {
  id: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplier: string;
  status: ProjectMaterialStatus;
  orderDate?: Date;
  deliveryDate?: Date;
}

/**
 * Type de document de projet
 */
export type ProjectDocumentType = 'PLAN' | 'PERMIT' | 'INVOICE' | 'RECEIPT' | 'PHOTO' | 'REPORT';

/**
 * Document de projet
 */
export interface ProjectDocument {
  id: string;
  name: string;
  type: ProjectDocumentType;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

/**
 * Filtres pour la recherche BTP
 */
export interface BTPFilters {
  query?: string;
  type?: string;
  status?: string;
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  rooms?: number;
  features?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
    radius: number; // km
  };
}

