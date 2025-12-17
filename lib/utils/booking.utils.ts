/**
 * Utilitaires pour les réservations
 */

import { SPECIALITY_TYPES } from '@/lib/constants';
import type { SpecialityType } from '@/lib/types/constants.types';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

/**
 * Obtient le label d'un type de service
 */
export function getServiceTypeLabel(type: SpecialityType): string {
  const types: Record<SpecialityType, string> = {
    [SPECIALITY_TYPES.HEALTH]: 'Santé',
    [SPECIALITY_TYPES.BTP]: 'Immobilier',
    [SPECIALITY_TYPES.EDUCATION]: 'Éducation',
    [SPECIALITY_TYPES.LEGAL]: 'Juridique',
    [SPECIALITY_TYPES.FINANCE]: 'Finance',
    [SPECIALITY_TYPES.TECHNOLOGY]: 'Technologie',
  };
  return types[type] || type;
}

/**
 * Formate le numéro de réservation
 */
export function formatReservationNumber(
  reservationNumber: string | undefined,
  createdAt: Date,
  bookingId: string,
): string {
  const year = createdAt.getFullYear();
  const month = String(createdAt.getMonth() + 1).padStart(2, '0');

  if (!reservationNumber) {
    return `RES-${year}-${month}-${bookingId.slice(-4)}`;
  }

  if (reservationNumber.startsWith('RES-')) {
    const parts = reservationNumber.split('-');
    if (parts.length >= 3) {
      const yearFromNumber = parts[1];
      const sequence = parts[2] || bookingId.slice(-4);
      return `RES-${yearFromNumber}-${month}-${sequence}`;
    }
  }

  return `RES-${year}-${month}-${reservationNumber}`;
}

/**
 * Calcule si la progression est complète (100%)
 * La progression est considérée comme complète si :
 * - Toutes les étapes sont complétées (1, 2, 3, 4)
 * - OU si le paiement est confirmé (paymentStatus === 'confirmed' ou 'completed')
 *   car cela signifie que l'étape 3 est complétée et que la commande peut être prise en charge
 */
export function calculateIsProgressComplete(booking: BookingResponse | null | undefined): boolean {
  if (!booking) return false;

  const metadata = booking.metadata || {};
  const currentStep = metadata['currentStep'] as number | undefined;
  const progressHistory = (metadata['progressHistory'] as any[]) || [];
  const paymentStatus = metadata['paymentStatus'] as string | undefined;
  const totalSteps = 4;

  // Si le paiement est confirmé/complété, la progression est considérée comme complète
  // car cela signifie que l'étape 3 (paiement) est complétée
  if (paymentStatus === 'confirmed' || paymentStatus === 'completed' || paymentStatus === 'succeeded') {
    return true;
  }

  if (!currentStep) {
    return false;
  }

  if (currentStep < totalSteps) {
    return false;
  }

  const step4History = progressHistory.find((h: any) => h.step === 4);
  const isStep4Completed = step4History?.completed === true;

  if (isStep4Completed) {
    return true;
  }

  const allStepsCompleted = Array.from({ length: totalSteps }, (_, i) => i + 1).every((stepNum) => {
    const stepHist = progressHistory.find((h: any) => h.step === stepNum);
    return stepHist?.completed === true;
  });

  return allStepsCompleted;
}

