/**
 * InvoiceService — chemins unitaires (repo mocké)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  findById,
  findByUser,
  findInvoicesWithFilters,
  create,
  update,
  findOrCreateForPayment,
  draft,
  send,
  markPaid,
} = vi.hoisted(() => {
  const toCreatePayload = vi.fn(() => ({
    userId: 'u1',
    amount: 50,
    currency: 'EUR',
    tax: 0,
    totalAmount: 50,
    status: 'PAID',
    dueDate: new Date(),
    items: [{ description: 'Svc', quantity: 1, unitPrice: 50, total: 50 }],
  }));
  const markPaid = vi.fn();
  const send = vi.fn();
  const draft = vi.fn(() => ({ send, markPaid, toCreatePayload }));
  return {
    findById: vi.fn(),
    findByUser: vi.fn(),
    findInvoicesWithFilters: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findOrCreateForPayment: vi.fn(),
    draft,
    send,
    markPaid,
  };
});

vi.mock('@/repositories', () => ({
  getInvoiceRepository: () => ({
    findById,
    findByUser,
    findInvoicesWithFilters,
    create,
    update,
    findOrCreateForPayment,
  }),
}));
vi.mock('@/domain/billing', () => ({
  Invoice: { draft },
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/decorators/log.decorator', () => ({
  Log: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
}));
vi.mock('@/lib/decorators/cache.decorator', () => ({
  Cacheable: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
  InvalidateCache: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
}));
vi.mock('@/lib/decorators/validate.decorator', () => ({
  Validate: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
}));
vi.mock('@/lib/decorators/audit.decorator', () => ({
  Audit: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
}));
vi.mock('@/lib/decorators/performance.decorator', () => ({
  Performance: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
}));
vi.mock('@/lib/decorators/transaction.decorator', () => ({
  Transaction: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
}));

import { InvoiceService } from '@/services/invoice/invoice.service';

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = InvoiceService.getInstance();
    findById.mockResolvedValue({
      id: 'inv1',
      userId: 'u1',
      amount: 50,
      invoiceNumber: 'INV-1',
    });
    findByUser.mockResolvedValue({ data: [], total: 0 });
    findInvoicesWithFilters.mockResolvedValue({ data: [], total: 0 });
    findOrCreateForPayment.mockResolvedValue({
      invoice: { id: 'inv-paid', status: 'PAID' },
      created: true,
    });
  });

  it('getInvoiceById renvoie la facture', async () => {
    const inv = await service.getInvoiceById('inv1');
    expect(inv.id).toBe('inv1');
  });

  it('getInvoiceById throw si absente', async () => {
    findById.mockResolvedValue(null);
    await expect(service.getInvoiceById('missing')).rejects.toThrow(
      /Facture non trouvée/,
    );
  });

  it('getUserInvoices délègue au repo', async () => {
    await service.getUserInvoices('u1', { limit: 10, page: 1 });
    expect(findByUser).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ limit: 10, page: 1 }),
    );
  });

  it('getInvoices applique les filtres', async () => {
    await service.getInvoices({ status: 'PAID' }, { limit: 5, page: 2 });
    expect(findInvoicesWithFilters).toHaveBeenCalledWith(
      { status: 'PAID' },
      expect.objectContaining({ limit: 5, page: 2 }),
    );
  });

  it('issuePaidInvoiceForPayment crée une facture payée idempotente', async () => {
    const result = await service.issuePaidInvoiceForPayment({
      paymentIntentId: 'pi_1',
      userId: 'u1',
      amount: 50,
      currency: 'EUR',
      description: 'Consultation',
      bookingId: 'b1',
      providerId: 'p1',
    });

    expect(draft).toHaveBeenCalled();
    expect(send).toHaveBeenCalled();
    expect(markPaid).toHaveBeenCalled();
    expect(findOrCreateForPayment).toHaveBeenCalledWith(
      'pi_1',
      expect.objectContaining({
        userId: 'u1',
        bookingId: 'b1',
        providerId: 'p1',
        status: 'PAID',
      }),
    );
    expect(result.created).toBe(true);
  });
});
