/**
 * Transaction Service - DiaspoMoney
 * Service de gestion des transactions utilisant le Service Layer Pattern
 * Utilise le Repository Pattern pour l'accès aux données
 */

import { Cacheable, Log } from '@/lib/decorators';
import { logger } from '@/lib/logger';
import {
  getTransactionRepository,
  ITransactionRepository,
} from '@/repositories';
import { Transaction } from '@/repositories/interfaces/ITransactionRepository';

/**
 * TransactionService utilisant le Service Layer Pattern
 * Utilise le Repository Pattern pour l'accès aux données (Dependency Injection)
 */
export class TransactionService {
  private static instance: TransactionService;
  private transactionRepository: ITransactionRepository;

  private constructor() {
    // Dependency Injection : injecter le repository
    this.transactionRepository = getTransactionRepository();
  }

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  /**
   * Récupérer une transaction par ID
   */
  @Log({ level: 'info', logArgs: true })
  @Cacheable(300, { prefix: 'transaction' }) // Cache 5 minutes
  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    try {
      // Utiliser le repository au lieu d'accéder directement au modèle
      return await this.transactionRepository.findById(transactionId);
    } catch (error) {
      logger.error(
        { error, transactionId },
        'Erreur lors de la récupération de la transaction'
      );
      throw error;
    }
  }

  /**
   * Récupérer le userId (payerId) depuis une transaction
   */
  @Log({ level: 'info', logArgs: true })
  async getUserIdFromTransaction(
    transactionId: string
  ): Promise<string | null> {
    try {
      const transaction = await this.getTransactionById(transactionId);
      if (!transaction) {
        logger.warn({ transactionId }, 'Transaction not found');
        return null;
      }
      return transaction.payerId || null;
    } catch (error) {
      logger.error(
        { error, transactionId },
        'Erreur lors de la récupération du userId depuis la transaction'
      );
      throw error;
    }
  }
}

// Singleton instance
export const transactionService = TransactionService.getInstance();
