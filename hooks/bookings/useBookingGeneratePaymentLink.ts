/**
 * Hook personnalisé pour générer un lien de paiement
 */

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { useNotificationManager } from '@/components/ui/Notification';

interface UseBookingGeneratePaymentLinkProps {
  bookingId: string;
  refetch: () => Promise<void>;
}

export function useBookingGeneratePaymentLink({
  bookingId,
  refetch,
}: UseBookingGeneratePaymentLinkProps) {
  const notificationManager = useNotificationManager();
  const [generatingPaymentLink, setGeneratingPaymentLink] = useState(false);

  const generatePaymentLink = async () => {
    logger.info({ bookingId }, 'Admin generating payment link');
    setGeneratingPaymentLink(true);

    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/generate-payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Erreur lors de la génération du lien de paiement';
        logger.error({ bookingId, error: errorMessage }, 'Failed to generate payment link');
        notificationManager.addError(errorMessage);
        return;
      }

      if (result.success) {
        logger.info({ bookingId }, 'Payment link generated successfully');
        const message = result.emailSent
          ? 'Lien de paiement généré et envoyé avec succès au client'
          : 'Lien de paiement généré avec succès (l\'email n\'a pas pu être envoyé)';
        notificationManager.addSuccess(message);
        await refetch();
      } else {
        logger.error({ bookingId }, 'Failed to generate payment link');
        notificationManager.addError('Erreur lors de la génération du lien de paiement');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error({ error: err, bookingId }, 'Error generating payment link');
      notificationManager.addError(`Erreur lors de la génération : ${errorMessage}`);
    } finally {
      setGeneratingPaymentLink(false);
    }
  };

  return {
    generatingPaymentLink,
    generatePaymentLink,
  };
}

