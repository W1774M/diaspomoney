/**
 * Utilitaire pour renvoyer le lien de paiement — thin API client via fetchJson.
 */

import { fetchJson } from '@/lib/api/fetchJson';
import { logger } from '@/lib/logger';

export async function resendPaymentLink(bookingId: string): Promise<void> {
  logger.info({ bookingId }, 'Resending payment link');

  const result = await fetchJson<{
    success?: boolean;
    error?: string;
  }>(`/api/bookings/${encodeURIComponent(bookingId)}/resend-payment-link`, {
    method: 'POST',
  });

  if (!result.success) {
    const errorMessage =
      result.error || "Erreur lors de l'envoi du lien de paiement";
    logger.error({ bookingId, error: errorMessage }, 'Failed to resend payment link');
    throw new Error(errorMessage);
  }

  logger.info({ bookingId }, 'Payment link resent successfully');
}
