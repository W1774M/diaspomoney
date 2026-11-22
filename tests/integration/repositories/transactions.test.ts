/**
 * Méthodes métier du repository des transactions, et pagination par décalage des réservations,
 * sur la base de test : filtres, pagination (y compris par décalage, utilisée par les statistiques), totaux,
 * mises à jour de statut. (Le CRUD commun est couvert par crud.test.ts.)
 */
import { ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';

import { mongoClient } from '@/lib/mongodb';
import { MongoTransactionRepository } from '@/repositories/implementations/MongoTransactionRepository';

const DAY = 24 * 60 * 60 * 1000;
const ago = (ms: number) => new Date(Date.now() - ms);
const uid = () => new ObjectId().toString();

describe('MongoTransactionRepository', () => {
  const repo = new MongoTransactionRepository();
  // create() impose createdAt = maintenant : une date passée est posée directement en base
  const tx = async ({ createdAt, ...extra }: Record<string, unknown>) => {
    const t = await repo.create({
      ...BASE,
      ...extra,
    } as never);
    if (createdAt) {
      await (await mongoClient).db().collection('transactions').updateOne({ _id: new ObjectId(t.id) }, { $set: { createdAt } });
    }
    return t;
  };
  const BASE = {
      payerId: 'payer',
      beneficiaryId: 'benef',
      amount: 10,
      currency: 'EUR',
      fees: 0,
      totalAmount: 10,
      serviceType: 'HEALTH',
      status: 'COMPLETED',
      type: 'PAYMENT',
      paymentMethod: 'CARD',
      paymentProvider: 'STRIPE',
  };
  const amounts = (r: { data: Array<{ amount: number }> }) => r.data.map((t) => t.amount).sort((a, b) => a - b);

  it('crée, lit par intention de paiement et met à jour le statut et les métadonnées', async () => {
    const t = await tx({ paymentIntentId: 'pi_123', metadata: { a: 1 } });
    expect(await repo.findByPaymentIntentId('pi_123')).toMatchObject({ id: t.id, amount: 10 });
    expect(await repo.findByPaymentIntentId('pi_inconnu')).toBeNull();

    expect(await repo.updateStatus(t.id, 'REFUNDED' as never)).toBe(true);
    expect(await repo.updateStatus(uid(), 'REFUNDED' as never)).toBe(false);

    const completedAt = new Date();
    const updated = await repo.updateWithMetadata(t.id, { status: 'COMPLETED' as never, completedAt, failureReason: 'x', metadata: { b: 2 } });
    expect(updated).toMatchObject({ status: 'COMPLETED', failureReason: 'x', metadata: { a: 1, b: 2 } });
    expect(updated?.completedAt).toEqual(completedAt);
  });

  it('filtre par payeur, bénéficiaire et statut', async () => {
    const p = uid();
    await tx({ payerId: p, amount: 1 });
    await tx({ payerId: p, amount: 2, status: 'FAILED' });
    await tx({ beneficiaryId: p, amount: 3 });
    expect(amounts(await repo.findByPayer(p))).toEqual([1, 2]);
    expect(amounts(await repo.findByBeneficiary(p))).toEqual([3]);
    expect((await repo.findByStatus('FAILED' as never)).data.map((t) => t.payerId)).toContain(p);
  });

  it('applique chaque filtre de findTransactionsWithFilters', async () => {
    const p = uid();
    await tx({ payerId: p, amount: 5, createdAt: ago(10 * DAY) });
    await tx({ payerId: p, amount: 50, currency: 'XOF', paymentMethod: 'MOBILE_MONEY', paymentProvider: 'WAVE', serviceType: 'EDUCATION', serviceId: 's1' });
    await tx({ payerId: p, amount: 500, status: 'PENDING' });
    const f = (extra: Record<string, unknown>) => repo.findTransactionsWithFilters({ payerId: p, ...extra } as never);

    expect(amounts(await f({}))).toEqual([5, 50, 500]);
    expect(amounts(await f({ status: 'PENDING' }))).toEqual([500]);
    expect(amounts(await f({ currency: 'XOF' }))).toEqual([50]);
    expect(amounts(await f({ paymentMethod: 'MOBILE_MONEY' }))).toEqual([50]);
    expect(amounts(await f({ paymentProvider: 'WAVE' }))).toEqual([50]);
    expect(amounts(await f({ serviceType: 'EDUCATION' }))).toEqual([50]);
    expect(amounts(await f({ serviceId: 's1' }))).toEqual([50]);
    expect(amounts(await f({ minAmount: 40 }))).toEqual([50, 500]);
    expect(amounts(await f({ maxAmount: 40 }))).toEqual([5]);
    expect(amounts(await f({ minAmount: 10, maxAmount: 100 }))).toEqual([50]);
    expect(amounts(await f({ dateFrom: ago(DAY) }))).toEqual([50, 500]);
    expect(amounts(await f({ dateTo: ago(DAY) }))).toEqual([5]);
    expect(amounts(await f({ dateFrom: ago(20 * DAY), dateTo: ago(DAY) }))).toEqual([5]);
    expect(amounts(await f({ beneficiaryId: 'benef' }))).toEqual([5, 50, 500]);
  });

  it('pagine par numéro de page et par décalage (statistiques : page 1 + offset)', async () => {
    const p = uid();
    for (let i = 1; i <= 5; i++) await tx({ payerId: p, amount: i, createdAt: new Date(Date.UTC(2026, 0, i)) });
    const sort = { createdAt: 1 as const };

    const byPage = await repo.findTransactionsWithFilters({ payerId: p } as never, { limit: 2, page: 2, sort });
    expect(byPage.data.map((t) => t.amount)).toEqual([3, 4]);

    // statistics.service parcourt les pages avec { page: 1, offset } : l'offset doit primer
    const byOffset = await repo.findTransactionsWithFilters({ payerId: p } as never, { limit: 2, page: 1, offset: 4, sort } as never);
    expect(byOffset.data.map((t) => t.amount)).toEqual([5]);
  });

  it('totalise par utilisateur (payeur ou bénéficiaire), avec filtres', async () => {
    const u = uid();
    await tx({ payerId: u, amount: 10 });
    await tx({ beneficiaryId: u, amount: 20, currency: 'XOF' });
    await tx({ payerId: u, amount: 40, status: 'FAILED' });
    expect(await repo.calculateTotalByUser(u)).toBe(70);
    expect(await repo.calculateTotalByUser(u, { status: 'COMPLETED' } as never)).toBe(30);
    expect(await repo.calculateTotalByUser(u, { currency: 'XOF' } as never)).toBe(20);
    expect(await repo.calculateTotalByUser(uid())).toBe(0);
  });
});

describe('MongoBookingRepository : pagination par décalage (statistiques)', () => {
  it('respecte offset même quand page est fourni', async () => {
    const { MongoBookingRepository } = await import('@/repositories/implementations/MongoBookingRepository');
    const repo = new MongoBookingRepository();
    const requesterId = uid();
    for (let i = 0; i < 5; i++) {
      await repo.create({ requesterId, providerId: uid(), serviceId: `s${i}`, serviceType: 'HEALTH', status: 'PENDING', appointmentDate: new Date(Date.now() + DAY) } as never);
    }
    const all = await repo.findBookingsWithFilters({ requesterId } as never, { limit: 10, page: 1 });
    expect(all.data).toHaveLength(5);
    const rest = await repo.findBookingsWithFilters({ requesterId } as never, { limit: 2, page: 1, offset: 4 } as never);
    expect(rest.data).toHaveLength(1);
    const page2 = await repo.findBookingsWithFilters({ requesterId } as never, { limit: 2, page: 2 });
    expect(page2.data).toHaveLength(2);
  });
});
