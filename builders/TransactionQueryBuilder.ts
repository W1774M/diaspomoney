/**
 * TransactionQueryBuilder - Builder spécialisé pour les requêtes transaction
 * Étend QueryBuilder avec des méthodes spécifiques aux transactions
 */

import { TRANSACTION_STATUSES } from '@/lib/constants';
import { QueryBuilder } from './QueryBuilder';

export class TransactionQueryBuilder extends QueryBuilder {
  /**
   * Filtrer par payeur
   */
  byPayer(payerId: string): this {
    return this.where('payerId', payerId);
  }

  /**
   * Filtrer par bénéficiaire
   */
  byBeneficiary(beneficiaryId: string): this {
    return this.where('beneficiaryId', beneficiaryId);
  }

  /**
   * Filtrer par utilisateur (payeur ou bénéficiaire)
   */
  byUser(userId: string): this {
    return this.whereOr([
      { payerId: userId },
      { beneficiaryId: userId },
    ]);
  }

  /**
   * Filtrer par statut
   */
  byStatus(status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'): this {
    return this.where('status', status);
  }

  /**
   * Filtrer les transactions complétées
   */
  completed(): this {
    return this.where('status', TRANSACTION_STATUSES.COMPLETED);
  }

  /**
   * Filtrer les transactions échouées
   */
  failed(): this {
    return this.where('status', TRANSACTION_STATUSES.FAILED);
  }

  /**
   * Filtrer par méthode de paiement
   */
  byPaymentMethod(method: 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'PAYPAL'): this {
    return this.where('paymentMethod', method);
  }

  /**
   * Filtrer par provider de paiement
   */
  byPaymentProvider(provider: 'STRIPE' | 'PAYPAL' | 'MOBILE_MONEY'): this {
    return this.where('paymentProvider', provider);
  }

  /**
   * Filtrer par type de service
   */
  byServiceType(serviceType: 'HEALTH' | 'BTP' | 'EDUCATION'): this {
    return this.where('serviceType', serviceType);
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
    return this.whereGreaterThanOrEqual('amount', amount);
  }

  /**
   * Filtrer par montant maximum
   */
  maxAmount(amount: number): this {
    return this.whereLessThanOrEqual('amount', amount);
  }

  /**
   * Filtrer par plage de montant
   */
  amountBetween(min: number, max: number): this {
    return this.minAmount(min).maxAmount(max);
  }

  /**
   * Filtrer les transactions créées après une date
   */
  createdAfter(date: Date): this {
    return this.whereGreaterThanOrEqual('createdAt', date);
  }

  /**
   * Filtrer les transactions créées avant une date
   */
  createdBefore(date: Date): this {
    return this.whereLessThanOrEqual('createdAt', date);
  }

  /**
   * Filtrer les transactions créées entre deux dates
   */
  createdBetween(startDate: Date, endDate: Date): this {
    return this.whereGreaterThanOrEqual('createdAt', startDate)
      .whereLessThanOrEqual('createdAt', endDate);
  }

  /**
   * Filtrer les transactions complétées après une date
   */
  completedAfter(date: Date): this {
    return this.whereGreaterThanOrEqual('completedAt', date);
  }

  /**
   * Trier par montant
   */
  orderByAmount(direction: 'asc' | 'desc' = 'desc'): this {
    return this.orderBy('amount', direction);
  }

  /**
   * Trier par date de création
   */
  orderByCreatedAt(direction: 'asc' | 'desc' = 'desc'): this {
    return this.orderBy('createdAt', direction);
  }
}

