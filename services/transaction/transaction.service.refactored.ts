/**
 * Transaction Service - DiaspoMoney (Version Refactorée avec Repository Pattern)
 * 
 * Service refactoré utilisant le Repository Pattern
 */

import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { securityManager } from '@/lib/security/advanced-security';
import { getTransactionRepository, Transaction, TransactionFilters } from '@/repositories';
import * as Sentry from '@sentry/nextjs';
import { userService } from '../user/user.service';

export interface TransactionData {
  payerId: string;
  beneficiaryId: string;
  amount: number;
  currency: string;
  serviceType: 'HEALTH' | 'BTP' | 'EDUCATION';
  serviceId: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  successRate: number;
  averageAmount: number;
  currencyBreakdown: Record<string, { count: number; amount: number }>;
  serviceTypeBreakdown: Record<string, { count: number; amount: number }>;
}

/**
 * TransactionService refactoré utilisant le Repository Pattern
 */
export class TransactionService {
  private static instance: TransactionService;
  private transactionRepository = getTransactionRepository();

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  /**
   * Créer une nouvelle transaction
   * AVANT: Création en mémoire uniquement
   * APRÈS: Utilisation du repository pour persister en base
   */
  async createTransaction(data: TransactionData): Promise<Transaction> {
    try {
      // Validation
      if (
        !data.payerId ||
        !data.beneficiaryId ||
        typeof data.amount !== 'number' ||
        !data.currency
      ) {
        throw new Error('Données de transaction incomplètes');
      }
      if (data.amount <= 0) {
        throw new Error('Le montant doit être positif');
      }

      // Vérifier que le payeur existe
      const payer = await userService.getUserProfile(data.payerId);
      if (!payer || !payer.isActive) {
        throw new Error('Payeur non trouvé ou inactif');
      }

      // Vérifier que le bénéficiaire existe
      const beneficiary = await userService.getUserProfile(data.beneficiaryId);
      if (!beneficiary || !beneficiary.isActive) {
        throw new Error('Bénéficiaire non trouvé ou inactif');
      }

      // Calculer les frais
      const fees = this.calculateFees(
        data.amount,
        data.currency,
        data.serviceType
      );
      const totalAmount = data.amount + fees;

      // Créer la transaction via le repository
      const transaction = await this.transactionRepository.create({
        payerId: data.payerId,
        beneficiaryId: data.beneficiaryId,
        amount: data.amount,
        currency: data.currency,
        exchangeRate: 1,
        fees,
        totalAmount,
        serviceType: data.serviceType,
        serviceId: data.serviceId,
        description: data.description,
        status: 'PENDING',
        paymentMethod: 'CARD',
        paymentProvider: 'STRIPE',
        metadata: data.metadata || {},
      } as Partial<Transaction>);

      // Détecter les anomalies
      await securityManager.detectAnomalies(
        data.payerId,
        'TRANSACTION_CREATED',
        transaction
      );

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'transactions_created',
        value: 1,
        timestamp: new Date(),
        labels: {
          service_type: data.serviceType,
          currency: data.currency,
        },
        type: 'counter',
      });

      return transaction;
    } catch (error) {
      console.error('Erreur createTransaction:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer une transaction par ID
   * AVANT: FIXME - Non implémenté
   * APRÈS: Utilisation du repository
   */
  async getTransaction(
    transactionId: string,
    userId: string
  ): Promise<Transaction | null> {
    try {
      const transaction = await this.transactionRepository.findById(transactionId);
      
      // Vérifier que l'utilisateur a accès à cette transaction
      if (transaction && (transaction.payerId === userId || transaction.beneficiaryId === userId)) {
        return transaction;
      }

      return null;
    } catch (error) {
      console.error('Erreur getTransaction:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les transactions avec filtres
   * AVANT: FIXME - Retournait un tableau vide
   * APRÈS: Utilisation du repository avec filtres
   */
  async getTransactions(
    userId: string,
    filters: TransactionFilters = {}
  ): Promise<Transaction[]> {
    try {
      // Ajouter le filtre utilisateur (payer ou bénéficiaire)
      const repositoryFilters: TransactionFilters = {
        ...filters,
        // Note: On pourrait utiliser $or dans le repository pour chercher dans payerId OU beneficiaryId
      };

      // Utiliser le repository avec pagination
      const result = await this.transactionRepository.findTransactionsWithFilters(
        repositoryFilters,
        {
          limit: filters['limit'] || 50,
          offset: filters['offset'] || 0,
        }
      );

      // Filtrer pour ne retourner que les transactions de l'utilisateur
      return result.data.filter(
        t => t.payerId === userId || t.beneficiaryId === userId
      );
    } catch (error) {
      console.error('Erreur getTransactions:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'une transaction
   * AVANT: FIXME - Non implémenté
   * APRÈS: Utilisation du repository
   */
  async updateTransactionStatus(
    transactionId: string,
    status: Transaction['status'],
    metadata?: Record<string, any>
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
        updateData
      );

      if (!updatedTransaction) {
        throw new Error('Transaction non trouvée');
      }

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'transactions_total',
        value: 1,
        timestamp: new Date(),
        labels: {
          status: status.toLowerCase(),
        },
        type: 'counter',
      });

      // Si la transaction est complétée, enregistrer les revenus
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

      return updatedTransaction;
    } catch (error) {
      console.error('Erreur updateTransactionStatus:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Rembourser une transaction
   */
  async refundTransaction(
    transactionId: string,
    reason?: string
  ): Promise<Transaction> {
    try {
      const transaction = await this.transactionRepository.findById(transactionId);
      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      if (transaction.status !== 'COMPLETED') {
        throw new Error('Seules les transactions complétées peuvent être remboursées');
      }

      // Mettre à jour le statut
      const refundedTransaction = await this.updateTransactionStatus(
        transactionId,
        'REFUNDED',
        { refundReason: reason }
      );

      return refundedTransaction;
    } catch (error) {
      console.error('Erreur refundTransaction:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des transactions
   */
  async getTransactionStats(
    userId: string,
    filters: TransactionFilters = {}
  ): Promise<TransactionStats> {
    try {
      const transactions = await this.getTransactions(userId, filters);
      const completedTransactions = transactions.filter(
        t => t.status === 'COMPLETED'
      );

      const totalAmount = completedTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
      );
      const successRate =
        transactions.length > 0
          ? (completedTransactions.length / transactions.length) * 100
          : 0;
      const averageAmount =
        completedTransactions.length > 0
          ? totalAmount / completedTransactions.length
          : 0;

      // Breakdown par devise
      const currencyBreakdown: Record<string, { count: number; amount: number }> = {};
      completedTransactions.forEach(t => {
        if (!currencyBreakdown[t.currency]) {
          currencyBreakdown[t.currency] = { count: 0, amount: 0 };
        }
        currencyBreakdown[t.currency]!.count++;
        currencyBreakdown[t.currency]!.amount += t.amount;
      });

      // Breakdown par type de service
      const serviceTypeBreakdown: Record<string, { count: number; amount: number }> = {};
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
        successRate,
        averageAmount,
        currencyBreakdown,
        serviceTypeBreakdown,
      };
    } catch (error) {
      console.error('Erreur getTransactionStats:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Calculer les frais de transaction
   */
  private calculateFees(
    amount: number,
    _currency: string,
    serviceType: 'HEALTH' | 'BTP' | 'EDUCATION'
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

