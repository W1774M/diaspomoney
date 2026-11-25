/**
 * Listeners pour les événements de paiement
 * Gère les actions automatiques lors des événements de paiement
 */

import { paymentEvents, PaymentSucceededEvent } from '@/lib/events';
import { LEGAL_ENTITY } from '@/lib/legal/company';
import { logger } from '@/lib/logger';
import type { Transaction } from '@/lib/types';
import { getServiceTypeLabel } from '@/lib/utils/booking.utils';
import { getTransactionRepository } from '@/repositories';
import { notificationService } from '@/services/notification/notification.service';
import * as Sentry from '@sentry/nextjs';
import { ObjectId } from 'mongodb';

/**
 * Transaction d'un événement de paiement. Selon l'émetteur, l'identifiant est celui de la
 * transaction en base ou celui de l'intention de paiement Stripe (pi_…).
 */
export async function findEventTransaction(id: string): Promise<Transaction | null> {
  if (!id) return null;
  const repository = getTransactionRepository();
  try {
    if (ObjectId.isValid(id)) {
      const byId = await repository.findById(id);
      if (byId) return byId;
    }
    return await repository.findByPaymentIntentId(id);
  } catch (error) {
    logger.warn({ error, transactionId: id }, '[PaymentEventListeners] Transaction introuvable');
    return null;
  }
}

/** Nom du service payé, pour le message : description de la transaction, sinon son domaine. */
function serviceNameOf(transaction: Transaction | null): string {
  const description = transaction?.description?.trim();
  if (description) return description;
  if (transaction?.serviceType) return getServiceTypeLabel(transaction.serviceType as never);
  return 'votre service';
}

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });

const supportEmail = () => process.env['EMAIL_CONTACT'] || LEGAL_ENTITY.email;

/**
 * Initialiser tous les listeners de paiement
 */
export function setupPaymentEventListeners() {
  // Listener pour paiement réussi
  paymentEvents.onPaymentSucceeded(async (data: PaymentSucceededEvent) => {
    logger.info(
      { transactionId: data.transactionId, userId: data.userId },
      '[PaymentEventListeners] Payment succeeded',
    );

    try {
      // 1. Envoyer une notification de confirmation (toutes les variables du modèle)
      const transaction = await findEventTransaction(data.transactionId);
      await notificationService.sendNotification({
        recipient: data.userId,
        type: 'PAYMENT_SUCCESS',
        template: 'payment_success',
        data: {
          transactionId: data.transactionId,
          amount: data.amount,
          currency: data.currency,
          provider: data.provider,
          serviceName: serviceNameOf(transaction),
          transactionDate: formatDate(data.timestamp ?? new Date()),
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
        '[PaymentEventListeners] Error handling payment succeeded',
      );
      Sentry.captureException(error);
    }
  });

  // Listener pour paiement échoué
  paymentEvents.onPaymentFailed(async data => {
    logger.warn(
      { transactionId: data.transactionId },
      '[PaymentEventListeners] Payment failed',
    );

    try {
      // Payeur, montant et devise viennent de la transaction (id en base ou intention Stripe)
      const transaction = await findEventTransaction(data.transactionId);
      if (!transaction?.payerId) {
        logger.warn(
          { transactionId: data.transactionId },
          '[PaymentEventListeners] Échec de paiement sans transaction connue : pas de notification',
        );
        return;
      }

      // Envoyer une notification d'échec
      await notificationService.sendNotification({
        recipient: transaction.payerId,
        type: 'PAYMENT_FAILED',
        template: 'payment_failed',
        data: {
          transactionId: data.transactionId,
          amount: transaction.amount,
          currency: transaction.currency,
          reason: data.error || 'paiement refusé',
          supportEmail: supportEmail(),
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
        '[PaymentEventListeners] Error handling payment failed',
      );
      Sentry.captureException(error);
    }
  });

  // Listener pour remboursement
  paymentEvents.onPaymentRefunded(async data => {
    logger.info(
      { transactionId: data.transactionId },
      '[PaymentEventListeners] Payment refunded',
    );

    try {
      // Payeur et devise viennent de la transaction (id en base ou intention Stripe)
      const transaction = await findEventTransaction(data.transactionId);
      if (!transaction?.payerId) {
        logger.warn(
          { transactionId: data.transactionId },
          '[PaymentEventListeners] Remboursement sans transaction connue : pas de notification',
        );
        return;
      }

      // Envoyer une notification de remboursement
      await notificationService.sendNotification({
        recipient: transaction.payerId,
        type: 'PAYMENT_REFUNDED',
        template: 'payment_refunded',
        data: {
          transactionId: data.transactionId,
          amount: data.amount,
          currency: transaction.currency,
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
        '[PaymentEventListeners] Error handling payment refunded',
      );
      Sentry.captureException(error);
    }
  });
}
