/**
 * ProviderQueryBuilder - Builder spécialisé pour les requêtes de providers
 * Étend QueryBuilder avec des méthodes spécifiques aux providers
 * Note: Différent de UserQueryBuilder car il filtre spécifiquement les providers
 */

import { USER_STATUSES, ROLES, SPECIALITY_TYPES } from '@/lib/constants';
import { ProviderType } from '@/lib/types/user.types';
import { QueryBuilder } from './QueryBuilder';

export class ProviderQueryBuilder extends QueryBuilder {
  /**
   * Filtrer uniquement les providers (utilisateurs avec rôle PROVIDER)
   */
  providers(): this {
    return this.whereIn('roles', [ROLES.PROVIDER]);
  }

  /**
   * Filtrer par type de provider
   */
  byType(type: ProviderType): this {
    return this.where('type', type);
  }

  /**
   * Filtrer par catégorie
   */
  byCategory(category: string): this {
    return this.where('category', category);
  }

  /**
   * Filtrer par spécialité
   */
  bySpecialty(specialty: string): this {
    return this.whereIn('specialties', [specialty]);
  }

  /**
   * Filtrer par plusieurs spécialités
   */
  bySpecialties(specialties: string[]): this {
    return this.whereIn('specialties', specialties);
  }

  /**
   * Filtrer par type de service
   */
  byServiceType(serviceType: typeof SPECIALITY_TYPES[keyof typeof SPECIALITY_TYPES]): this {
    return this.where('serviceType', serviceType);
  }

  /**
   * Filtrer les providers vérifiés
   */
  verified(): this {
    return this.where('isVerified', true);
  }

  /**
   * Filtrer les providers non vérifiés
   */
  unverified(): this {
    return this.where('isVerified', false);
  }

  /**
   * Filtrer par note minimale
   */
  withMinRating(rating: number): this {
    return this.whereGreaterThanOrEqual('rating', rating);
  }

  /**
   * Filtrer par nombre minimum d'avis
   */
  withMinReviews(reviewCount: number): this {
    return this.whereGreaterThanOrEqual('reviewCount', reviewCount);
  }

  /**
   * Filtrer les providers recommandés
   */
  recommended(): this {
    return this.where('recommended', true);
  }

  /**
   * Filtrer par statut utilisateur
   */
  byStatus(status: typeof USER_STATUSES[keyof typeof USER_STATUSES]): this {
    return this.where('status', status);
  }

  /**
   * Filtrer les providers actifs
   */
  active(): this {
    return this.where('status', USER_STATUSES.ACTIVE);
  }

  /**
   * Filtrer par ville
   */
  byCity(city: string): this {
    return this.whereRegex('city', city, 'i');
  }

  /**
   * Filtrer par pays
   */
  byCountry(country: string): this {
    return this.whereRegex('country', country, 'i');
  }

  /**
   * Filtrer par disponibilité
   */
  available(): this {
    return this.where('availability.isAvailable', true);
  }

  /**
   * Filtrer par institution
   */
  byInstitution(institutionName: string): this {
    return this.whereRegex('institution.legalName', institutionName, 'i');
  }

  /**
   * Trier par note (décroissant)
   */
  sortByRating(): this {
    return this.orderBy('rating', 'desc');
  }

  /**
   * Trier par nombre d'avis (décroissant)
   */
  sortByReviewCount(): this {
    return this.orderBy('reviewCount', 'desc');
  }
}

