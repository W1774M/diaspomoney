/**
 * Services utilisateur, transaction, facture et statistiques, sur une vraie base.
 */
import { MongoClient, ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';

import { invoiceService } from '@/services/invoice/invoice.service';
import { statisticsService } from '@/services/statistics/statistics.service';
import { transactionService } from '@/services/transaction/transaction.service';
import { userService } from '@/services/user/user.service';

const db = () =>
  ((globalThis as any).__DIASPOMONEY_TEST_MONGO__ as MongoClient).db(process.env['MONGODB_DB']);

/** Crée un utilisateur actif en base et renvoie son id. */
async function seedUser(overrides: Record<string, unknown> = {}): Promise<string> {
  const _id = new ObjectId();
  await db().collection('users').insertOne({
    _id,
    email: `user-${_id.toString()}@test.fr`,
    firstName: 'Awa',
    lastName: 'Diallo',
    name: 'Awa Diallo',
    roles: ['CUSTOMER'],
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
  return _id.toString();
}

describe('userService (intégration)', () => {
  it('lit et met à jour un profil', async () => {
    const userId = await seedUser();

    const profile = await userService.getUserProfile(userId);
    expect(profile.email).toContain('@test.fr');

    const updated = await userService.updateUserProfile(userId, { firstName: 'Aminata', phone: '+33600000000' } as any);
    expect(updated.firstName).toBe('Aminata');
  });

  it('signale un profil inexistant', async () => {
    await expect(userService.getUserProfile(new ObjectId().toString())).rejects.toThrow();
  });

  it('liste les utilisateurs avec filtres', async () => {
    await seedUser({ roles: ['PROVIDER'] });
    await seedUser();
    const result = await userService.getUsers({ limit: 10 } as any);
    expect(result).toBeTruthy();
  });

  it('gère les bénéficiaires d’un utilisateur', async () => {
    const userId = await seedUser();
    const beneficiary = await userService.addBeneficiary(userId, {
      firstName: 'Mamadou',
      lastName: 'Diallo',
      relationship: 'PARENT',
      location: { address: 'Rue Joss', city: 'Douala', country: 'CM' },
    } as any);
    expect(beneficiary.firstName).toBe('Mamadou');

    const list = await userService.getBeneficiaries(userId);
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  it('enregistre des documents KYC et expose le statut', async () => {
    const userId = await seedUser();
    const kyc = await userService.submitKYCDocuments(userId, [
      { type: 'ID_CARD', fileUrl: 'https://exemple.test/id.pdf', status: 'PENDING', uploadedAt: new Date() } as any,
    ]);
    expect(kyc).toBeTruthy();
    expect(await userService.getKYCStatus(userId)).toBeTruthy();
  });

  it('exporte les données personnelles (RGPD)', async () => {
    const userId = await seedUser();
    const exported = await userService.exportUserData(userId);
    expect(exported).toBeTruthy();
  });
});

describe('transactionService (intégration)', () => {
  it('crée une transaction, la relit, met à jour son statut et calcule des stats', async () => {
    const payerId = await seedUser();
    const beneficiaryId = await seedUser();

    const tx = await transactionService.createTransaction({
      payerId,
      beneficiaryId,
      amount: 19,
      currency: 'EUR',
      serviceType: 'HEALTH',
      serviceId: 'consultation',
      description: 'Consultation',
    });
    expect(tx.id).toBeTruthy();

    expect(await transactionService.getTransaction(tx.id, payerId)).toBeTruthy();
    expect((await transactionService.getTransactions(payerId)).length).toBeGreaterThanOrEqual(1);

    const completed = await transactionService.updateTransactionStatus(tx.id, 'COMPLETED' as any);
    expect(completed.status).toBe('COMPLETED');

    const stats = await transactionService.getTransactionStats(payerId);
    expect(stats.totalTransactions).toBeGreaterThanOrEqual(1);

    expect(await transactionService.getUserIdFromTransaction(tx.id)).toBeTruthy();
  });

  it('refuse une transaction pour un payeur inconnu', async () => {
    await expect(
      transactionService.createTransaction({
        payerId: new ObjectId().toString(),
        beneficiaryId: new ObjectId().toString(),
        amount: 10,
        currency: 'EUR',
        serviceType: 'HEALTH',
        serviceId: 'x',
        description: 'x',
      }),
    ).rejects.toThrow();
  });
});

describe('invoiceService (intégration)', () => {
  it('crée une facture, la relit, la marque payée puis la supprime', async () => {
    const userId = await seedUser();

    const invoice = await invoiceService.createInvoice({
      userId,
      amount: 19,
      currency: 'EUR',
      items: [{ description: 'Consultation', quantity: 1, unitPrice: 19, total: 19 }],
      dueDate: new Date(Date.now() + 7 * 86_400_000),
    });
    const id = String(invoice.id ?? (invoice as any)._id);
    expect(id).toBeTruthy();

    expect((await invoiceService.getInvoiceById(id)).amount).toBe(19);
    expect((await invoiceService.getUserInvoices(userId)).data.length).toBeGreaterThanOrEqual(1);
    expect((await invoiceService.getInvoices({ userId })).data.length).toBeGreaterThanOrEqual(1);

    const updated = await invoiceService.updateInvoice(id, { amount: 29 });
    expect(updated.amount).toBe(29);

    // Cycle imposé par le domaine : DRAFT → SENT → PAID (DRAFT → PAID est refusé).
    await expect(invoiceService.markInvoiceAsPaid(id)).rejects.toThrow(/DRAFT → PAID/);
    expect(await invoiceService.updateInvoiceStatus(id, 'SENT' as any)).toBe(true);
    expect(await invoiceService.markInvoiceAsPaid(id)).toBe(true);
    expect(await invoiceService.getOverdueInvoices({ limit: 10 })).toBeTruthy();
    expect(await invoiceService.deleteInvoice(id)).toBe(true);
  });

  it('signale une facture inexistante', async () => {
    await expect(invoiceService.getInvoiceById(new ObjectId().toString())).rejects.toThrow();
  });
});

describe('statisticsService (intégration)', () => {
  it('calcule les statistiques personnelles d’un utilisateur', async () => {
    const userId = await seedUser();
    const stats = await statisticsService.getPersonalStatistics(userId);
    expect(stats).toBeTruthy();
  });
});
