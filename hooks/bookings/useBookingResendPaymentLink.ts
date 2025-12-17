/**
 * Hook pour renvoyer le lien de paiement
 */

import { logger } from '@/lib/logger';

export async function resendPaymentLink(bookingId: string): Promise<void> {
  logger.info({ bookingId }, 'Resending payment link');

  const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/resend-payment-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    const errorMessage = result.error || 'Erreur lors de l\'envoi du lien de paiement';
    logger.error({ bookingId, error: errorMessage }, 'Failed to resend payment link');
    throw new Error(errorMessage);
  }

  if (!result.success) {
    logger.error({ bookingId }, 'Failed to resend payment link');
    throw new Error('Erreur lors de l\'envoi du lien de paiement');
  }

  logger.info({ bookingId }, 'Payment link resent successfully');
}

