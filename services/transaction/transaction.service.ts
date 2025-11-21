/**
 * Transaction Service - DiaspoMoney (Version Refactorée avec Repository Pattern)
 *
 * Service refactoré utilisant le Repository Pattern
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Repository Pattern
 * - Dependency Injection
 * - Singleton Pattern
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache)
 * - Error Handling Pattern (Sentry)
 */

import { SPECIALITY_TYPES, PAYMENT_METHODS } from '@/lib/constants';
import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { CreateTransactionServiceSchema } from '@/lib/validations/transaction-service.schema';
import { childLogger } from '@/lib/logger';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { securityManager } from '@/lib/security/advanced-security';
import {
  getTransactionRepository,
  Transaction,
  type TransactionFilters as RepositoryTransactionFilters,
} from '@/repositories';
import type {
  TransactionFilters,
  TransactionData,
  TransactionStats,
} from '@/lib/types';
import { TransactionStatus } from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import { userService } from '../user/user.service';


/**
 * TransactionService refactoré utilisant le Repository Pattern
 */
export class TransactionService {
  private static instance: TransactionService;
  private transactionRepository = getTransactionRepository();
  private readonly log = childLogger({
    component: 'TransactionService',
  });

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  /**
   * Créer une nouvelle transaction
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: CreateTransactionServiceSchema.passthrough(),
        paramName: 'data',
      },
    ],
  })
  @InvalidateCache('TransactionService:*')
  async createTransaction(data: TransactionData): Promise<Transaction> {
    try {

      // Vérifier que le payeur existe et est actif
      const payer = await userService.getUserProfile(data.payerId);
      if (!payer || !payer.isActive) {
        throw new Error('Payeur non trouvé ou inactif');
      }

      // Vérifier que le bénéficiaire existe et est actif
      const beneficiary = await userService.getUserProfile(data.beneficiaryId);
      if (!beneficiary || !beneficiary.isActive) {
        throw new Error('Bénéficiaire non trouvé ou inactif');
      }

      // Calcul des frais et du montant total
      const fees = this.calculateFees(
        data.amount,
        data.currency,
        data.serviceType as unknown as Transaction['serviceType'],
      );
      const totalAmount = data.amount + fees;

      // Création de la transaction en base
      const transaction = await this.transactionRepository.create({
        payerId: data.payerId,
        beneficiaryId: data.beneficiaryId,
        amount: data.amount,
        currency: data.currency,
        exchangeRate: 1,
        fees,
        totalAmount,
        serviceType: data.serviceType as unknown as Transaction['serviceType'],
        serviceId: data.serviceId,
        description: data.description,
        status: TransactionStatus.PENDING,
        paymentMethod: PAYMENT_METHODS.CARD,
        paymentProvider: PAYMENT_METHODS.STRIPE,
        metadata: data.metadata || {},
      });

      // Détection d'anomalies
      await securityManager.detectAnomalies(
        data.payerId,
        'TRANSACTION_CREATED',
        transaction,
      );

      // Enregistrement des métriques
      monitoringManager.recordMetric({
        name: 'transactions_created',
        value: 1,
        timestamp: new Date(),
        labels: {
          service_type: data.serviceType as unknown as Transaction['serviceType'],
          currency: data.currency,
        },
        type: 'counter',
      });

      this.log.info(
        {
          transactionId: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
        },
        'Transaction created successfully',
      );
      return transaction;
    } catch (error) {
      this.log.error({ error, data }, 'Error in createTransaction');
      Sentry.captureException(error as Error, {
        tags: { component: 'TransactionService', action: 'createTransaction' },
        extra: { payerId: data.payerId, amount: data.amount },
      });
      throw error;
    }
  }

  /**
   * Récupérer une transaction par ID, seulement si l'utilisateur y a accès
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TransactionService:getTransaction' })
  async getTransaction(
    transactionId: string,
    userId: string,
  ): Promise<Transaction | null> {
    try {
      const transaction = await this.transactionRepository.findById(
        transactionId,
      );

      if (
        transaction &&
        (transaction.payerId === userId || transaction.beneficiaryId === userId)
      ) {
        return transaction;
      }

      return null;
    } catch (error) {
      this.log.error(
        { error, transactionId, userId },
        'Error in getTransaction',
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'TransactionService', action: 'getTransaction' },
        extra: { transactionId, userId },
      });
      throw error;
    }
  }

  /**
   * Récupérer les transactions avec filtres, pagination côté repository & fix types
   * Fix: Gérer la pagination sans accéder à des propriétés potentiellement non existantes sur filters
   *      et fixer le type de TransactionFilters pour la compatibilité stricte.
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TransactionService:getTransactions' })
  async getTransactions(
    userId: string,
    filters: TransactionFilters = {},
  ): Promise<Transaction[]> {
    try {
      // Séparer pagination des vrais filtres
      const { limit: _limit = 50, offset: _offset = 0, ...otherFilters } = filters as any;

      // Convertir TransactionFilters (types/transaction) vers RepositoryTransactionFilters
      // Le repository attend status?: TransactionStatus (single) mais types/transaction a status?: TransactionStatus[] (array)
      const repositoryFilters: RepositoryTransactionFilters = {
        ...otherFilters,
        // Si status est un array, prendre le premier élément
        ...(otherFilters.status &&
          Array.isArray(otherFilters.status) &&
          otherFilters.status.length > 0 && {
            status: otherFilters.status[0] as any,
          }),
      };

      // On passe la pagination séparément au repository (il ne doit pas être sur TransactionFilters)
      const result =
        await this.transactionRepository.findTransactionsWithFilters(
          repositoryFilters,
          {
            limit: 50,
            page: 1,
            offset: 0,
          },
        );

      // Filtre côté service pour la cohérence (sécurité supplémentaire)
      const filtered = result.data.filter(
        t => t.payerId === userId || t.beneficiaryId === userId,
      );
      this.log.debug(
        { count: filtered.length, userId },
        'Transactions retrieved',
      );
      return filtered;
    } catch (error) {
      this.log.error({ error, userId, filters }, 'Error in getTransactions');
      Sentry.captureException(error as Error, {
        tags: { component: 'TransactionService', action: 'getTransactions' },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'une transaction
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('TransactionService:*')
  async updateTransactionStatus(
    transactionId: string,
    status: Transaction['status'],
    metadata?: Record<string, any>,
  ): Promise<Transaction> {
    try {
      const updateData: Partial<Transaction> = {
        status,
        ...(metadata && { metadata }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
        ...(status === 'FAILED' && { failedAt: new Date() }),
      };

      const updatedTransaction = await this.transactionRepository.update(
        transactionId,
        updateData,
      );

      if (!updatedTransaction) {
        throw new Error('Transaction non trouvée');
      }

      monitoringManager.recordMetric({
        name: 'transactions_total',
        value: 1,
        timestamp: new Date(),
        labels: {
          status: status.toLowerCase(),
        },
        type: 'counter',
      });

      if (status === 'COMPLETED') {
        monitoringManager.recordMetric({
          name: 'revenue_total',
          value: updatedTransaction.amount,
          timestamp: new Date(),
          labels: {
            currency: updatedTransaction.currency,
            service_type: updatedTransaction.serviceType,
          },
          type: 'counter',
        });
      }

      this.log.info(
        { transactionId, status },
        'Transaction status updated successfully',
      );
      return updatedTransaction;
    } catch (error) {
      this.log.error(
        { error, transactionId, status },
        'Error in updateTransactionStatus',
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'TransactionService',
          action: 'updateTransactionStatus',
        },
        extra: { transactionId, status },
      });
      throw error;
    }
  }

  /**
   * Rembourser une transaction
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('TransactionService:*')
  async refundTransaction(
    transactionId: string,
    reason?: string,
  ): Promise<Transaction> {
    try {
      const transaction = await this.transactionRepository.findById(
        transactionId,
      );

      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      if (transaction.status !== 'COMPLETED') {
        throw new Error(
          'Seules les transactions complétées peuvent être remboursées',
        );
      }

      const refundedTransaction = await this.updateTransactionStatus(
        transactionId,
        TransactionStatus.REFUNDED,
        { refundReason: reason },
      );

      this.log.info(
        { transactionId, reason },
        'Transaction refunded successfully',
      );
      return refundedTransaction;
    } catch (error) {
      this.log.error({ error, transactionId }, 'Error in refundTransaction');
      Sentry.captureException(error as Error, {
        tags: { component: 'TransactionService', action: 'refundTransaction' },
        extra: { transactionId },
      });
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des transactions
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'TransactionService:getTransactionStats' })
  async getTransactionStats(
    userId: string,
    filters: TransactionFilters = {},
  ): Promise<TransactionStats> {
    try {
      const transactions = await this.getTransactions(userId, filters);
      const completedTransactions = transactions.filter(
        t => t.status === 'COMPLETED',
      );

      const totalAmount = completedTransactions.reduce(
        (sum, t) => sum + t.amount,
        0,
      );

      const currencyBreakdown: Record<
        string,
        { count: number; amount: number }
      > = {};
      completedTransactions.forEach(t => {
        if (!currencyBreakdown[t.currency]) {
          currencyBreakdown[t.currency] = { count: 0, amount: 0 };
        }
        currencyBreakdown[t.currency]!.count++;
        currencyBreakdown[t.currency]!.amount += t.amount;
      });

      const serviceTypeBreakdown: Record<
        string,
        { count: number; amount: number }
      > = {};
      completedTransactions.forEach(t => {
        if (!serviceTypeBreakdown[t.serviceType]) {
          serviceTypeBreakdown[t.serviceType] = { count: 0, amount: 0 };
        }
        serviceTypeBreakdown[t.serviceType]!.count++;
        serviceTypeBreakdown[t.serviceType]!.amount += t.amount;
      });

      return {
        totalTransactions: transactions.length,
        totalAmount,
        totalSuccessTransactions: completedTransactions.length,
        totalFailedTransactions: transactions.length - completedTransactions.length,
        totalRefundedTransactions: completedTransactions.filter(t => t.status === 'REFUNDED').length,
        totalCancelledTransactions: completedTransactions.filter(t => t.status === 'CANCELLED').length,
        totalFees: completedTransactions.reduce((sum, t) => sum + t.fees, 0),
      };
    } catch (error) {
      this.log.error(
        { error, userId, filters },
        'Error in getTransactionStats',
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'TransactionService',
          action: 'getTransactionStats',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Récupérer l'ID de l'utilisateur depuis une transaction
   */
  @Log({ level: 'info', logArgs: true })
  @Cacheable(300, { prefix: 'TransactionService:getUserIdFromTransaction' })
  async getUserIdFromTransaction(transactionId: string): Promise<string | null> {
    try {
      const transaction = await this.transactionRepository.findById(transactionId);
      if (!transaction) {
        return null;
      }
      return transaction.payerId || null;
    } catch (error) {
      this.log.error(
        { error, transactionId },
        'Error in getUserIdFromTransaction',
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'TransactionService',
          action: 'getUserIdFromTransaction',
        },
        extra: { transactionId },
      });
      return null;
    }
  }

  /**
   * Calculer les frais de transaction
   */
  private calculateFees(
    amount: number,
    _currency: string,
    serviceType:
      | typeof SPECIALITY_TYPES.HEALTH
      | typeof SPECIALITY_TYPES.BTP
      | typeof SPECIALITY_TYPES.EDUCATION,
  ): number {
    // Frais de base : 2.5% + 0.30€
    const baseFee = amount * 0.025 + 0.3;

    // Frais supplémentaires selon le type de service
    const serviceTypeMultiplier: Record<string, number> = {
      HEALTH: 1.0,
      BTP: 1.1,
      EDUCATION: 0.95,
    };

    return baseFee * (serviceTypeMultiplier[serviceType] || 1.0);
  }
}

// Export singleton
export const transactionService = TransactionService.getInstance();
