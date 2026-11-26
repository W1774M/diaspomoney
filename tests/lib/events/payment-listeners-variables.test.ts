// @vitest-environment node
/**
 * Notifications de paiement : toutes les variables du modèle sont transmises, la transaction
 * est retrouvée par son id en base ou par l'intention de paiement Stripe (pi_…), et rien ne
 * part vers un destinataire inconnu.
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  send: vi.fn(async () => ({ id: 'n1' })),
  findById: vi.fn(),
  findByPaymentIntentId: vi.fn(),
}));

vi.mock('@/services/notification/notification.service', () => ({
  notificationService: { sendNotification: h.send },
}));
vi.mock('@/repositories', () => ({
  getTransactionRepository: () => ({ findById: h.findById, findByPaymentIntentId: h.findByPaymentIntentId }),
}));

import { paymentEvents } from '@/lib/events';
import { findEventTransaction, setupPaymentEventListeners } from '@/lib/events/listeners/PaymentEventListeners';

const TX = {
  id: '64b000000000000000000001',
  payerId: 'payer-1',
  amount: 42,
  currency: 'EUR',
  serviceType: 'HEALTH',
  description: 'Consultation généraliste',
};
const sent = () => (h.send.mock.calls.at(-1) as unknown as [Record<string, any>] | undefined)?.[0];

beforeAll(() => setupPaymentEventListeners());
beforeEach(() => {
  vi.clearAllMocks();
  h.findById.mockResolvedValue(null);
  h.findByPaymentIntentId.mockResolvedValue(null);
});

describe('findEventTransaction', () => {
  it('cherche par id en base puis par intention de paiement', async () => {
    h.findById.mockResolvedValueOnce(TX);
    expect(await findEventTransaction(TX.id)).toBe(TX);
    expect(h.findByPaymentIntentId).not.toHaveBeenCalled();

    h.findByPaymentIntentId.mockResolvedValueOnce(TX);
    expect(await findEventTransaction('pi_123')).toBe(TX);
    expect(h.findById).toHaveBeenCalledTimes(1); // pi_… n'est pas un ObjectId : pas de findById
    expect(await findEventTransaction('')).toBeNull();
  });

  it('renvoie null si la base répond en erreur', async () => {
    h.findByPaymentIntentId.mockRejectedValueOnce(new Error('down'));
    expect(await findEventTransaction('pi_x')).toBeNull();
  });
});

describe('notifications de paiement', () => {
  it('paiement réussi : service et date renseignés', async () => {
    h.findByPaymentIntentId.mockResolvedValue(TX);
    await paymentEvents.emitPaymentSucceeded({
      transactionId: 'pi_ok', amount: 42, currency: 'EUR', userId: 'payer-1', provider: 'STRIPE',
      timestamp: new Date('2026-11-25T10:00:00Z'),
    });
    expect(sent()).toMatchObject({
      recipient: 'payer-1',
      template: 'payment_success',
      data: { serviceName: 'Consultation généraliste', transactionDate: '25 novembre 2026', amount: 42, currency: 'EUR' },
    });
  });

  it('paiement réussi sans transaction connue : nom générique', async () => {
    await paymentEvents.emitPaymentSucceeded({
      transactionId: 'pi_inconnu', amount: 1, currency: 'EUR', userId: 'u', provider: 'STRIPE', timestamp: new Date(),
    });
    expect(sent()?.['data'].serviceName).toBe('votre service');
  });

  it('paiement échoué : envoyé au payeur, avec montant, devise, raison et contact', async () => {
    h.findByPaymentIntentId.mockResolvedValue(TX);
    await paymentEvents.emitPaymentFailed('pi_ko', 'Carte refusée');
    expect(sent()).toMatchObject({
      recipient: 'payer-1',
      template: 'payment_failed',
      data: { amount: 42, currency: 'EUR', reason: 'Carte refusée', supportEmail: expect.stringContaining('@') },
    });
  });

  it('paiement échoué ou remboursé sans transaction connue : aucune notification', async () => {
    await paymentEvents.emitPaymentFailed('pi_inconnu', 'x');
    await paymentEvents.emitPaymentRefunded('pi_inconnu', 5);
    expect(h.send).not.toHaveBeenCalled();
  });

  it('remboursement : devise de la transaction', async () => {
    h.findById.mockResolvedValue(TX);
    await paymentEvents.emitPaymentRefunded(TX.id, 42);
    expect(sent()).toMatchObject({ recipient: 'payer-1', template: 'payment_refunded', data: { amount: 42, currency: 'EUR' } });
  });
});
