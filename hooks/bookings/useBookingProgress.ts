/**
 * Hook personnalisé pour gérer la logique de progression d'une réservation
 */

import { useMemo } from 'react';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';
import { BOOKING_STATUSES } from '@/lib/constants';

export interface BookingProgress {
  currentStep: number | undefined;
  totalSteps: number;
  completionPercentage: number;
  isCompleted: boolean;
  progressHistory: any[];
  nextStepToValidate: number | null;
  stepStatuses: Record<number, {
    isCompleted: boolean;
    isCurrent: boolean;
    isPaymentWaiting: boolean;
    stepHistory: any;
  }>;
}

export function useBookingProgress(booking: BookingResponse | null | undefined): BookingProgress {
  return useMemo(() => {
    if (!booking) {
      return {
        currentStep: undefined,
        totalSteps: 4,
        completionPercentage: 0,
        isCompleted: false,
        progressHistory: [],
        nextStepToValidate: null,
        stepStatuses: {},
      };
    }

    const metadata = booking.metadata || {};
    const currentStep = metadata['currentStep'] as number | undefined;
    const progressHistory = (metadata['progressHistory'] as any[]) || [];
    const paymentStatus = metadata['paymentStatus'] as string | undefined;
    const bookingStatus = booking.status;
    const totalSteps = 4;
    const isPaymentCompleted = paymentStatus === 'confirmed' || paymentStatus === 'completed' || paymentStatus === 'succeeded';
    
    // Si le statut de la commande est CONFIRMED ou FINISHED, la commande est complètement confirmée
    // Cela signifie que l'étape 4 (Confirmation) est complétée
    const isBookingConfirmed = bookingStatus === BOOKING_STATUSES.CONFIRMED || bookingStatus === BOOKING_STATUSES.FINISHED;

    // Étape la plus haute complétée (permet de marquer automatiquement les étapes précédentes)
    const completedSteps = progressHistory
      .filter((h: any) => h?.completed === true && typeof h?.step === 'number')
      .map((h: any) => h.step as number);

    let highestCompletedStep = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
    
    // Si le paiement est complété, l'étape 3 est automatiquement complétée
    if (isPaymentCompleted) {
      highestCompletedStep = Math.max(highestCompletedStep, 3);
    }
    
    // Si la commande est confirmée, l'étape 4 est automatiquement complétée
    if (isBookingConfirmed) {
      highestCompletedStep = Math.max(highestCompletedStep, 4);
    }
    
    // Si l'étape 4 est complétée dans l'historique, toutes les étapes précédentes le sont aussi
    const step4History = progressHistory.find((h: any) => h?.step === 4 && h?.completed === true);
    if (step4History) {
      highestCompletedStep = Math.max(highestCompletedStep, 4);
    }

    // Étape courante affichée : on se base sur currentStep ou, à défaut, sur la progression constatée
    const effectiveCurrentStep =
      currentStep ??
      (highestCompletedStep > 0
        ? highestCompletedStep
        : isPaymentCompleted
        ? 3
        : undefined);

    // Calculer le statut de chaque étape
    const stepStatuses: Record<number, {
      isCompleted: boolean;
      isCurrent: boolean;
      isPaymentWaiting: boolean;
      stepHistory: any;
    }> = {};

    for (let step = 1; step <= 4; step++) {
      const stepHistory = progressHistory.find((h: any) => h.step === step);
      const isCompletedInHistory = stepHistory?.completed === true;
      const isPaymentPending = step === 3 && stepHistory?.data?.paymentPending === true;
      const isPaymentConfirmed = step === 3 && isPaymentCompleted;

      // Déterminer si l'étape est complétée
      const isCompleted = (() => {
        // Si une étape ultérieure est complétée, cette étape est automatiquement complétée
        if (highestCompletedStep > step) {
          return true;
        }

        // Pour l'étape 3, vérifier spécifiquement le statut de paiement
        if (step === 3) {
          // Si le paiement est confirmé, l'étape 3 est complétée
          if (isPaymentConfirmed) return true;
          // Si l'étape est marquée comme complétée dans l'historique et qu'il n'y a pas de paiement en attente
          if (isCompletedInHistory && !isPaymentPending) return true;
          // Si l'étape 4 est complétée, l'étape 3 est automatiquement complétée
          if (highestCompletedStep >= 4) return true;
          // Si l'étape 3 est dans les étapes complétées, elle est complétée
          if (completedSteps.includes(3)) return true;
          return false;
        }

        // Pour l'étape 4, vérifier si la commande est confirmée
        if (step === 4) {
          if (isBookingConfirmed) return true;
          if (isCompletedInHistory) return true;
          if (highestCompletedStep >= 4) return true;
          return false;
        }

        // Pour les autres étapes : considérées complétées si marquées ou si une étape supérieure est terminée
        if (isCompletedInHistory) return true;
        if (highestCompletedStep >= step) return true;

        return false;
      })();

      const isCurrent = step === effectiveCurrentStep && !isCompleted;
      const isPaymentWaiting = step === 3 && isPaymentPending && !isPaymentConfirmed;

      stepStatuses[step] = {
        isCompleted,
        isCurrent,
        isPaymentWaiting,
        stepHistory: stepHistory || null,
      };
    }

    // Calculer le pourcentage de complétion basé sur le nombre réel d'étapes complétées
    const completedCount = Object.values(stepStatuses).filter((status) => status.isCompleted).length;
    const completionPercentage = Math.round((completedCount / totalSteps) * 100);

    const allStepsCompleted =
      Object.keys(stepStatuses).length === totalSteps &&
      Object.values(stepStatuses).every((status) => status.isCompleted);

    // La progression est complète si :
    // - Le pourcentage est à 100%
    // - OU si le paiement est complété (car cela signifie que l'étape 3 est complétée)
    // - OU si toutes les étapes sont marquées complètes
    const isCompleted = completionPercentage === 100 || isPaymentCompleted || allStepsCompleted;

    // Calculer la prochaine étape à valider : première étape non complétée dont les précédentes le sont
    // Si toutes les étapes sont complétées, ne pas afficher de bouton de validation
    const nextStepToValidate = (() => {
      // Si toutes les étapes sont complétées, ne pas afficher de bouton
      if (isCompleted) {
        return null;
      }

      for (let step = 1; step <= totalSteps; step++) {
        const status = stepStatuses[step];
        if (!status) continue;

        // Vérifier que toutes les étapes précédentes sont complétées
        const previousStepsCompleted = step === 1
          ? true
          : Array.from({ length: step - 1 }, (_, idx) => stepStatuses[idx + 1]?.isCompleted).every(Boolean);

        // Ne pas afficher le bouton si l'étape est complétée ou si les étapes précédentes ne le sont pas
        if (!status.isCompleted && previousStepsCompleted) {
          return step;
        }
      }
      return null;
    })();

    return {
      currentStep: effectiveCurrentStep,
      totalSteps,
      completionPercentage,
      isCompleted,
      progressHistory,
      nextStepToValidate,
      stepStatuses,
    };
  }, [booking]);
}

