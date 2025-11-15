/**
 * InvoiceQueryBuilder - Builder spécialisé pour les requêtes invoice
 * Étend QueryBuilder avec des méthodes spécifiques aux factures
 */

import { QueryBuilder } from './QueryBuilder';

export class InvoiceQueryBuilder extends QueryBuilder {
  /**
   * Filtrer par utilisateur
   */
  byUser(userId: string): this {
    return this.where('userId', userId);
  }

  /**
   * Filtrer par transaction
   */
  byTransaction(transactionId: string): this {
    return this.where('transactionId', transactionId);
  }

  /**
   * Filtrer par réservation
   */
  byBooking(bookingId: string): this {
    return this.where('bookingId', bookingId);
  }

  /**
   * Filtrer par statut
   */
  byStatus(status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'): this {
    return this.where('status', status);
  }

  /**
   * Filtrer les factures en brouillon
   */
  draft(): this {
    return this.where('status', 'DRAFT');
  }

  /**
   * Filtrer les factures en attente
   */
  pending(): this {
    return this.where('status', 'PENDING');
  }

  /**
   * Filtrer les factures payées
   */
  paid(): this {
    return this.where('status', 'PAID');
  }

  /**
   * Filtrer les factures en retard
   */
  overdue(): this {
    const now = new Date();
    return this.whereIn('status', ['PENDING', 'SENT'])
      .whereLessThan('dueDate', now);
  }

  /**
   * Filtrer par devise
   */
  byCurrency(currency: string): this {
    return this.where('currency', currency.toUpperCase());
  }

  /**
   * Filtrer par montant minimum
   */
  minAmount(amount: number): this {
    return this.whereGreaterThanOrEqual('totalAmount', amount);
  }

  /**
   * Filtrer par montant maximum
   */
  maxAmount(amount: number): this {
    return this.whereLessThanOrEqual('totalAmount', amount);
  }

  /**
   * Filtrer par plage de montant
   */
  amountBetween(min: number, max: number): this {
    return this.minAmount(min).maxAmount(max);
  }

  /**
   * Filtrer les factures échues après une date
   */
  dueAfter(date: Date): this {
    return this.whereGreaterThanOrEqual('dueDate', date);
  }

  /**
   * Filtrer les factures échues avant une date
   */
  dueBefore(date: Date): this {
    return this.whereLessThanOrEqual('dueDate', date);
  }

  /**
   * Filtrer les factures échues entre deux dates
   */
  dueBetween(startDate: Date, endDate: Date): this {
    return this.whereGreaterThanOrEqual('dueDate', startDate)
      .whereLessThanOrEqual('dueDate', endDate);
  }

  /**
   * Filtrer les factures créées après une date
   */
  createdAfter(date: Date): this {
    return this.whereGreaterThanOrEqual('createdAt', date);
  }

  /**
   * Filtrer les factures créées avant une date
   */
  createdBefore(date: Date): this {
    return this.whereLessThanOrEqual('createdAt', date);
  }

  /**
   * Filtrer les factures créées entre deux dates
   */
  createdBetween(startDate: Date, endDate: Date): this {
    return this.whereGreaterThanOrEqual('createdAt', startDate)
      .whereLessThanOrEqual('createdAt', endDate);
  }

  /**
   * Trier par montant
   */
  orderByAmount(direction: 'asc' | 'desc' = 'desc'): this {
    return this.orderBy('totalAmount', direction);
  }

  /**
   * Trier par date d'échéance
   */
  orderByDueDate(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('dueDate', direction);
  }

  /**
   * Trier par date de création
   */
  orderByCreatedAt(direction: 'asc' | 'desc' = 'desc'): this {
    return this.orderBy('createdAt', direction);
  }
}

