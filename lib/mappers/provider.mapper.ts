/**
 * Mappers pour les prestataires/providers
 * Transforme les documents provider en réponses API
 */

import type { IMapper, MappingOptions } from '@/lib/types';
import { ProviderType } from '@/lib/types/user.types';

/**
 * Type pour un document Provider MongoDB
 */
export interface ProviderDocument {
  _id?: any;
  id?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  address?: string;
  roles?: string[];
  status?: string;
  specialty?: string;
  recommended?: boolean;
  providerInfo?: Record<string, any>;
  avatar?: {
    image?: string;
    name?: string;
  } | string;
  type?: string | string[];
  profileImage?: string;
  images?: string[];
  services?: Array<{
    id?: string;
    name?: string;
    description?: string;
    price?: number;
  }>;
  availability?: Record<string, any>;
  rating?: number;
  reviewCount?: number;
  specialties?: string[];
  isActive?: boolean;
  city?: string;
  metadata?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

/**
 * Type pour une réponse API de provider
 */
export interface ProviderResponse {
  id: string;
  _id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  address?: string;
  roles: string[];
  status: string;
  specialty?: string;
  recommended: boolean;
  providerInfo?: Record<string, any>;
  avatar?: {
    image: string;
    name: string;
  };
  type: ProviderType | ProviderType[];
  profileImage?: string;
  images?: string[];
  services?: Array<{
    id: string;
    name: string;
    description?: string;
    price?: number;
  }>;
  availability?: Record<string, any>;
  rating?: number;
  reviewCount?: number;
  specialties?: string[];
  isActive?: boolean;
  city?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convertit une date en ISO string de manière sécurisée
 */
function toISOString(date: Date | string | undefined | null): string {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  try {
    return new Date(date as string | number).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Mappe le type de provider
 */
function mapType(type: string | string[] | undefined): ProviderType | ProviderType[] {
  if (!type) return ProviderType.INDIVIDUAL;
  
  if (Array.isArray(type)) {
    return type.map(t => t.toUpperCase() as ProviderType);
  }
  
  return type.toUpperCase() as ProviderType;
}

/**
 * Mappe l'avatar
 */
function mapAvatar(avatar: { image?: string; name?: string } | string | undefined, name?: string): { image: string; name: string } | undefined {
  if (!avatar) return undefined;
  
  if (typeof avatar === 'string') {
    return {
      image: avatar,
      name: name || '',
    };
  }
  
  if (typeof avatar === 'object') {
    return {
      image: avatar.image || '',
      name: avatar.name || name || '',
    };
  }
  
  return undefined;
}

/**
 * Classe ProviderMapper implémentant IMapper
 */
export class ProviderMapper implements IMapper<ProviderDocument, ProviderResponse> {
  /**
   * Transforme un document provider vers une réponse API
   */
  map(input: ProviderDocument, options?: MappingOptions): ProviderResponse {
    return mapProviderToResponse(input, options);
  }

  /**
   * Transforme un tableau de documents provider
   */
  mapMany(inputs: ProviderDocument[], options?: MappingOptions): ProviderResponse[] {
    return inputs.map((input) => this.map(input, options));
  }
}

/**
 * Instance singleton du mapper
 */
export const providerMapper = new ProviderMapper();

/**
 * Mappe un document provider vers une réponse API
 * 
 * @param providerDoc - Document provider depuis le repository
 * @param options - Options de mapping
 * @returns Réponse API formatée
 */
export function mapProviderToResponse(
  providerDoc: ProviderDocument,
  _options?: MappingOptions,
): ProviderResponse {
  // Extraire l'ID
  const id = providerDoc.id || providerDoc._id?.toString() || '';
  const _id = providerDoc._id?.toString() || id;

  // Générer le nom complet si non fourni
  const firstName = providerDoc.firstName || '';
  const lastName = providerDoc.lastName || '';
  const name = providerDoc.name || `${firstName} ${lastName}`.trim() || providerDoc.email || '';
  const avatarValue = mapAvatar(providerDoc.avatar, name);

  // Construire l'objet de base
  const baseResponse: ProviderResponse = {
    id,
    _id,
    email: providerDoc.email || '',
    name,
    roles: providerDoc.roles || [],
    status: providerDoc.status || 'ACTIVE',
    recommended: providerDoc.recommended ?? false,
    type: mapType(providerDoc.type),
    isActive: providerDoc.isActive ?? true,
    createdAt: toISOString(providerDoc.createdAt),
    updatedAt: toISOString(providerDoc.updatedAt),
  };

  // Ajouter les propriétés optionnelles seulement si elles ont une valeur
  if (firstName) baseResponse.firstName = firstName;
  if (lastName) baseResponse.lastName = lastName;
  if (providerDoc.phone) baseResponse.phone = providerDoc.phone;
  if (providerDoc.company) baseResponse.company = providerDoc.company;
  if (providerDoc.address) baseResponse.address = providerDoc.address;
  if (providerDoc.specialty) baseResponse.specialty = providerDoc.specialty;
  if (providerDoc.providerInfo) baseResponse.providerInfo = providerDoc.providerInfo;
  if (avatarValue) baseResponse.avatar = avatarValue;
  if (providerDoc.profileImage) baseResponse.profileImage = providerDoc.profileImage;
  if (providerDoc.images && providerDoc.images.length > 0) baseResponse.images = providerDoc.images;
  if (providerDoc.services && providerDoc.services.length > 0) {
    baseResponse.services = providerDoc.services.map(service => ({
      id: service.id || '',
      name: service.name || '',
      ...(service.description && { description: service.description }),
      ...(service.price !== undefined && { price: service.price }),
    }));
  }
  if (providerDoc.availability) baseResponse.availability = providerDoc.availability;
  if (providerDoc.rating !== undefined) baseResponse.rating = providerDoc.rating;
  if (providerDoc.reviewCount !== undefined) baseResponse.reviewCount = providerDoc.reviewCount;
  if (providerDoc.specialties && providerDoc.specialties.length > 0) baseResponse.specialties = providerDoc.specialties;
  if (providerDoc.city) baseResponse.city = providerDoc.city;
  if (providerDoc.metadata) baseResponse.metadata = providerDoc.metadata;

  return baseResponse;
}

