/**
 * Types et interfaces pour les bénéficiaires
 */

import { BaseEntity } from './index';

/**
 * Relation avec le payeur
 */
export type BeneficiaryRelationship =
  | 'PARENT'
  | 'CHILD'
  | 'SPOUSE'
  | 'SIBLING'
  | 'FRIEND'
  | 'OTHER';

/**
 * Données pour créer un bénéficiaire
 */
export interface BeneficiaryData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  relationship: BeneficiaryRelationship;
  country: string;
  address?: string;
}

/**
 * Bénéficiaire complet
 */
export interface Beneficiary extends BaseEntity, BeneficiaryData {
  id: string;
  payerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Filtres pour la recherche de bénéficiaires
 */
export interface BeneficiaryFilters {
  payerId?: string;
  isActive?: boolean;
  relationship?: BeneficiaryRelationship;
  country?: string;
  searchTerm?: string;
}
