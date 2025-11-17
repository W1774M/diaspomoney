/**
 * Payment Commands - Command Pattern Implementation
 * 
 * Commandes pour les opérations de paiement
 */

import { paymentFacade, PaymentFacadeData, PaymentFacadeResult } from '@/facades/payment.facade';
import { logger } from '@/lib/logger';
import { transactionService } from '@/services/transaction/transaction.service';
import { BaseCommand } from './base.command';

/**
 * Commande pour créer un paiement
 */
export class CreatePaymentCommand extends BaseCommand<PaymentFacadeResult> {
  protected commandName = 'CreatePayment';
  protected commandData: PaymentFacadeData;
  private executedResult?: PaymentFacadeResult;

  constructor(data: PaymentFacadeData) {
    super();
    this.commandData = data;
  }

  async execute(): Promise<PaymentFacadeResult> {
    const result = await paymentFacade.processPayment(this.commandData);
    this.executedResult = result;
    return result;
  }

  async undo(): Promise<void> {
    if (!this.executedResult?.success || !this.executedResult.transactionId) {
      logger.warn({
        command: this.commandName,
        transactionId: this.executedResult?.transactionId,
      }, 'Cannot undo payment: transaction not found or payment failed');
      return;
    }

    try {
      // Rembourser la transaction
      await transactionService.refundTransaction(
        this.executedResult.transactionId,
        undefined as any,
        'Command undo',
        undefined as any,
      );

      logger.info({
        command: this.commandName,
        transactionId: this.executedResult.transactionId,
      }, 'Payment undone: transaction refunded');
    } catch (error: any) {
      logger.error({
        command: this.commandName,
        error: error.message,
        transactionId: this.executedResult.transactionId,
      }, 'Failed to undo payment');
      throw error;
    }
  }
}

/**
 * Commande pour confirmer un paiement
 */
export class ConfirmPaymentCommand extends BaseCommand<PaymentFacadeResult> {
  protected commandName = 'ConfirmPayment';
  protected commandData: {
    paymentIntentId: string;
    paymentMethodId?: string;
  };

  constructor(paymentIntentId: string, paymentMethodId?: string) {
    super();
    this.commandData = {
      paymentIntentId,
      ...(paymentMethodId !== undefined && { paymentMethodId }),
    };
  }

  async execute(): Promise<PaymentFacadeResult> {
    // Cette commande utilise directement le PaymentService
    // car elle ne fait que confirmer un PaymentIntent existant
    const { PaymentService } = await import('@/services/payment/payment.service');
    const paymentService = PaymentService.getInstance();

    const result = await paymentService.confirmPaymentIntent(
      this.commandData.paymentIntentId,
      this.commandData.paymentMethodId,
    );

    return {
      success: result.success || false,
      paymentIntentId: this.commandData.paymentIntentId,
      error: result.error || '',
      requiresAction: result.requiresAction,
      nextAction: result.nextAction || undefined as any,
    } as PaymentFacadeResult;
  }

  // La confirmation ne peut pas être annulée directement
  // Il faudrait créer une transaction de remboursement séparée
  override canUndo(): boolean {
    return false;
  }
}

