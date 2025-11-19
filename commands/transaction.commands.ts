/**
 * Transaction Commands - Command Pattern Implementation
 * 
 * Commandes pour les opérations de transaction
 */

import { logger } from '@/lib/logger';
import type { Transaction } from '@/services/transaction/transaction.service';
import { TransactionData, transactionService } from '@/services/transaction/transaction.service';
import { BaseCommand } from './base.command';

/**
 * Commande pour créer une transaction
 */
export class CreateTransactionCommand extends BaseCommand<Transaction> {
  protected commandName = 'CreateTransaction';
  protected commandData: TransactionData;
  private executedResult?: Transaction;

  constructor(data: TransactionData) {
    super();
    this.commandData = data;
  }

  async execute(): Promise<Transaction> {
    const result = await transactionService.createTransaction(this.commandData);
    this.executedResult = result;
    return result;
  }

  async undo(): Promise<void> {
    if (!this.executedResult) {
      logger.warn({
        command: this.commandName,
      }, 'Cannot undo transaction: transaction not found');
      return;
    }

    try {
      const transactionId = this.executedResult.id || 
                           (this.executedResult as any)._id?.toString() || '';

      if (!transactionId) {
        throw new Error('Transaction ID not found');
      }

      // Rembourser la transaction
      await transactionService.refundTransaction(
        transactionId,
        0,
        'Command undo',
        '', // userId
      );

      logger.info({
        command: this.commandName,
        transactionId,
      }, 'Transaction undone: transaction refunded');
    } catch (error: any) {
      logger.error({
        command: this.commandName,
        error: error.message,
        transactionId: this.executedResult?.id,
      }, 'Failed to undo transaction');
      throw error;
    }
  }
}

/**
 * Commande pour mettre à jour le statut d'une transaction
 */
export class UpdateTransactionStatusCommand extends BaseCommand<Transaction> {
  protected commandName = 'UpdateTransactionStatus';
  protected commandData: {
    transactionId: string;
    newStatus: string;
  };
  private previousStatus?: string;

  constructor(transactionId: string, newStatus: string) {
    super();
    this.commandData = {
      transactionId,
      newStatus,
    };
  }

  async execute(): Promise<Transaction> {
    try {
      // Récupérer le statut actuel
      const transaction = await transactionService.getTransaction(
        this.commandData.transactionId,
        '', // userId non requis pour cette opération
      );

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      this.previousStatus = transaction.status;

      // Mettre à jour le statut
      await transactionService.updateTransactionStatus(
        this.commandData.transactionId,
        this.commandData.newStatus as any,
      );

      // Récupérer la transaction mise à jour
      const updatedTransaction = await transactionService.getTransaction(
        this.commandData.transactionId,
        '',
      );

      if (!updatedTransaction) {
        throw new Error('Updated transaction not found');
      }

      return updatedTransaction;
    } catch (error: any) {
      logger.error({
        command: this.commandName,
        error: error.message,
        transactionId: this.commandData.transactionId,
      }, 'Failed to update transaction status');
      throw error;
    }
  }

  async undo(): Promise<void> {
    if (!this.previousStatus) {
      logger.warn({
        command: this.commandName,
        transactionId: this.commandData.transactionId,
      }, 'Cannot undo status update: previous status not found');
      return;
    }

    try {
      // Restaurer le statut précédent
      await transactionService.updateTransactionStatus(
        this.commandData.transactionId,
        this.previousStatus as any,
      );

      logger.info({
        command: this.commandName,
        transactionId: this.commandData.transactionId,
        previousStatus: this.previousStatus,
        newStatus: this.commandData.newStatus,
      }, 'Transaction status update undone: status restored');
    } catch (error: any) {
      logger.error({
        command: this.commandName,
        error: error.message,
        transactionId: this.commandData.transactionId,
      }, 'Failed to undo transaction status update');
      throw error;
    }
  }
}

/**
 * Commande pour rembourser une transaction
 */
export class RefundTransactionCommand extends BaseCommand<Transaction> {
  protected commandName = 'RefundTransaction';
  protected commandData: {
    transactionId: string;
    reason?: string;
  };

  constructor(transactionId: string, reason?: string) {
    super();
    this.commandData = {
      transactionId,
      ...(reason !== undefined && { reason }),
    };
  }

  async execute(): Promise<Transaction> {
    try {
      // Récupérer la transaction avant remboursement
      const transaction = await transactionService.getTransaction(
        this.commandData.transactionId,
        '',
      );

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Rembourser la transaction
      const result = await transactionService.refundTransaction(
        this.commandData.transactionId,
        0,
        this.commandData.reason || 'Refund requested',
        '', // userId
      );

      return result;
    } catch (error: any) {
      logger.error({
        command: this.commandName,
        error: error.message,
        transactionId: this.commandData.transactionId,
      }, 'Failed to refund transaction');
      throw error;
    }
  }

  // Le remboursement ne peut généralement pas être annulé
  // car cela créerait une nouvelle transaction
  override canUndo(): boolean {
    return false;
  }
}
