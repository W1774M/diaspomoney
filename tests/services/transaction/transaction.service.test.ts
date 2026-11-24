// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  passThrough: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
  create: vi.fn(),
  getUserProfile: vi.fn(),
  detectAnomalies: vi.fn(async () => undefined),
  recordMetric: vi.fn(),
}));

vi.mock('@/lib/decorators/cache.decorator', () => ({
  Cacheable: h.passThrough,
  InvalidateCache: h.passThrough,
}));
vi.mock('@/lib/decorators/log.decorator', () => ({ Log: h.passThrough }));
vi.mock('@/lib/decorators/validate.decorator', () => ({ Validate: h.passThrough }));
vi.mock('@/lib/decorators/audit.decorator', () => ({ Audit: h.passThrough }));
vi.mock('@/lib/decorators/performance.decorator', () => ({
  Performance: h.passThrough,
}));
vi.mock('@/lib/decorators/transaction.decorator', () => ({
  Transaction: h.passThrough,
}));
vi.mock('@/repositories', () => ({
  getTransactionRepository: () => ({ create: h.create }),
}));
vi.mock('@/services/user/user.service', () => ({
  userService: { getUserProfile: h.getUserProfile },
}));
vi.mock('@/lib/security/advanced-security', () => ({
  securityManager: { detectAnomalies: h.detectAnomalies },
}));
vi.mock('@/lib/monitoring/advanced-monitoring', () => ({
  monitoringManager: { recordMetric: h.recordMetric },
}));
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

import { TransactionService } from '@/services/transaction/transaction.service';

describe('TransactionService.createTransaction', () => {
  const svc = TransactionService.getInstance();

  beforeEach(() => {
    vi.clearAllMocks();
    h.create.mockResolvedValue({
      id: 'tx_guest_1',
      amount: 100,
      currency: 'EUR',
    });
  });

  it('accepte un payeur/bénéficiaire guest-* sans getUserProfile (DIASPOMONEY-3C)', async () => {
    const guestId = 'guest-abc123-1700000000-xyz';

    const tx = await svc.createTransaction({
      payerId: guestId,
      beneficiaryId: guestId,
      amount: 100,
      currency: 'EUR',
      serviceType: 'HEALTH',
      serviceId: 'svc_1',
      description: 'Payment for booking booking_1',
      metadata: { bookingId: 'booking_1' },
    });

    expect(h.getUserProfile).not.toHaveBeenCalled();
    expect(h.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payerId: guestId,
        beneficiaryId: guestId,
        amount: 100,
        currency: 'EUR',
      }),
    );
    expect(tx.id).toBe('tx_guest_1');
  });

  it('vérifie toujours le profil pour un utilisateur authentifié', async () => {
    h.getUserProfile.mockResolvedValue({ id: 'user_1', isActive: true });

    await svc.createTransaction({
      payerId: 'user_1',
      beneficiaryId: 'user_1',
      amount: 50,
      currency: 'EUR',
      serviceType: 'BTP',
      serviceId: 'svc_2',
      description: 'Payment for booking booking_2',
    });

    expect(h.getUserProfile).toHaveBeenCalledWith('user_1');
    expect(h.getUserProfile).toHaveBeenCalledTimes(2);
    expect(h.create).toHaveBeenCalled();
  });
});
