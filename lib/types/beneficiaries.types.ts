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
export interface Beneficiary extends Omit<BaseEntity, '_id'>, BeneficiaryData {
  id: string;
  _id: string; // Requis pour BaseEntity
  payerId: string;
  isActive: boolean;
  name?: string; // Nom complet (dérivé de firstName + lastName)
  hasAccount?: boolean; // Indique si le bénéficiaire a un compte
  status?: string; // Statut du bénéficiaire
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
  hasAccount?: boolean; // Filtrer par présence de compte
}

/**
 * Données pour le formulaire de bénéficiaire
 */
export interface BeneficiaryFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  relationship: BeneficiaryRelationship;
  country: string;
  address?: string;
}

/**
 * Props pour le header des bénéficiaires
 */
export interface BeneficiariesHeaderProps {
  onAddBeneficiary: () => void;
}

/**
 * Props pour le composant de recherche de bénéficiaires
 */
export interface BeneficiariesSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

/**
 * Props pour le composant de tableau des bénéficiaires
 */
export interface BeneficiariesTableProps {
  beneficiaries: Beneficiary[];
  loading: boolean;
  error: string | null;
  onEdit: (beneficiary: Beneficiary) => void;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Props pour le composant de carte de bénéficiaire
 */
export interface BeneficiaryCardProps {
  beneficiary: Beneficiary;
  onEdit: (beneficiary: Beneficiary) => void;
  onDelete: (id: string) => Promise<void>;
}

/**
 * Statistiques des bénéficiaires
 */
export interface BeneficiaryStats {
  total: number;
  active: number;
  inactive: number;
  withAccount: number;
  withoutAccount: number;
  byRelationship: Record<string, number>;
  byCountry: Record<string, number>;
}