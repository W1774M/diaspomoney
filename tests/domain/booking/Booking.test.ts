import { describe, expect, it } from 'vitest';
import { Booking } from '@/domain/booking';
import type { PaymentProofEvaluation } from '@/domain/payment';

const confirmedProof: PaymentProofEvaluation = {
  valid: true,
  paymentStatus: 'confirmed',
  paymentIntentId: 'pi_abc',
  providerStatus: 'succeeded',
  amount: 50,
  currency: 'EUR',
};

describe('Booking aggregate', () => {
  it('markPaymentConfirmed met à jour payment + status', () => {
    const booking = Booking.fromPersistence({
      id: 'b1',
      reservationNumber: 'RES-1',
      requesterId: 'user1',
      status: 'PENDING',
      metadata: {
        totalAmount: '50',
        clientEmail: 'a@b.com',
        serviceLabel: 'Consult',
      },
    });

    booking.markPaymentConfirmed(confirmedProof);

    expect(booking.paymentStatus).toBe('confirmed');
    expect(booking.status).toBe('CONFIRMED');
    expect(booking.paymentIntentId).toBe('pi_abc');
    expect(booking.toApplicationUpdate().metadata['paymentStatus']).toBe(
      'confirmed',
    );
  });

  it('markPaymentConfirmed avance à l’étape 3 sans validation admin', () => {
    const booking = Booking.fromPersistence({
      id: 'b1',
      reservationNumber: 'RES-1',
      requesterId: 'user1',
      status: 'PENDING',
      metadata: {
        totalAmount: 50,
        clientEmail: 'a@b.com',
        currentStep: 2,
        stepName: 'Étape 2 : Sélection du service',
        progressHistory: [
          { step: 1, completed: true, stepName: 'Étape 1 : Informations client' },
          { step: 2, completed: true, stepName: 'Étape 2 : Sélection du service' },
        ],
      },
    });

    booking.markPaymentConfirmed(confirmedProof);

    const meta = booking.toApplicationUpdate().metadata;
    expect(meta['currentStep']).toBe(3);
    expect(meta['stepName']).toBe('Étape 3 : Paiement');
    expect(meta['paymentPending']).toBe(false);

    const history = meta['progressHistory'] as Array<{
      step: number;
      completed: boolean;
      validatedByPayment?: boolean;
      data?: { paymentConfirmed?: boolean };
    }>;
    expect(history.find((h) => h.step === 3)).toMatchObject({
      completed: true,
      validatedByPayment: true,
      data: { paymentConfirmed: true, paymentPending: false },
    });
    expect(history.filter((h) => h.step <= 3).every((h) => h.completed)).toBe(
      true,
    );
  });

  it('markPaymentConfirmed ne recule pas si déjà à l’étape 4', () => {
    const booking = Booking.fromPersistence({
      id: 'b1',
      status: 'PENDING',
      metadata: {
        currentStep: 4,
        stepName: 'Étape 4 : Confirmation',
        progressHistory: [{ step: 4, completed: true }],
      },
    });

    booking.markPaymentConfirmed(confirmedProof);

    const meta = booking.toApplicationUpdate().metadata;
    expect(meta['currentStep']).toBe(4);
    expect(meta['stepName']).toBe('Étape 4 : Confirmation');
  });

  it('refuse la confirmation sur booking cancelled', () => {
    const booking = Booking.fromPersistence({
      id: 'b1',
      status: 'CANCELLED',
      metadata: {},
    });

    expect(() => booking.markPaymentConfirmed(confirmedProof)).toThrow(
      /cancelled/i,
    );
  });

  it('mappe completed persistence → FINISHED domaine', () => {
    const booking = Booking.fromPersistence({
      id: 'b1',
      status: 'completed',
      metadata: {},
    });
    expect(booking.status).toBe('FINISHED');
    expect(booking.toPersistenceStatus()).toBe('completed');
  });

  it('markConfirmationEmailSent est idempotent côté metadata', () => {
    const booking = Booking.fromPersistence({
      id: 'b1',
      status: 'CONFIRMED',
      metadata: { paymentStatus: 'confirmed' },
    });
    booking.markConfirmationEmailSent();
    expect(booking.confirmationEmailSent).toBe(true);
    expect(booking.metadata['confirmationEmailSent']).toBe(true);
  });

  it('isIdempotentReplayFor accepte la même preuve', () => {
    const booking = Booking.fromPersistence({
      id: 'b1',
      status: 'CONFIRMED',
      metadata: {
        paymentStatus: 'confirmed',
        paymentIntentId: 'pi_abc',
      },
    });
    expect(booking.isIdempotentReplayFor('pi_abc')).toBe(true);
  });

  it('isIdempotentReplayFor refuse une autre preuve', () => {
    const booking = Booking.fromPersistence({
      id: 'b1',
      status: 'CONFIRMED',
      metadata: {
        paymentStatus: 'confirmed',
        paymentIntentId: 'pi_abc',
      },
    });
    expect(() => booking.isIdempotentReplayFor('pi_other')).toThrow(
      /different payment proof/i,
    );
  });

  it('markPaymentEventsEmitted pose le flag metadata', () => {
    const booking = Booking.fromPersistence({
      id: 'b1',
      status: 'CONFIRMED',
      metadata: { paymentStatus: 'confirmed', paymentIntentId: 'pi_abc' },
    });
    booking.markPaymentEventsEmitted();
    expect(booking.paymentEventsEmitted).toBe(true);
    expect(booking.metadata['paymentEventsEmitted']).toBe(true);
  });
});
