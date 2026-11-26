// @vitest-environment node
/**
 * POST /api/maintenance/clear-fake-provider-ids : secret obligatoire, dry-run par défaut,
 * écriture seulement avec ?apply=1.
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ clear: vi.fn() }));
vi.mock('@/services/booking/clear-fake-provider-ids', () => ({ clearFakeProviderIds: h.clear }));

import { POST } from '@/app/api/maintenance/clear-fake-provider-ids/route';

const SECRET = 'secret-de-maintenance-de-test';
const call = async (query = '', authorization: string | null = `Bearer ${SECRET}`) => {
  const res = await POST(new NextRequest(`http://127.0.0.1:3000/api/maintenance/clear-fake-provider-ids${query}`, {
    method: 'POST',
    headers: authorization ? { authorization } : {},
  }));
  return { status: res.status, body: await res.json() };
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('MAINTENANCE_CRON_SECRET', SECRET);
  h.clear.mockImplementation(async ({ apply }: { apply: boolean }) => ({ apply, found: 3, cleared: apply ? 3 : 0, byValue: { 'consultation-medical': 3 } }));
});

describe('POST /api/maintenance/clear-fake-provider-ids', () => {
  it('refuse sans le bon secret', async () => {
    expect((await call('', null)).status).toBe(401);
    expect((await call('', 'Bearer faux')).status).toBe(401);
    expect(h.clear).not.toHaveBeenCalled();
  });

  it('dry-run par défaut', async () => {
    const { status, body } = await call();
    expect(status).toBe(200);
    expect(h.clear).toHaveBeenCalledWith({ apply: false });
    expect(body.report).toMatchObject({ apply: false, found: 3, cleared: 0 });
  });

  it('écrit seulement avec ?apply=1', async () => {
    expect((await call('?apply=true')).body.report.apply).toBe(false);
    const { body } = await call('?apply=1');
    expect(h.clear).toHaveBeenLastCalledWith({ apply: true });
    expect(body.report).toMatchObject({ apply: true, cleared: 3 });
  });
});
