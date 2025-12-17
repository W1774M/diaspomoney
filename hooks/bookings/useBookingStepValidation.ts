/**
 * Hook personnalisé pour gérer la validation des étapes
 */

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { useNotificationManager } from '@/components/ui/Notification';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

interface UseBookingStepValidationProps {
  booking: BookingResponse | null | undefined;
  bookingId: string;
  refetch: () => Promise<void>;
  onResendPaymentLink: () => Promise<void>;
}

export function useBookingStepValidation({
  booking,
  bookingId,
  refetch,
  onResendPaymentLink,
}: UseBookingStepValidationProps) {
  const notificationManager = useNotificationManager();
  const [validatingStep, setValidatingStep] = useState<number | null>(null);
  const [resendingPaymentLink, setResendingPaymentLink] = useState(false);
  const [showValidateStepDialog, setShowValidateStepDialog] = useState(false);
  const [stepToValidate, setStepToValidate] = useState<number | null>(null);

  const stepNames: Record<number, string> = {
    1: 'Étape 1 : Informations client',
    2: 'Étape 2 : Sélection du service',
    3: 'Étape 3 : Paiement',
    4: 'Étape 4 : Confirmation',
  };

  const handleValidateStepClick = (step: number) => {
    if (!booking) return;
    setStepToValidate(step);
    setShowValidateStepDialog(true);
  };

  const handleValidateStep = async () => {
    if (!booking || !stepToValidate) return;

    const stepName = stepNames[stepToValidate] || `Étape ${stepToValidate}`;
    logger.info({ bookingId, step: stepToValidate }, `Admin validating step: ${stepName}`);

    setValidatingStep(stepToValidate);
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/validate-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ step: stepToValidate }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Erreur lors de la validation de l\'étape';
        logger.error({ bookingId, step: stepToValidate, error: errorMessage }, 'Failed to validate step');
        notificationManager.addError(errorMessage);
        return;
      }

      if (result.success) {
        logger.info({ bookingId, step: stepToValidate }, `Step ${stepToValidate} validated successfully`);
        if (stepToValidate === 3) {
          notificationManager.addSuccess(
            `${stepName} validée avec succès. Un lien de paiement a été envoyé au client par email.`,
          );
        } else {
          notificationManager.addSuccess(`${stepName} validée avec succès`);
        }
        setShowValidateStepDialog(false);
        setStepToValidate(null);
        await refetch();
      } else {
        logger.error({ bookingId, step: stepToValidate }, 'Failed to validate step');
        notificationManager.addError('Erreur lors de la validation de l\'étape');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error({ error: err, bookingId, step: stepToValidate }, 'Error validating step');
      notificationManager.addError(`Erreur lors de la validation : ${errorMessage}`);
    } finally {
      setValidatingStep(null);
    }
  };

  const handleResendPaymentLink = async () => {
    if (!booking) return;

    logger.info({ bookingId }, 'Admin resending payment link');
    setResendingPaymentLink(true);

    try {
      await onResendPaymentLink();
      logger.info({ bookingId }, 'Payment link resent successfully');
      notificationManager.addSuccess('Lien de paiement renvoyé avec succès au client');
      await refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      logger.error({ error: err, bookingId }, 'Error resending payment link');
      notificationManager.addError(`Erreur lors de l'envoi : ${errorMessage}`);
    } finally {
      setResendingPaymentLink(false);
    }
  };

  return {
    validatingStep,
    resendingPaymentLink,
    showValidateStepDialog,
    stepToValidate,
    setShowValidateStepDialog,
    setStepToValidate,
    handleValidateStepClick,
    handleValidateStep,
    handleResendPaymentLink,
  };
}

