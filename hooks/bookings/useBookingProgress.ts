/**
 * Hook personnalisé pour gérer la logique de progression d'une réservation
 */

import { useMemo } from 'react';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

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
    const totalSteps = 4;
    const isPaymentCompleted = paymentStatus === 'confirmed' || paymentStatus === 'completed' || paymentStatus === 'succeeded';

    // Étape la plus haute complétée (permet de marquer automatiquement les étapes précédentes)
    const completedSteps = progressHistory
      .filter((h: any) => h?.completed === true && typeof h?.step === 'number')
      .map((h: any) => h.step as number);

    let highestCompletedStep = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
    if (isPaymentCompleted) {
      highestCompletedStep = Math.max(highestCompletedStep, 3);
    }

    // Étape courante affichée : on se base sur currentStep ou, à défaut, sur la progression constatée
    const effectiveCurrentStep =
      currentStep ??
      (highestCompletedStep > 0
        ? highestCompletedStep
        : isPaymentCompleted
        ? 3
        : undefined);

    // Calculer le pourcentage de complétion
    // Si le paiement est complété, on considère que c'est au moins 75% (étape 3/4)
    let completionPercentage =
      (effectiveCurrentStep ?? 0) > 0
        ? Math.round(((effectiveCurrentStep ?? 0) / totalSteps) * 100)
        : 0;
    if (isPaymentCompleted && completionPercentage < 100) {
      // Si le paiement est complété mais que currentStep n'est pas à 4, on considère au moins 75%
      completionPercentage = Math.max(completionPercentage, 75);
    }

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
        // Pour l'étape 3, vérifier spécifiquement le statut de paiement
        if (step === 3) {
          if (isPaymentConfirmed) return true;
          if (isCompletedInHistory && !isPaymentPending) return true;
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

    const allStepsCompleted =
      Object.keys(stepStatuses).length === totalSteps &&
      Object.values(stepStatuses).every((status) => status.isCompleted);

    // La progression est complète si :
    // - Le pourcentage est à 100%
    // - OU si le paiement est complété (car cela signifie que l'étape 3 est complétée)
    // - OU si toutes les étapes sont marquées complètes
    const isCompleted = completionPercentage === 100 || isPaymentCompleted || allStepsCompleted;

    // Calculer la prochaine étape à valider : première étape non complétée dont les précédentes le sont
    const nextStepToValidate = (() => {
      for (let step = 1; step <= totalSteps; step++) {
        const status = stepStatuses[step];
        if (!status) continue;

        const previousStepsCompleted = step === 1
          ? true
          : Array.from({ length: step - 1 }, (_, idx) => stepStatuses[idx + 1]?.isCompleted).every(Boolean);

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

