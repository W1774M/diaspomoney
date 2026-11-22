import { describe, expect, it } from 'vitest';

import {
  collectPlatformPayments,
  countPayments,
  sumRevenue,
} from '@/services/statistics/platform-revenue';

const confirmedBooking = (amount: string | number, extra: Record<string, unknown> = {}, at = '2026-11-10T10:00:00Z') => ({
  createdAt: at,
  metadata: { paymentStatus: 'confirmed', totalAmount: amount, paymentConfirmedAt: at, ...extra },
});

describe('revenus plateforme', () => {
  it('compte les réservations au paiement confirmé (montants stockés en chaîne)', () => {
    // Forme des données de prod : 9 réservations confirmées, 0 transaction
    const bookings = ['2', '2', '2', '2', '2', '2', '40', '170', '60'].map((a, i) =>
      confirmedBooking(a, { paymentIntentId: `pi_${i}` }),
    );
    const payments = collectPlatformPayments([], [...bookings, { metadata: {} }]);
    expect(countPayments(payments)).toBe(9);
    expect(sumRevenue(payments)).toBe(282);
  });

  it('ignore les réservations non payées et les transactions non terminées', () => {
    const payments = collectPlatformPayments(
      [{ status: 'PENDING', amount: 99, createdAt: '2026-11-01' }],
      [{ metadata: { paymentStatus: 'pending', totalAmount: '50' } }, { metadata: { paymentStatus: 'processing', totalAmount: 10 } }],
    );
    expect(payments).toEqual([]);
    expect(sumRevenue(payments)).toBe(0);
  });

  it('ne compte pas deux fois un paiement présent en transaction et en réservation', () => {
    const payments = collectPlatformPayments(
      [{ status: 'COMPLETED', amount: 40, createdAt: '2026-11-02', metadata: { paymentIntentId: 'pi_x' } }],
      [confirmedBooking('40', { paymentIntentId: 'pi_x' }), confirmedBooking(10, { paymentIntentId: 'pi_y' })],
    );
    expect(countPayments(payments)).toBe(2);
    expect(sumRevenue(payments)).toBe(50);
  });

  it('filtre par période (date de confirmation du paiement)', () => {
    const payments = collectPlatformPayments(
      [],
      [confirmedBooking(10, {}, '2026-10-15T00:00:00Z'), confirmedBooking(20, {}, '2026-11-05T00:00:00Z')],
    );
    const nov = { from: new Date('2026-11-01T00:00:00Z'), to: new Date('2026-12-01T00:00:00Z') };
    expect(sumRevenue(payments, nov)).toBe(20);
    expect(countPayments(payments, nov)).toBe(1);
    expect(sumRevenue(payments, { from: new Date('2026-10-01T00:00:00Z') })).toBe(30);
  });
});
