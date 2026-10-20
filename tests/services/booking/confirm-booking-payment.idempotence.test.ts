/**
 * Idempotence ConfirmBookingPayment — confirm-payment ↔ webhook
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockVerifyPaymentProof,
  mockGetBookingById,
  mockUpdateBooking,
  mockSendPaymentConfirmationEmail,
  mockEmitPaymentSucceeded,
  mockEmitBookingConfirmed,
} = vi.hoisted(() => ({
  mockVerifyPaymentProof: vi.fn(),
  mockGetBookingById: vi.fn(),
  mockUpdateBooking: vi.fn(),
  mockSendPaymentConfirmationEmail: vi.fn(),
  mockEmitPaymentSucceeded: vi.fn(),
  mockEmitBookingConfirmed: vi.fn(),
}));

vi.mock('@/services/payment/payment.service', () => ({
  paymentService: {
    verifyPaymentProof: mockVerifyPaymentProof,
  },
}));

vi.mock('@/services/booking/booking.service', () => ({
  bookingService: {
    getBookingById: mockGetBookingById,
    updateBooking: mockUpdateBooking,
  },
}));

vi.mock('@/services/email/email.service', () => ({
  emailService: {
    sendPaymentConfirmationEmail: mockSendPaymentConfirmationEmail,
    sendCustomEmail: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('@/lib/events', () => ({
  paymentEvents: {
    emitPaymentSucceeded: mockEmitPaymentSucceeded,
  },
  bookingEvents: {
    emitBookingConfirmed: mockEmitBookingConfirmed,
  },
}));

vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

import { ConfirmBookingPaymentService } from '@/services/booking/confirm-booking-payment.service';

const PROOF_OK = {
  success: true,
  paymentIntentId: 'pi_shared',
  metadata: {
    status: 'succeeded',
    amount: 50,
    currency: 'EUR',
    paymentStatus: 'confirmed',
  },
};

function pendingBooking() {
  return {
    id: 'booking_1',
    reservationNumber: 'RES-1',
    requesterId: 'user_1',
    status: 'pending',
    metadata: {
      totalAmount: 50,
      clientEmail: 'client@example.com',
      serviceLabel: 'Consult',
      paymentStatus: 'pending',
    },
  };
}

function confirmedBookingWithFlags() {
  return {
    id: 'booking_1',
    reservationNumber: 'RES-1',
    requesterId: 'user_1',
    status: 'confirmed',
    metadata: {
      totalAmount: 50,
      clientEmail: 'client@example.com',
      serviceLabel: 'Consult',
      paymentStatus: 'confirmed',
      paymentIntentId: 'pi_shared',
      confirmationEmailSent: true,
      paymentEventsEmitted: true,
    },
  };
}

describe('ConfirmBookingPayment idempotence (API ↔ webhook)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ConfirmBookingPaymentService.resetInstanceForTests();
    mockVerifyPaymentProof.mockResolvedValue(PROOF_OK);
    mockSendPaymentConfirmationEmail.mockResolvedValue(true);
    mockEmitPaymentSucceeded.mockResolvedValue(undefined);
    mockEmitBookingConfirmed.mockResolvedValue(undefined);
    mockUpdateBooking.mockResolvedValue({});
  });

  it('premier passage confirme, envoie email et émet les events', async () => {
    mockGetBookingById.mockResolvedValue(pendingBooking());
    const svc = ConfirmBookingPaymentService.getInstance();

    const result = await svc.execute({
      proofId: 'pi_shared',
      bookingId: 'booking_1',
      expectedAmount: 50,
      expectedCurrency: 'EUR',
    });

    expect(result.success).toBe(true);
    expect(result.alreadyConfirmed).toBe(false);
    expect(result.idempotent).toBe(false);
    expect(result.emailSent).toBe(true);
    expect(result.eventsEmitted).toBe(true);
    expect(mockEmitPaymentSucceeded).toHaveBeenCalledTimes(1);
    expect(mockEmitBookingConfirmed).toHaveBeenCalledTimes(1);
    expect(mockSendPaymentConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(mockUpdateBooking).toHaveBeenCalled();

    const updateArg = mockUpdateBooking.mock.calls[0][1];
    expect(updateArg.metadata.paymentEventsEmitted).toBe(true);
    expect(updateArg.metadata.confirmationEmailSent).toBe(true);
    expect(updateArg.metadata.paymentIntentId).toBe('pi_shared');
  });

  it('second passage (webhook après API) est idempotent — pas de re-émission', async () => {
    mockGetBookingById.mockResolvedValue(confirmedBookingWithFlags());
    const svc = ConfirmBookingPaymentService.getInstance();

    const result = await svc.execute({
      proofId: 'pi_shared',
      bookingId: 'booking_1',
      expectedAmount: 50,
      expectedCurrency: 'EUR',
    });

    expect(result.success).toBe(true);
    expect(result.alreadyConfirmed).toBe(true);
    expect(result.idempotent).toBe(true);
    expect(result.emailSent).toBe(false);
    expect(result.eventsEmitted).toBe(false);
    expect(mockEmitPaymentSucceeded).not.toHaveBeenCalled();
    expect(mockEmitBookingConfirmed).not.toHaveBeenCalled();
    expect(mockSendPaymentConfirmationEmail).not.toHaveBeenCalled();
    expect(mockUpdateBooking).not.toHaveBeenCalled();
  });

  it('refuse une autre preuve si déjà confirmé', async () => {
    mockGetBookingById.mockResolvedValue(confirmedBookingWithFlags());
    mockVerifyPaymentProof.mockResolvedValue({
      ...PROOF_OK,
      paymentIntentId: 'pi_other',
      metadata: { ...PROOF_OK.metadata },
    });
    const svc = ConfirmBookingPaymentService.getInstance();

    const result = await svc.execute({
      proofId: 'pi_other',
      bookingId: 'booking_1',
      expectedAmount: 50,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/different payment proof/i);
    expect(mockEmitPaymentSucceeded).not.toHaveBeenCalled();
  });
});
