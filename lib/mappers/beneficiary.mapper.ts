/**
 * Mappers pour les bénéficiaires
 * Transforme les documents beneficiary en réponses API
 */

import type { IMapper, MappingOptions } from '@/lib/types';
import type { BeneficiaryRelationship } from '@/lib/types/beneficiaries.types';
// Beneficiary type is used in the function signatures

/**
 * Type pour un document Beneficiary MongoDB
 */
export interface BeneficiaryDocument {
  _id?: any;
  id?: string;
  payerId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  relationship?: string;
  country?: string;
  address?: string;
  isActive?: boolean;
  hasAccount?: boolean;
  status?: string;
  name?: string;
  metadata?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

/**
 * Type pour une réponse API de beneficiary
 */
export interface BeneficiaryResponse {
  id: string;
  _id: string;
  payerId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  relationship: BeneficiaryRelationship;
  country: string;
  address?: string;
  isActive: boolean;
  hasAccount?: boolean;
  status?: string;
  name?: string;
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
 * Mappe la relation
 */
function mapRelationship(relationship: string | undefined): BeneficiaryRelationship {
  if (!relationship) return 'OTHER';
  
  const relationshipMap: Record<string, BeneficiaryRelationship> = {
    parent: 'PARENT',
    child: 'CHILD',
    spouse: 'SPOUSE',
    sibling: 'SIBLING',
    friend: 'FRIEND',
    other: 'OTHER',
  };
  
  const normalizedRelationship = relationship.toUpperCase();
  return (relationshipMap[normalizedRelationship.toLowerCase()] || normalizedRelationship) as BeneficiaryRelationship;
}

/**
 * Classe BeneficiaryMapper implémentant IMapper
 */
export class BeneficiaryMapper implements IMapper<BeneficiaryDocument, BeneficiaryResponse> {
  /**
   * Transforme un document beneficiary vers une réponse API
   */
  map(input: BeneficiaryDocument, options?: MappingOptions): BeneficiaryResponse {
    return mapBeneficiaryToResponse(input, options);
  }

  /**
   * Transforme un tableau de documents beneficiary
   */
  mapMany(inputs: BeneficiaryDocument[], options?: MappingOptions): BeneficiaryResponse[] {
    return inputs.map((input) => this.map(input, options));
  }
}

/**
 * Instance singleton du mapper
 */
export const beneficiaryMapper = new BeneficiaryMapper();

/**
 * Mappe un document beneficiary vers une réponse API
 * 
 * @param beneficiaryDoc - Document beneficiary depuis le repository
 * @param options - Options de mapping
 * @returns Réponse API formatée
 */
export function mapBeneficiaryToResponse(
  beneficiaryDoc: BeneficiaryDocument,
  _options?: MappingOptions,
): BeneficiaryResponse {
  // Extraire l'ID
  const id = beneficiaryDoc.id || beneficiaryDoc._id?.toString() || '';
  const _id = beneficiaryDoc._id?.toString() || id;

  // Générer le nom complet si non fourni
  const firstName = beneficiaryDoc.firstName || '';
  const lastName = beneficiaryDoc.lastName || '';
  const name = beneficiaryDoc.name || `${firstName} ${lastName}`.trim() || '';

  return {
    id,
    _id,
    payerId: beneficiaryDoc.payerId || '',
    firstName,
    lastName,
    ...(beneficiaryDoc.email && { email: beneficiaryDoc.email }),
    ...(beneficiaryDoc.phone && { phone: beneficiaryDoc.phone }),
    relationship: mapRelationship(beneficiaryDoc.relationship),
    country: beneficiaryDoc.country || '',
    ...(beneficiaryDoc.address && { address: beneficiaryDoc.address }),
    isActive: beneficiaryDoc.isActive ?? true,
    ...(beneficiaryDoc.hasAccount !== undefined && { hasAccount: beneficiaryDoc.hasAccount }),
    ...(beneficiaryDoc.status && { status: beneficiaryDoc.status }),
    ...(name && { name }),
    ...(beneficiaryDoc.metadata && { metadata: beneficiaryDoc.metadata }),
    createdAt: toISOString(beneficiaryDoc.createdAt),
    updatedAt: toISOString(beneficiaryDoc.updatedAt),
  };
}

