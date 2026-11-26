/**
 * Revenus encaissés par la plateforme, à partir des vraies données.
 *
 * Deux sources coexistent :
 * - les transactions COMPLETED (chemins legacy : process-payment-with-card, payments/process) ;
 * - les réservations dont le paiement Stripe est confirmé (chemin canonique
 *   confirm-booking-payment : webhook + /api/bookings/confirm-payment), qui ne crée
 *   pas de transaction. C'est le cas de tous les paiements en production.
 *
 * Un même paiement peut apparaître dans les deux (le legacy crée la transaction puis
 * la réservation avec metadata.paymentIntentId) : on dédoublonne par paymentIntentId.
 */
import { TRANSACTION_STATUSES } from '@/lib/constants';

export interface RevenueTransaction {
  status?: string;
  amount?: number;
  createdAt?: Date | string;
  paymentIntentId?: string;
  metadata?: Record<string, unknown>;
}

export interface RevenueBooking {
  createdAt?: Date | string;
  updatedAt?: Date | string;
  metadata?: Record<string, unknown>;
}

export interface RevenuePayment {
  amount: number;
  date: Date;
  source: 'transaction' | 'booking';
}

function toAmount(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const n = parseFloat(value.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function toDate(...candidates: unknown[]): Date {
  for (const c of candidates) {
    if (!c) continue;
    const d = c instanceof Date ? c : new Date(String(c));
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(0);
}

export function isBookingPaymentConfirmed(booking: RevenueBooking): boolean {
  const status = booking.metadata?.['paymentStatus'];
  return typeof status === 'string' && status.toLowerCase() === 'confirmed';
}

/** Liste des paiements encaissés, dédoublonnés entre transactions et réservations. */
export function collectPlatformPayments(
  transactions: readonly RevenueTransaction[],
  bookings: readonly RevenueBooking[],
): RevenuePayment[] {
  const payments: RevenuePayment[] = [];
  const seenIntents = new Set<string>();

  for (const t of transactions) {
    if (t.status !== TRANSACTION_STATUSES.COMPLETED) continue;
    const intent =
      t.paymentIntentId || (t.metadata?.['paymentIntentId'] as string | undefined);
    if (intent) seenIntents.add(intent);
    payments.push({
      amount: toAmount(t.amount),
      date: toDate(t.createdAt),
      source: 'transaction',
    });
  }

  for (const b of bookings) {
    if (!isBookingPaymentConfirmed(b)) continue;
    const intent = b.metadata?.['paymentIntentId'];
    if (typeof intent === 'string' && seenIntents.has(intent)) continue;
    if (typeof intent === 'string') seenIntents.add(intent);
    payments.push({
      amount: toAmount(b.metadata?.['totalAmount']),
      date: toDate(b.metadata?.['paymentConfirmedAt'], b.updatedAt, b.createdAt),
      source: 'booking',
    });
  }

  return payments;
}

export function sumRevenue(
  payments: readonly RevenuePayment[],
  range?: { from?: Date; to?: Date },
): number {
  const total = payments
    .filter(p => (!range?.from || p.date >= range.from) && (!range?.to || p.date < range.to))
    .reduce((sum, p) => sum + p.amount, 0);
  return Math.round(total * 100) / 100;
}

export function countPayments(
  payments: readonly RevenuePayment[],
  range?: { from?: Date; to?: Date },
): number {
  return payments.filter(
    p => (!range?.from || p.date >= range.from) && (!range?.to || p.date < range.to),
  ).length;
}
