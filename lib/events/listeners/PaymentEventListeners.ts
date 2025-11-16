/**
 * Listeners pour les événements de paiement
 * Gère les actions automatiques lors des événements de paiement
 */

import { paymentEvents, PaymentSucceededEvent } from '@/lib/events';
import { logger } from '@/lib/logger';
import { notificationService } from '@/services/notification/notification.service';
import { transactionService } from '@/services/transaction/transaction.service';
import * as Sentry from '@sentry/nextjs';

/**
 * Initialiser tous les listeners de paiement
 */
export function setupPaymentEventListeners() {
  // Listener pour paiement réussi
  paymentEvents.onPaymentSucceeded(async (data: PaymentSucceededEvent) => {
    logger.info(
      { transactionId: data.transactionId, userId: data.userId },
      '[PaymentEventListeners] Payment succeeded'
    );

    try {
      // 1. Envoyer une notification de confirmation
      await notificationService.sendNotification({
        recipient: data.userId,
        type: 'PAYMENT_SUCCESS',
        template: 'payment_success',
        data: {
          transactionId: data.transactionId,
          amount: data.amount,
          currency: data.currency,
          provider: data.provider,
        },
        channels: [
          { type: 'EMAIL', enabled: true, priority: 'HIGH' },
          { type: 'IN_APP', enabled: true, priority: 'HIGH' },
        ],
        locale: 'fr',
        priority: 'HIGH',
      });

      // 2. Logger pour analytics
      // analytics.track('payment_completed', {
      //   transactionId: data.transactionId,
      //   amount: data.amount,
      //   currency: data.currency,
      //   provider: data.provider,
      //   userId: data.userId,
      // });

      // 3. Mettre à jour les statistiques utilisateur
      // await userService.updatePaymentStats(data.userId, {
      //   totalPaid: data.amount,
      //   lastPaymentDate: data.timestamp,
      // });
    } catch (error) {
      logger.error(
        { error, transactionId: data.transactionId },
        '[PaymentEventListeners] Error handling payment succeeded'
      );
      Sentry.captureException(error);
    }
  });

  // Listener pour paiement échoué
  paymentEvents.onPaymentFailed(async data => {
    logger.warn(
      { transactionId: data.transactionId },
      '[PaymentEventListeners] Payment failed'
    );

    try {
      // Récupérer userId depuis la transaction en base de données (Repository Pattern)
      const userId =
        (await transactionService.getUserIdFromTransaction(
          data.transactionId
        )) || 'unknown';

      // Envoyer une notification d'échec
      await notificationService.sendNotification({
        recipient: userId,
        type: 'PAYMENT_FAILED',
        template: 'payment_failed',
        data: {
          transactionId: data.transactionId,
          error: data.error,
        },
        channels: [
          { type: 'EMAIL', enabled: true, priority: 'MEDIUM' },
          { type: 'IN_APP', enabled: true, priority: 'HIGH' },
        ],
        locale: 'fr',
        priority: 'MEDIUM',
      });

      // Logger pour analytics
      // analytics.track('payment_failed', {
      //   transactionId: data.transactionId,
      //   error: data.error,
      // });
    } catch (error) {
      logger.error(
        { error, transactionId: data.transactionId },
        '[PaymentEventListeners] Error handling payment failed'
      );
      Sentry.captureException(error);
    }
  });

  // Listener pour remboursement
  paymentEvents.onPaymentRefunded(async data => {
    logger.info(
      { transactionId: data.transactionId },
      '[PaymentEventListeners] Payment refunded'
    );

    try {
      // Récupérer userId depuis la transaction en base de données (Repository Pattern)
      const userId =
        (await transactionService.getUserIdFromTransaction(
          data.transactionId
        )) || 'unknown';

      // Envoyer une notification de remboursement
      await notificationService.sendNotification({
        recipient: userId,
        type: 'PAYMENT_REFUNDED',
        template: 'payment_refunded',
        data: {
          transactionId: data.transactionId,
          amount: data.amount,
        },
        channels: [
          { type: 'EMAIL', enabled: true, priority: 'HIGH' },
          { type: 'IN_APP', enabled: true, priority: 'HIGH' },
        ],
        locale: 'fr',
        priority: 'HIGH',
      });

      // Logger pour analytics
      // analytics.track('payment_refunded', {
      //   transactionId: data.transactionId,
      //   amount: data.amount,
      // });
    } catch (error) {
      logger.error(
        { error, transactionId: data.transactionId },
        '[PaymentEventListeners] Error handling payment refunded'
      );
      Sentry.captureException(error);
    }
  });
}
