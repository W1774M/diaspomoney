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
});
