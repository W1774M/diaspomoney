/**
 * StatisticsQueryBuilder - Builder spécialisé pour les requêtes statistiques complexes
 * Étend QueryBuilder avec des méthodes spécifiques aux statistiques
 */

import { TRANSACTION_STATUSES, CURRENCIES, BOOKING_STATUSES } from '@/lib/constants';
import { QueryBuilder } from './QueryBuilder';

export class StatisticsQueryBuilder extends QueryBuilder {
  /**
   * Filtrer par utilisateur
   */
  byUser(userId: string): this {
    return this.where('userId', userId);
  }

  /**
   * Filtrer par période (date de début)
   */
  fromDate(date: Date): this {
    return this.whereGreaterThanOrEqual('createdAt', date);
  }

  /**
   * Filtrer par période (date de fin)
   */
  toDate(date: Date): this {
    return this.whereLessThanOrEqual('createdAt', date);
  }

  /**
   * Filtrer par période (entre deux dates)
   */
  betweenDates(startDate: Date, endDate: Date): this {
    return this.whereGreaterThanOrEqual('createdAt', startDate)
      .whereLessThanOrEqual('createdAt', endDate);
  }

  /**
   * Filtrer les transactions complétées
   */
  completedTransactions(): this {
    return this.where('status', TRANSACTION_STATUSES.COMPLETED);
  }

  /**
   * Filtrer les transactions en attente
   */
  pendingTransactions(): this {
    return this.where('status', TRANSACTION_STATUSES.PENDING);
  }

  /**
   * Filtrer les transactions échouées
   */
  failedTransactions(): this {
    return this.where('status', TRANSACTION_STATUSES.FAILED);
  }

  /**
   * Filtrer par devise
   */
  byCurrency(currency: typeof CURRENCIES[keyof typeof CURRENCIES]['code']): this {
    return this.where('currency', currency);
  }

  /**
   * Filtrer par montant minimum
   */
  withMinAmount(amount: number): this {
    return this.whereGreaterThanOrEqual('amount', amount);
  }

  /**
   * Filtrer par montant maximum
   */
  withMaxAmount(amount: number): this {
    return this.whereLessThanOrEqual('amount', amount);
  }

  /**
   * Filtrer par plage de montants
   */
  withAmountRange(minAmount: number, maxAmount: number): this {
    return this.whereGreaterThanOrEqual('amount', minAmount)
      .whereLessThanOrEqual('amount', maxAmount);
  }

  /**
   * Filtrer les réservations confirmées
   */
  confirmedBookings(): this {
    return this.where('status', BOOKING_STATUSES.CONFIRMED);
  }

  /**
   * Filtrer les réservations complétées
   */
  completedBookings(): this {
    return this.where('status', BOOKING_STATUSES.COMPLETED);
  }

  /**
   * Filtrer par type de service
   */
  byServiceType(serviceType: string): this {
    return this.where('serviceType', serviceType);
  }

  /**
   * Filtrer par catégorie
   */
  byCategory(category: string): this {
    return this.where('category', category);
  }

  /**
   * Grouper par mois
   */
  groupByMonth(): this {
    // Cette méthode prépare le groupement, l'implémentation réelle se fait dans l'aggregation
    return this;
  }

  /**
   * Grouper par année
   */
  groupByYear(): this {
    // Cette méthode prépare le groupement, l'implémentation réelle se fait dans l'aggregation
    return this;
  }

  /**
   * Grouper par catégorie
   */
  groupByCategory(): this {
    // Cette méthode prépare le groupement, l'implémentation réelle se fait dans l'aggregation
    return this;
  }

  /**
   * Trier par date (décroissant)
   */
  sortByDateDesc(): this {
    return this.orderBy('createdAt', 'desc');
  }

  /**
   * Trier par montant (décroissant)
   */
  sortByAmountDesc(): this {
    return this.orderBy('amount', 'desc');
  }
}

