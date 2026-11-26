// @vitest-environment node
/**
 * POST /api/maintenance/backfill-invoices : secret obligatoire, dry-run par défaut,
 * écriture seulement avec ?apply=1.
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ backfill: vi.fn() }));
vi.mock('@/services/booking/backfill-booking-invoices', () => ({
  backfillBookingInvoices: h.backfill,
}));

import { POST } from '@/app/api/maintenance/backfill-invoices/route';

const SECRET = 'secret-de-maintenance-de-test';
const call = async (query = '', authorization: string | null = `Bearer ${SECRET}`) => {
  const res = await POST(
    new NextRequest(`http://127.0.0.1:3000/api/maintenance/backfill-invoices${query}`, {
      method: 'POST',
      headers: authorization ? { authorization } : {},
    }),
  );
  return { status: res.status, body: await res.json() };
};

const report = (extra: Record<string, unknown> = {}) => ({
  dryRun: true, scanned: 9, created: 0, linked: 0, candidates: [], skipped: [], failed: [], ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('MAINTENANCE_CRON_SECRET', SECRET);
  vi.stubEnv('NODE_ENV', 'production');
  h.backfill.mockResolvedValue(report());
});

describe('POST /api/maintenance/backfill-invoices', () => {
  it('dry-run par défaut', async () => {
    const { status, body } = await call();
    expect(status).toBe(200);
    expect(body).toEqual({ success: true, report: report() });
    expect(h.backfill).toHaveBeenCalledWith({ apply: false });
  });

  it('écrit seulement avec apply=1 et transmet la limite', async () => {
    h.backfill.mockResolvedValue(report({ dryRun: false, created: 9 }));
    const { body } = await call('?apply=1&limit=20');
    expect(h.backfill).toHaveBeenCalledWith({ apply: true, limit: 20 });
    expect(body.report.created).toBe(9);
  });

  it('apply=true (au lieu de 1) reste un dry-run', async () => {
    await call('?apply=true');
    expect(h.backfill).toHaveBeenCalledWith({ apply: false });
  });

  it('signale les échecs par success: false', async () => {
    h.backfill.mockResolvedValue(report({ failed: [{ bookingId: 'b1', error: 'x' }] }));
    expect((await call('?apply=1')).body.success).toBe(false);
  });

  it.each([
    ['sans en-tête', null],
    ['mauvais secret', 'Bearer mauvais'],
  ])('refuse l’appel %s', async (_label, authorization) => {
    const { status } = await call('?apply=1', authorization);
    expect(status).toBe(401);
    expect(h.backfill).not.toHaveBeenCalled();
  });
});
