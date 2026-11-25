/**
 * Rattrapage des factures sur une vraie base, avec des réservations à la forme de
 * la prod : paiement confirmé, montant en chaîne, paymentIntentId, aucune facture.
 */
import { MongoClient, ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';

import { getInvoiceRepository } from '@/repositories';
import { backfillBookingInvoices } from '@/services/booking/backfill-booking-invoices';
import { invoiceService } from '@/services/invoice/invoice.service';

const db = () =>
  ((globalThis as any).__DIASPOMONEY_TEST_MONGO__ as MongoClient).db(process.env['MONGODB_DB']);

const CONFIRMED_AT = '2026-03-14T09:30:00.000Z';

function paidBooking(totalAmount: string, extra: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(),
    userId: new ObjectId().toString(),
    providerId: new ObjectId().toString(),
    status: 'CONFIRMED',
    reservationNumber: `RES-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date('2026-03-13T00:00:00Z'),
    updatedAt: new Date('2026-03-14T10:00:00Z'),
    metadata: {
      paymentStatus: 'confirmed',
      totalAmount,
      paymentIntentId: `pi_${new ObjectId().toString()}`,
      paymentConfirmedAt: CONFIRMED_AT,
      serviceLabel: 'Consultation',
      paymentEventsEmitted: true,
      ...extra,
    },
  };
}

async function seed() {
  const paid = ['2', '40', '170'].map((a) => paidBooking(a));
  const others = [
    // non payée
    { _id: new ObjectId(), userId: 'u', status: 'PENDING', metadata: {} },
    // déjà facturée
    paidBooking('60', { invoiceId: 'inv_existant' }),
    // payée sans preuve exploitable
    paidBooking('10', { paymentIntentId: undefined }),
  ];
  await db().collection('bookings').insertMany([...paid, ...others] as never[]);
  return { paid, alreadyInvoiced: others[1]!, noProof: others[2]! };
}

describe('backfillBookingInvoices (intégration)', () => {
  it('dry-run : liste les réservations à rattraper sans rien écrire', async () => {
    const { paid, noProof } = await seed();

    const report = await backfillBookingInvoices();

    expect(report.dryRun).toBe(true);
    expect(report.scanned).toBe(4);
    expect(report.candidates.map((c) => c.bookingId).sort()).toEqual(
      paid.map((b) => b._id.toString()).sort(),
    );
    expect(report.candidates[0]!.paidAt).toBe(CONFIRMED_AT);
    expect(report.skipped).toEqual([{ bookingId: noProof._id.toString(), reason: 'missing_payment_key' }]);
    expect(report.created).toBe(0);
    expect(await db().collection('invoices').countDocuments()).toBe(0);
  });

  it('apply : une facture PAID datée du paiement par réservation, visible en reçu, et relançable', async () => {
    const { paid } = await seed();

    const report = await backfillBookingInvoices({ apply: true });
    expect(report).toMatchObject({ dryRun: false, created: 3, linked: 0, failed: [] });

    for (const b of paid) {
      const invoices = await db()
        .collection('invoices')
        .find({ paymentIntentId: b.metadata.paymentIntentId })
        .toArray();
      expect(invoices).toHaveLength(1);
      expect(invoices[0]).toMatchObject({
        status: 'PAID',
        userId: b.userId,
        providerId: b.providerId,
        bookingId: b._id.toString(),
        amount: parseFloat(b.metadata.totalAmount),
      });
      expect((invoices[0]!['paidAt'] as Date).toISOString()).toBe(CONFIRMED_AT);

      const booking = await db().collection('bookings').findOne({ _id: b._id });
      expect(booking!['metadata']['invoiceId']).toBe(invoices[0]!._id.toString());
      // le reste des metadata est conservé
      expect(booking!['metadata']['paymentEventsEmitted']).toBe(true);
      expect(booking!['status']).toBe('CONFIRMED');

      const receipts = await getInvoiceRepository().findInvoicesWithFilters(
        { userId: b.userId, status: 'PAID' },
        { limit: 10, page: 1, offset: 0 },
      );
      expect(receipts.total).toBe(1);
    }

    // Relance : plus rien à faire
    const again = await backfillBookingInvoices({ apply: true });
    expect(again).toMatchObject({ scanned: 1, created: 0, linked: 0 });
    expect(await db().collection('invoices').countDocuments()).toBe(3);
  });

  it('rattache sans doublon une facture déjà créée pour le paiement', async () => {
    const b = paidBooking('40');
    await db().collection('bookings').insertOne(b as never);
    const existing = await invoiceService.issuePaidInvoiceForPayment({
      paymentIntentId: b.metadata.paymentIntentId,
      userId: b.userId,
      amount: 40,
      currency: 'EUR',
      description: 'Consultation',
    });

    const report = await backfillBookingInvoices({ apply: true });

    expect(report).toMatchObject({ created: 0, linked: 1 });
    expect(await db().collection('invoices').countDocuments()).toBe(1);
    const booking = await db().collection('bookings').findOne({ _id: b._id });
    expect(booking!['metadata']['invoiceId']).toBe(existing.invoice.id);
  });
});
