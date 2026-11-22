/**
 * Rattrapage des factures des réservations payées avant que le chemin canonique
 * (confirm-booking-payment) ne facture.
 *
 * Cible : réservations au paiement confirmé (metadata.paymentStatus = confirmed)
 * sans metadata.invoiceId. Pour chacune, émet la facture acquittée (= reçu) datée
 * de la confirmation du paiement, puis rattache invoiceId à la réservation.
 *
 * - Dry-run par défaut : rien n'est écrit, la réponse liste ce qui serait fait.
 * - Idempotent : une seule facture par paymentIntentId, relançable sans risque.
 * - Aucun e-mail ni événement : seule la facturation est rattrapée.
 */
import { Booking } from '@/domain/booking';
import { invalidateAppCache } from '@/lib/cache/redis';
import { childLogger } from '@/lib/logger';
import { getMongoClient } from '@/lib/mongodb';
import { issueInvoiceForPaidBooking } from '@/services/booking/booking-invoice';
import * as Sentry from '@sentry/nextjs';
import type { Document, WithId } from 'mongodb';

const log = childLogger({ component: 'backfillBookingInvoices' });

export interface BackfillOptions {
  /** false (défaut) : dry-run, aucune écriture */
  apply?: boolean;
  /** Plafond de réservations traitées par appel */
  limit?: number;
}

export interface BackfillCandidate {
  bookingId: string;
  reservationNumber?: string | undefined;
  amount?: number | undefined;
  paidAt: string;
}

export interface BackfillReport {
  dryRun: boolean;
  scanned: number;
  /** Factures créées par cet appel */
  created: number;
  /** Facture déjà présente pour ce paiement : seulement rattachée à la réservation */
  linked: number;
  candidates: BackfillCandidate[];
  skipped: Array<{ bookingId: string; reason: string }>;
  failed: Array<{ bookingId: string; error: string }>;
}

function toDate(...values: unknown[]): Date {
  for (const v of values) {
    if (!v) continue;
    const d = v instanceof Date ? v : new Date(String(v));
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

/** Filtre Mongo des réservations à rattraper (exporté pour les tests). */
export const BACKFILL_FILTER = {
  'metadata.paymentStatus': { $regex: '^confirmed$', $options: 'i' },
  $or: [
    { 'metadata.invoiceId': { $exists: false } },
    { 'metadata.invoiceId': null },
    { 'metadata.invoiceId': '' },
  ],
};

function toDomain(doc: WithId<Document>): Booking {
  const id = (v: unknown) => (v == null ? undefined : String(v));
  return Booking.fromPersistence({
    id: String(doc._id),
    ...(doc['reservationNumber'] ? { reservationNumber: String(doc['reservationNumber']) } : {}),
    ...(id(doc['userId']) ? { userId: id(doc['userId'])! } : {}),
    ...(id(doc['requesterId']) ? { requesterId: id(doc['requesterId'])! } : {}),
    ...(doc['status'] ? { status: String(doc['status']) } : {}),
    metadata: (doc['metadata'] || {}) as Record<string, unknown>,
  });
}

export async function backfillBookingInvoices(
  options: BackfillOptions = {},
): Promise<BackfillReport> {
  const apply = options.apply === true;
  const limit = Math.min(Math.max(options.limit ?? 500, 1), 5000);

  const client = await getMongoClient();
  const bookings = client.db().collection('bookings');
  const docs = await bookings
    .find(BACKFILL_FILTER)
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();

  const report: BackfillReport = {
    dryRun: !apply,
    scanned: docs.length,
    created: 0,
    linked: 0,
    candidates: [],
    skipped: [],
    failed: [],
  };

  for (const doc of docs) {
    const booking = toDomain(doc);
    const metadata = booking.metadata;
    const checkoutSessionId = metadata['checkoutSessionId'] as string | undefined;
    const paymentKey =
      booking.paymentIntentId ||
      checkoutSessionId ||
      (metadata['paymentConfirmationKey'] as string | undefined);
    const paidAt = toDate(metadata['paymentConfirmedAt'], doc['updatedAt'], doc['createdAt']);

    if (!paymentKey) {
      report.skipped.push({ bookingId: booking.id, reason: 'missing_payment_key' });
      continue;
    }
    if (booking.expectedAmount == null) {
      report.skipped.push({ bookingId: booking.id, reason: 'missing_amount' });
      continue;
    }
    if (!booking.clientId) {
      report.skipped.push({ bookingId: booking.id, reason: 'missing_client' });
      continue;
    }

    report.candidates.push({
      bookingId: booking.id,
      reservationNumber: booking.reservationNumber,
      amount: booking.expectedAmount,
      paidAt: paidAt.toISOString(),
    });
    if (!apply) continue;

    try {
      const result = await issueInvoiceForPaidBooking({
        booking,
        raw: doc,
        paymentKey,
        amount: booking.expectedAmount,
        checkoutSessionId,
        paidAt,
        source: 'backfill-booking-invoices',
      });
      if (result.status === 'skipped') {
        report.skipped.push({ bookingId: booking.id, reason: result.reason });
        continue;
      }
      // $set ciblé : ne touche ni au statut (pas de notifications) ni au reste des metadata
      await bookings.updateOne(
        { _id: doc._id },
        {
          $set: {
            'metadata.invoiceId': result.invoiceId,
            'metadata.invoiceNumber': result.invoiceNumber,
            updatedAt: new Date(),
          },
        },
      );
      if (result.created) report.created += 1;
      else report.linked += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report.failed.push({ bookingId: booking.id, error: message });
      log.error({ error, bookingId: booking.id }, 'Backfill invoice failed');
      Sentry.captureException(error, {
        tags: { component: 'backfillBookingInvoices' },
        extra: { bookingId: booking.id },
      });
    }
  }

  if (apply && report.created + report.linked > 0) {
    await invalidateAppCache('BookingService:*');
  }

  log.info(
    {
      dryRun: report.dryRun,
      scanned: report.scanned,
      created: report.created,
      linked: report.linked,
      skipped: report.skipped.length,
      failed: report.failed.length,
    },
    'Backfill des factures de réservations payées',
  );
  return report;
}
