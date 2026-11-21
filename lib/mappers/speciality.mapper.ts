/**
 * Mappers pour les spécialités
 * Transforme les documents speciality en réponses API
 */

import type { IMapper, MappingOptions } from '@/lib/types';
// ISpeciality type is used in the function signatures

/**
 * Type pour un document Speciality MongoDB
 */
export interface SpecialityDocument {
  _id?: any;
  id?: string;
  name?: string;
  description?: string;
  group?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

/**
 * Type pour une réponse API de speciality
 */
export interface SpecialityResponse {
  id: string;
  _id: string;
  name: string;
  description: string;
  group: string;
  isActive: boolean;
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
 * Classe SpecialityMapper implémentant IMapper
 */
export class SpecialityMapper implements IMapper<SpecialityDocument, SpecialityResponse> {
  /**
   * Transforme un document speciality vers une réponse API
   */
  map(input: SpecialityDocument, options?: MappingOptions): SpecialityResponse {
    return mapSpecialityToResponse(input, options);
  }

  /**
   * Transforme un tableau de documents speciality
   */
  mapMany(inputs: SpecialityDocument[], options?: MappingOptions): SpecialityResponse[] {
    return inputs.map((input) => this.map(input, options));
  }
}

/**
 * Instance singleton du mapper
 */
export const specialityMapper = new SpecialityMapper();

/**
 * Mappe un document speciality vers une réponse API
 * 
 * @param specialityDoc - Document speciality depuis le repository
 * @param options - Options de mapping
 * @returns Réponse API formatée
 */
export function mapSpecialityToResponse(
  specialityDoc: SpecialityDocument,
  _options?: MappingOptions,
): SpecialityResponse {
  // Extraire l'ID
  const id = specialityDoc.id || specialityDoc._id?.toString() || '';
  const _id = specialityDoc._id?.toString() || id;

  return {
    id,
    _id,
    name: specialityDoc.name || '',
    description: specialityDoc.description || '',
    group: specialityDoc.group || '',
    isActive: specialityDoc.isActive ?? true,
    ...(specialityDoc.metadata && { metadata: specialityDoc.metadata }),
    createdAt: toISOString(specialityDoc.createdAt),
    updatedAt: toISOString(specialityDoc.updatedAt),
  };
}

