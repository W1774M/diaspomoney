/**
 * Interface du repository pour les providers de santé
 */

import {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';
import type { HealthProvider } from '@/lib/types';

// Re-export pour compatibilité
export type { HealthProvider };

export interface HealthProviderFilters {
  type?: 'DOCTOR' | 'HOSPITAL' | 'PHARMACY' | 'CLINIC';
  specialties?: string[];
  city?: string;
  country?: string;
  languages?: string[];
  isActive?: boolean;
  minRating?: number;
  [key: string]: any;
}

export interface IHealthProviderRepository
  extends IPaginatedRepository<HealthProvider, string> {
  /**
   * Trouver des providers par type
   */
  findByType(
    type: 'DOCTOR' | 'HOSPITAL' | 'PHARMACY' | 'CLINIC',
    options?: PaginationOptions
  ): Promise<PaginatedResult<HealthProvider>>;

  /**
   * Trouver des providers par spécialité
   */
  findBySpecialty(
    specialty: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<HealthProvider>>;

  /**
   * Trouver des providers par ville
   */
  findByCity(
    city: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<HealthProvider>>;

  /**
   * Trouver des providers actifs
   */
  findActive(
    options?: PaginationOptions
  ): Promise<PaginatedResult<HealthProvider>>;

  /**
   * Trouver des providers avec une note minimale
   */
  findByMinRating(
    minRating: number,
    options?: PaginationOptions
  ): Promise<PaginatedResult<HealthProvider>>;

  /**
   * Trouver des providers avec filtres avancés
   */
  findProvidersWithFilters(
    filters: HealthProviderFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<HealthProvider>>;
}
