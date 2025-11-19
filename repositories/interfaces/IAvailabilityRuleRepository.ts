/**
 * Interface du repository pour les règles de disponibilité
 */

import type { AvailabilityRule } from '@/lib/types/availability.types';
import {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';

export interface AvailabilityRuleFilters {
  userId?: string;
  type?: 'weekly' | 'monthly' | 'custom';
  isActive?: boolean;
}

export interface IAvailabilityRuleRepository
  extends IPaginatedRepository<AvailabilityRule> {
  /**
   * Trouver toutes les règles de disponibilité d'un utilisateur
   */
  findByUserId(
    userId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<AvailabilityRule>>;

  /**
   * Trouver les règles actives d'un utilisateur
   */
  findActiveByUserId(
    userId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<AvailabilityRule>>;

  /**
   * Trouver les règles avec filtres avancés
   */
  findRulesWithFilters(
    filters: AvailabilityRuleFilters,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<AvailabilityRule>>;

  /**
   * Compter les règles d'un utilisateur
   */
  countByUserId(userId: string): Promise<number>;
}

