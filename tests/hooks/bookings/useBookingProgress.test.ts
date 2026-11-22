import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useBookingProgress } from '@/hooks/bookings/useBookingProgress';

const booking = (metadata: Record<string, unknown> = {}, status = 'PENDING') =>
  ({ id: 'b1', status, metadata, createdAt: new Date().toISOString() }) as any;

const progress = (b: any) => renderHook(() => useBookingProgress(b)).result.current;
const completed = (p: ReturnType<typeof progress>) =>
  [1, 2, 3, 4].filter((s) => p.stepStatuses[s]?.isCompleted);

describe('useBookingProgress', () => {
  it('renvoie une progression vide sans réservation', () => {
    const p = progress(null);
    expect(p).toMatchObject({ currentStep: undefined, totalSteps: 4, completionPercentage: 0, isCompleted: false, nextStepToValidate: null });
    expect(p.stepStatuses).toEqual({});
  });

  it('propose l’étape 1 pour une réservation neuve', () => {
    const p = progress(booking());
    expect(completed(p)).toEqual([]);
    expect(p.completionPercentage).toBe(0);
    expect(p.nextStepToValidate).toBe(1);
    expect(p.currentStep).toBeUndefined();
  });

  it('suit l’historique : étapes validées, étape courante et suivante', () => {
    const p = progress(booking({ currentStep: 3, progressHistory: [{ step: 1, completed: true }, { step: 2, completed: true }] }));
    expect(completed(p)).toEqual([1, 2]);
    expect(p.completionPercentage).toBe(50);
    expect(p.currentStep).toBe(3);
    expect(p.stepStatuses[3]!.isCurrent).toBe(true);
    expect(p.nextStepToValidate).toBe(3);
  });

  it('valide d’office les étapes précédant la plus haute étape terminée', () => {
    const p = progress(booking({ progressHistory: [{ step: 2, completed: true }] }));
    expect(completed(p)).toEqual([1, 2]);
    expect(p.currentStep).toBe(2);
    expect(p.nextStepToValidate).toBe(3);
  });

  it('signale un paiement en attente à l’étape 3', () => {
    const p = progress(
      booking({
        progressHistory: [{ step: 1, completed: true }, { step: 2, completed: true }, { step: 3, completed: true, data: { paymentPending: true } }],
      }),
    );
    expect(p.stepStatuses[3]).toMatchObject({ isPaymentWaiting: true });
    // l’étape 3 est bien la plus haute terminée de l’historique
    expect(p.stepStatuses[2]!.isCompleted).toBe(true);
  });

  it.each(['confirmed', 'completed', 'succeeded'])('considère la commande complète si le paiement est « %s »', (paymentStatus) => {
    const p = progress(booking({ paymentStatus }));
    expect(completed(p)).toEqual([1, 2, 3]);
    expect(p.currentStep).toBe(3);
    expect(p.isCompleted).toBe(true);
    expect(p.nextStepToValidate).toBeNull();
  });

  it.each(['CONFIRMED', 'FINISHED'])('valide les 4 étapes pour une commande %s', (status) => {
    const p = progress(booking({}, status));
    expect(completed(p)).toEqual([1, 2, 3, 4]);
    expect(p.completionPercentage).toBe(100);
    expect(p.isCompleted).toBe(true);
  });

  it('valide tout quand l’étape 4 est terminée dans l’historique', () => {
    const p = progress(booking({ progressHistory: [{ step: 4, completed: true }, null, { step: 'x', completed: true }] }));
    expect(completed(p)).toEqual([1, 2, 3, 4]);
    expect(p.nextStepToValidate).toBeNull();
  });
});
