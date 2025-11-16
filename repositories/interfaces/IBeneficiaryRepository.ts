/**
 * Interface du repository pour les bénéficiaires
 */

import type { Beneficiary, BeneficiaryFilters } from '@/types/beneficiaries';
import {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';

export interface IBeneficiaryRepository
  extends IPaginatedRepository<Beneficiary> {
  /**
   * Trouver tous les bénéficiaires d'un payeur
   */
  findByPayer(
    payerId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Beneficiary>>;

  /**
   * Trouver les bénéficiaires actifs d'un payeur
   */
  findActiveByPayer(
    payerId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Beneficiary>>;

  /**
   * Trouver les bénéficiaires avec filtres avancés
   */
  findBeneficiariesWithFilters(
    filters: BeneficiaryFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Beneficiary>>;

  /**
   * Compter les bénéficiaires d'un payeur
   */
  countByPayer(payerId: string): Promise<number>;

  /**
   * Désactiver un bénéficiaire
   */
  deactivate(beneficiaryId: string, payerId: string): Promise<boolean>;
}
