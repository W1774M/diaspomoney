/**
 * Chemin canonique de confirmation de paiement (webhook Stripe + /api/bookings/confirm-payment)
 * sur une vraie base : la facture acquittée (= reçu) est créée une seule fois par paiement,
 * même quand le webhook et la confirmation arrivent en même temps.
 *
 * Seuls Stripe (preuve de paiement), l'e-mail et le bus d'événements sont simulés.
 */
import { MongoClient, ObjectId } from 'mongodb';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockVerifyPaymentProof } = vi.hoisted(() => ({
  mockVerifyPaymentProof: vi.fn(),
}));

vi.mock('@/services/payment/payment.service', () => ({
  paymentService: { verifyPaymentProof: mockVerifyPaymentProof },
}));
vi.mock('@/services/email/email.service', () => ({
  emailService: {
    sendPaymentConfirmationEmail: vi.fn().mockResolvedValue(true),
    sendCustomEmail: vi.fn().mockResolvedValue(true),
  },
}));
vi.mock('@/lib/events', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/events')>();
  return {
    ...actual,
    paymentEvents: { emitPaymentSucceeded: vi.fn().mockResolvedValue(undefined) },
    bookingEvents: { emitBookingConfirmed: vi.fn().mockResolvedValue(undefined) },
  };
});

import { bookingService } from '@/services/booking/booking.service';
import { ConfirmBookingPaymentService } from '@/services/booking/confirm-booking-payment.service';
import { getInvoiceRepository } from '@/repositories';

const db = () =>
  ((globalThis as any).__DIASPOMONEY_TEST_MONGO__ as MongoClient).db(process.env['MONGODB_DB']);

const SERVICE_ID = 'consultation-facture-test';
const oid = () => new ObjectId().toString();

function proofFor(paymentIntentId: string, amount = 19) {
  return {
    success: true,
    paymentIntentId,
    metadata: { status: 'succeeded', amount, currency: 'eur', paymentStatus: 'confirmed' },
  };
}

async function createBooking(requesterId: string, providerId: string) {
  const booking = await bookingService.createBooking({
    requesterId,
    providerId,
    serviceId: SERVICE_ID,
    serviceType: 'HEALTH',
    appointmentDate: new Date(Date.now() + 3 * 86_400_000),
    timeslot: '10:00',
    consultationMode: 'cabinet',
    recipient: { firstName: 'Awa', lastName: 'Diallo', phone: '+237600000000' },
    metadata: {
      totalAmount: 19,
      clientEmail: 'client@test.fr',
      serviceLabel: 'Consultation généraliste',
    },
  } as never);
  return booking.id!;
}

describe('ConfirmBookingPayment : facture acquittée idempotente (intégration)', () => {
  beforeEach(async () => {
    ConfirmBookingPaymentService.resetInstanceForTests();
    await db().collection('services').insertOne({
      id: SERVICE_ID,
      name: 'Consultation généraliste',
      category: 'HEALTH',
      price: 19,
      isActive: true,
    });
  });

  it('webhook et confirmation simultanés : une seule facture PAID, visible en reçu', async () => {
    const requesterId = oid();
    const providerId = oid();
    const bookingId = await createBooking(requesterId, providerId);
    const pi = `pi_${oid()}`;
    mockVerifyPaymentProof.mockResolvedValue(proofFor(pi));

    const svc = ConfirmBookingPaymentService.getInstance();
    const [fromWebhook, fromConfirm] = await Promise.all([
      svc.execute({ proofId: pi, bookingId, acceptProcessing: true, skipEmail: true }),
      svc.execute({ proofId: pi, bookingId, expectedAmount: 19, expectedCurrency: 'EUR' }),
    ]);

    expect(fromWebhook.success).toBe(true);
    expect(fromConfirm.success).toBe(true);
    expect(fromWebhook.invoiceId).toBeTruthy();
    expect(fromConfirm.invoiceId).toBe(fromWebhook.invoiceId);
    expect([fromWebhook.invoiceCreated, fromConfirm.invoiceCreated].filter(Boolean)).toHaveLength(1);

    const docs = await db().collection('invoices').find({ paymentIntentId: pi }).toArray();
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      status: 'PAID',
      userId: requesterId,
      customerId: requesterId,
      providerId,
      bookingId,
      amount: 19,
      currency: 'EUR',
    });
    expect(docs[0]!['paidAt']).toBeInstanceOf(Date);
    expect(docs[0]!['invoiceNumber']).toMatch(/^INV-\d{4}-\d{6}$/);

    // Reçu : même requête que /api/payment-receipts (factures PAID de l'utilisateur)
    const receipts = await getInvoiceRepository().findInvoicesWithFilters(
      { userId: requesterId, status: 'PAID' },
      { limit: 50, page: 1, offset: 0 },
    );
    expect(receipts.total).toBe(1);
    expect(receipts.data[0]!.metadata).toMatchObject({ paymentIntentId: pi, providerId });

    // Le booking garde la référence de la facture
    const booking = await bookingService.getBookingById(bookingId);
    expect((booking.metadata as Record<string, unknown>)['invoiceId']).toBe(fromWebhook.invoiceId);
  });

  it('un rejeu après coup ne crée pas de seconde facture', async () => {
    const bookingId = await createBooking(oid(), oid());
    const pi = `pi_${oid()}`;
    mockVerifyPaymentProof.mockResolvedValue(proofFor(pi));
    const svc = ConfirmBookingPaymentService.getInstance();

    const first = await svc.execute({ proofId: pi, bookingId, skipEmail: true });
    const replay = await svc.execute({ proofId: pi, bookingId, skipEmail: true });

    expect(first.invoiceCreated).toBe(true);
    expect(replay.idempotent).toBe(true);
    expect(replay.invoiceCreated).toBe(false);
    expect(replay.invoiceId).toBe(first.invoiceId);
    expect(await db().collection('invoices').countDocuments({ paymentIntentId: pi })).toBe(1);
  });

  it('rattrape la facture d’une réservation payée avant le correctif', async () => {
    const bookingId = await createBooking(oid(), oid());
    const pi = `pi_${oid()}`;
    // État prod d'avant : paiement confirmé, events émis, mais aucune facture
    await bookingService.updateBooking(bookingId, {
      status: 'CONFIRMED',
      metadata: {
        totalAmount: 19,
        clientEmail: 'client@test.fr',
        serviceLabel: 'Consultation généraliste',
        paymentStatus: 'confirmed',
        paymentIntentId: pi,
        confirmationEmailSent: true,
        paymentEventsEmitted: true,
      },
    } as never);
    mockVerifyPaymentProof.mockResolvedValue(proofFor(pi));

    const result = await ConfirmBookingPaymentService.getInstance().execute({
      proofId: pi,
      bookingId,
    });

    expect(result.alreadyConfirmed).toBe(true);
    expect(result.eventsEmitted).toBe(false);
    expect(result.invoiceCreated).toBe(true);
    expect(await db().collection('invoices').countDocuments({ paymentIntentId: pi })).toBe(1);
  });
});
