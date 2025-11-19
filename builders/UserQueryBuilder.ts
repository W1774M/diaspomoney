/**
 * UserQueryBuilder - Builder spécialisé pour les requêtes utilisateur
 * Étend QueryBuilder avec des méthodes spécifiques aux utilisateurs
 */

import { USER_STATUSES } from '@/lib/constants';
import { QueryBuilder } from './QueryBuilder';

export class UserQueryBuilder extends QueryBuilder {
  /**
   * Filtrer par rôle
   */
  byRole(role: string): this {
    return this.where('roles', role);
  }

  /**
   * Filtrer par plusieurs rôles
   */
  byRoles(roles: string[]): this {
    return this.whereIn('roles', roles);
  }

  /**
   * Filtrer par statut
   */
  byStatus(status: string): this {
    return this.where('status', status);
  }

  /**
   * Filtrer les utilisateurs actifs
   */
  active(): this {
    return this.where('status', USER_STATUSES.ACTIVE);
  }

  /**
   * Filtrer les utilisateurs inactifs
   */
  inactive(): this {
    return this.whereNotEqual('status', USER_STATUSES.ACTIVE);
  }

  /**
   * Filtrer par email
   */
  byEmail(email: string): this {
    return this.where('email', email.toLowerCase());
  }

  /**
   * Filtrer par pays
   */
  byCountry(country: string): this {
    return this.where('countryOfResidence', country);
  }

  /**
   * Filtrer les utilisateurs avec email vérifié
   */
  emailVerified(): this {
    return this.where('emailVerified', true);
  }

  /**
   * Filtrer les utilisateurs avec email non vérifié
   */
  emailNotVerified(): this {
    return this.where('emailVerified', false);
  }

  /**
   * Filtrer par statut KYC
   */
  byKYCStatus(status: string): this {
    return this.where('kycStatus', status);
  }

  /**
   * Filtrer par spécialité
   */
  bySpecialty(specialty: string): this {
    return this.where('specialty', specialty);
  }

  /**
   * Filtrer par ville
   */
  byCity(city: string): this {
    return this.where('targetCity', city);
  }

  /**
   * Filtrer les utilisateurs créés après une date
   */
  createdAfter(date: Date): this {
    return this.whereGreaterThanOrEqual('createdAt', date);
  }

  /**
   * Filtrer les utilisateurs créés avant une date
   */
  createdBefore(date: Date): this {
    return this.whereLessThanOrEqual('createdAt', date);
  }

  /**
   * Filtrer les utilisateurs créés entre deux dates
   */
  createdBetween(startDate: Date, endDate: Date): this {
    return this.whereGreaterThanOrEqual('createdAt', startDate)
      .whereLessThanOrEqual('createdAt', endDate);
  }

  /**
   * Trier par note (pour les providers)
   */
  orderByRating(direction: 'asc' | 'desc' = 'desc'): this {
    return this.orderBy('providerInfo.rating', direction);
  }

  /**
   * Trier par nombre de reviews
   */
  orderByReviewCount(direction: 'asc' | 'desc' = 'desc'): this {
    return this.orderBy('providerInfo.reviewCount', direction);
  }

  /**
   * Filtrer par note minimale
   */
  minRating(rating: number): this {
    return this.whereGreaterThanOrEqual('providerInfo.rating', rating);
  }
}

