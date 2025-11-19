/**
 * BeneficiaryQueryBuilder - Builder spécialisé pour les requêtes de bénéficiaires
 * Étend QueryBuilder avec des méthodes spécifiques aux bénéficiaires
 */

import { QueryBuilder } from './QueryBuilder';
import type { BeneficiaryRelationship } from '@/lib/types';

export class BeneficiaryQueryBuilder extends QueryBuilder {
  /**
   * Filtrer par payeur (utilisateur propriétaire)
   */
  byPayer(payerId: string): this {
    return this.where('payerId', payerId);
  }

  /**
   * Filtrer par relation
   */
  byRelationship(relationship: BeneficiaryRelationship): this {
    return this.where('relationship', relationship);
  }

  /**
   * Filtrer par pays
   */
  byCountry(country: string): this {
    return this.where('country', country);
  }

  /**
   * Filtrer les bénéficiaires actifs uniquement
   */
  active(): this {
    return this.where('isActive', true);
  }

  /**
   * Filtrer les bénéficiaires inactifs uniquement
   */
  inactive(): this {
    return this.where('isActive', false);
  }

  /**
   * Filtrer par email
   */
  byEmail(email: string): this {
    return this.where('email', email.toLowerCase().trim());
  }

  /**
   * Filtrer par recherche de texte (nom, prénom, email)
   */
  search(searchTerm: string): this {
    const searchRegex = new RegExp(searchTerm, 'i');
    return this.whereOr([
      { firstName: { $regex: searchRegex } },
      { lastName: { $regex: searchRegex } },
      { email: { $regex: searchRegex } },
    ]);
  }

  /**
   * Filtrer les bénéficiaires créés après une date
   */
  createdAfter(date: Date): this {
    return this.whereGreaterThan('createdAt', date);
  }

  /**
   * Filtrer les bénéficiaires créés avant une date
   */
  createdBefore(date: Date): this {
    return this.whereLessThan('createdAt', date);
  }

  /**
   * Filtrer les bénéficiaires créés entre deux dates
   */
  createdBetween(startDate: Date, endDate: Date): this {
    return this.whereGreaterThanOrEqual('createdAt', startDate)
      .whereLessThanOrEqual('createdAt', endDate);
  }

  /**
   * Filtrer les bénéficiaires mis à jour après une date
   */
  updatedAfter(date: Date): this {
    return this.whereGreaterThan('updatedAt', date);
  }

  /**
   * Trier par date de création (plus récents en premier)
   */
  orderByCreatedAt(direction: 'asc' | 'desc' = 'desc'): this {
    return this.orderBy('createdAt', direction);
  }

  /**
   * Trier par nom (alphabétique)
   */
  orderByName(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('lastName', direction).orderBy('firstName', direction);
  }

  /**
   * Trier par relation
   */
  orderByRelationship(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('relationship', direction);
  }

  /**
   * Trier par pays
   */
  orderByCountry(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('country', direction);
  }
}

