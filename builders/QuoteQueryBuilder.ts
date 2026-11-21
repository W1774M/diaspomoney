/**
 * QuoteQueryBuilder - Builder spécialisé pour les requêtes quote
 * Étend QueryBuilder avec des méthodes spécifiques aux devis
 */

import { QueryBuilder } from './QueryBuilder';

export class QuoteQueryBuilder extends QueryBuilder {
  /**
   * Filtrer par type
   */
  byType(type: 'BTP' | 'EDUCATION'): this {
    return this.where('type', type);
  }

  /**
   * Filtrer par statut
   */
  byStatus(status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'): this {
    return this.where('status', status);
  }

  /**
   * Filtrer par provider
   */
  byProvider(providerId: string): this {
    return this.where('providerId', providerId);
  }

  /**
   * Filtrer par school
   */
  bySchool(schoolId: string): this {
    return this.where('schoolId', schoolId);
  }

  /**
   * Filtrer par email de contact
   */
  byContactEmail(email: string): this {
    return this.where('contact.email', email);
  }

  /**
   * Filtrer les devis en attente
   */
  pending(): this {
    return this.where('status', 'PENDING');
  }

  /**
   * Filtrer les devis approuvés
   */
  approved(): this {
    return this.where('status', 'APPROVED');
  }

  /**
   * Filtrer les devis rejetés
   */
  rejected(): this {
    return this.where('status', 'REJECTED');
  }

  /**
   * Filtrer les devis expirés
   */
  expired(): this {
    return this.where('status', 'EXPIRED');
  }

  /**
   * Filtrer par urgence
   */
  byUrgency(urgency: 'LOW' | 'MEDIUM' | 'HIGH'): this {
    return this.where('urgency', urgency);
  }

  /**
   * Filtrer par budget minimum
   */
  minBudget(budget: number): this {
    return this.whereGreaterThanOrEqual('budget', budget);
  }

  /**
   * Filtrer par budget maximum
   */
  maxBudget(budget: number): this {
    return this.whereLessThanOrEqual('budget', budget);
  }

  /**
   * Filtrer par plage de budget
   */
  budgetBetween(min: number, max: number): this {
    return this.minBudget(min).maxBudget(max);
  }

  /**
   * Filtrer les devis créés après une date
   */
  createdAfter(date: Date): this {
    return this.whereGreaterThanOrEqual('createdAt', date);
  }

  /**
   * Filtrer les devis créés avant une date
   */
  createdBefore(date: Date): this {
    return this.whereLessThanOrEqual('createdAt', date);
  }

  /**
   * Filtrer les devis créés entre deux dates
   */
  createdBetween(startDate: Date, endDate: Date): this {
    return this.whereGreaterThanOrEqual('createdAt', startDate)
      .whereLessThanOrEqual('createdAt', endDate);
  }

  /**
   * Trier par date de création
   */
  orderByCreatedAt(direction: 'asc' | 'desc' = 'desc'): this {
    return this.orderBy('createdAt', direction);
  }

  /**
   * Trier par budget
   */
  orderByBudget(direction: 'asc' | 'desc' = 'desc'): this {
    return this.orderBy('budget', direction);
  }
}

