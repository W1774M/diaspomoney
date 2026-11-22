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
  mockIssuePaidInvoice,
} = vi.hoisted(() => ({
  mockIssuePaidInvoice: vi.fn(),
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

vi.mock('@/services/invoice/invoice.service', () => ({
  invoiceService: {
    issuePaidInvoiceForPayment: mockIssuePaidInvoice,
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
      invoiceId: 'inv_1',
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
    mockIssuePaidInvoice.mockResolvedValue({
      invoice: { id: 'inv_1', invoiceNumber: 'INV-2026-000001' },
      created: true,
    });
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

    const updateArg = mockUpdateBooking.mock.calls[0]![1];
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
    expect(mockIssuePaidInvoice).not.toHaveBeenCalled();
  });
});

describe('ConfirmBookingPayment — facture acquittée', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ConfirmBookingPaymentService.resetInstanceForTests();
    mockVerifyPaymentProof.mockResolvedValue(PROOF_OK);
    mockSendPaymentConfirmationEmail.mockResolvedValue(true);
    mockEmitPaymentSucceeded.mockResolvedValue(undefined);
    mockEmitBookingConfirmed.mockResolvedValue(undefined);
    mockUpdateBooking.mockResolvedValue({});
    mockIssuePaidInvoice.mockResolvedValue({
      invoice: { id: 'inv_1', invoiceNumber: 'INV-2026-000001' },
      created: true,
    });
  });

  it('émet la facture au premier passage et la rattache au booking', async () => {
    mockGetBookingById.mockResolvedValue({ ...pendingBooking(), providerId: 'prov_1' });

    const result = await ConfirmBookingPaymentService.getInstance().execute({
      proofId: 'pi_shared',
      bookingId: 'booking_1',
    });

    expect(result.invoiceId).toBe('inv_1');
    expect(result.invoiceCreated).toBe(true);
    expect(mockIssuePaidInvoice).toHaveBeenCalledTimes(1);
    expect(mockIssuePaidInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentIntentId: 'pi_shared',
        userId: 'user_1',
        amount: 50,
        currency: 'EUR',
        description: 'Consult',
        bookingId: 'booking_1',
        providerId: 'prov_1',
      }),
    );
    const updateArg = mockUpdateBooking.mock.calls[0]![1];
    expect(updateArg.metadata.invoiceId).toBe('inv_1');
    expect(updateArg.metadata.invoiceNumber).toBe('INV-2026-000001');
  });

  it('rattrape la facture d’un booking confirmé avant le correctif', async () => {
    const before = confirmedBookingWithFlags();
    delete (before.metadata as Record<string, unknown>)['invoiceId'];
    mockGetBookingById.mockResolvedValue(before);

    const result = await ConfirmBookingPaymentService.getInstance().execute({
      proofId: 'pi_shared',
      bookingId: 'booking_1',
    });

    expect(result.alreadyConfirmed).toBe(true);
    expect(result.idempotent).toBe(false);
    expect(result.eventsEmitted).toBe(false);
    expect(mockEmitPaymentSucceeded).not.toHaveBeenCalled();
    expect(mockIssuePaidInvoice).toHaveBeenCalledTimes(1);
    expect(mockUpdateBooking.mock.calls[0]![1].metadata.invoiceId).toBe('inv_1');
  });

  it('un échec de facturation ne fait pas échouer la confirmation', async () => {
    mockGetBookingById.mockResolvedValue(pendingBooking());
    mockIssuePaidInvoice.mockRejectedValue(new Error('mongo down'));

    const result = await ConfirmBookingPaymentService.getInstance().execute({
      proofId: 'pi_shared',
      bookingId: 'booking_1',
    });

    expect(result.success).toBe(true);
    expect(result.invoiceId).toBeUndefined();
    // Le booking ne garde pas d'invoiceId : le prochain passage réessaiera
    expect(mockUpdateBooking.mock.calls[0]![1].metadata.invoiceId).toBeUndefined();
  });

  it('pas de facture tant que le paiement est en cours (processing)', async () => {
    mockGetBookingById.mockResolvedValue(pendingBooking());
    mockVerifyPaymentProof.mockResolvedValue({
      ...PROOF_OK,
      metadata: { ...PROOF_OK.metadata, paymentStatus: 'processing', status: 'processing' },
    });

    await ConfirmBookingPaymentService.getInstance().execute({
      proofId: 'pi_shared',
      bookingId: 'booking_1',
      acceptProcessing: true,
    });

    expect(mockIssuePaidInvoice).not.toHaveBeenCalled();
  });
});
