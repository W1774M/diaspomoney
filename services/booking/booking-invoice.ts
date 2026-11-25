/**
 * Facture acquittée d'une réservation payée.
 *
 * Partagé par le chemin canonique (confirm-booking-payment) et par le rattrapage
 * des réservations payées avant que ce chemin ne facture (backfill-booking-invoices).
 * Idempotent : invoiceService.issuePaidInvoiceForPayment ne crée qu'une facture
 * par paymentIntentId.
 */
import type { Booking } from '@/domain/booking';
import { invoiceService } from '@/services/invoice/invoice.service';

export interface IssueBookingInvoiceInput {
  booking: Booking;
  /** Document booking brut (providerId vit hors metadata) */
  raw?: unknown;
  /** Clé d'idempotence : pi_… (ou cs_… à défaut) */
  paymentKey: string | undefined;
  amount: number | undefined;
  currency?: string | undefined;
  checkoutSessionId?: string | undefined;
  paidAt?: Date | undefined;
  source: string;
}

export type IssueBookingInvoiceResult =
  | { status: 'issued'; invoiceId: string; invoiceNumber: string; created: boolean }
  | { status: 'skipped'; reason: 'missing_payment_key' | 'missing_amount' | 'missing_client' };

/** Lève si la création échoue ; l'appelant décide s'il bloque ou non. */
export async function issueInvoiceForPaidBooking(
  input: IssueBookingInvoiceInput,
): Promise<IssueBookingInvoiceResult> {
  const { booking } = input;
  if (!input.paymentKey) return { status: 'skipped', reason: 'missing_payment_key' };
  if (input.amount == null || !Number.isFinite(input.amount)) {
    return { status: 'skipped', reason: 'missing_amount' };
  }
  if (!booking.clientId) return { status: 'skipped', reason: 'missing_client' };

  const rawBooking = (input.raw || {}) as {
    providerId?: unknown;
    metadata?: Record<string, unknown>;
  };
  const providerIdRaw = rawBooking.providerId ?? rawBooking.metadata?.['providerId'];
  const providerId = providerIdRaw ? String(providerIdRaw) : undefined;

  const { invoice, created } = await invoiceService.issuePaidInvoiceForPayment({
    paymentIntentId: input.paymentKey,
    userId: booking.clientId,
    amount: input.amount,
    currency: (input.currency || booking.expectedCurrency || 'EUR').toUpperCase(),
    description: booking.serviceLabel || 'Service DiaspoMoney',
    bookingId: booking.id,
    providerId,
    paidAt: input.paidAt,
    metadata: {
      source: input.source,
      ...(booking.reservationNumber ? { reservationNumber: booking.reservationNumber } : {}),
      ...(input.checkoutSessionId ? { checkoutSessionId: input.checkoutSessionId } : {}),
    },
  });

  return {
    status: 'issued',
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    created,
  };
}
