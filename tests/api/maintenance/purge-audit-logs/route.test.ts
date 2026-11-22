// @vitest-environment node
/**
 * POST /api/maintenance/purge-audit-logs : secret obligatoire (comparaison en temps constant),
 * purge des deux journaux d'audit, cache vidé.
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  audit: vi.fn(),
  pci: vi.fn(),
  invalidateAppCache: vi.fn(),
}));
vi.mock('@/repositories', () => ({
  getAuditLogRepository: () => ({ deleteExpiredLogs: h.audit }),
  getPCIAuditLogRepository: () => ({ deleteExpiredLogs: h.pci }),
}));
vi.mock('@/lib/cache/redis', () => ({ invalidateAppCache: h.invalidateAppCache }));

import { POST } from '@/app/api/maintenance/purge-audit-logs/route';

const SECRET = 'secret-de-maintenance-de-test';
const call = async (authorization?: string) => {
  const res = await POST(new NextRequest('http://127.0.0.1:3000/api/maintenance/purge-audit-logs', {
    method: 'POST',
    headers: authorization ? { authorization } : {},
  }));
  return { status: res.status, body: await res.json() };
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('MAINTENANCE_CRON_SECRET', SECRET);
  vi.stubEnv('NODE_ENV', 'production');
  h.audit.mockResolvedValue(3);
  h.pci.mockResolvedValue(1);
});

describe('POST /api/maintenance/purge-audit-logs', () => {
  it('purge les deux journaux et vide leur cache', async () => {
    expect(await call(`Bearer ${SECRET}`)).toEqual({ status: 200, body: { success: true, deleted: { auditLogs: 3, pciAuditLogs: 1 } } });
    expect(h.audit).toHaveBeenCalledTimes(1);
    expect(h.pci).toHaveBeenCalledTimes(1);
    expect(h.invalidateAppCache).toHaveBeenCalledWith('AuditLog');
  });

  it.each([
    ['sans en-tête', undefined],
    ['mauvais secret', 'Bearer mauvais'],
    ['secret de même longueur', `Bearer ${'x'.repeat(SECRET.length)}`],
    ['sans « Bearer »', SECRET],
  ])('refuse un appel %s, sans rien purger', async (_cas, auth) => {
    expect((await call(auth)).status).toBe(401);
    expect(h.audit).not.toHaveBeenCalled();
  });

  it('reste fermée si le secret n’est pas configuré, sauf en développement local', async () => {
    vi.stubEnv('MAINTENANCE_CRON_SECRET', '');
    expect((await call('Bearer ')).status).toBe(403);
    expect(h.audit).not.toHaveBeenCalled();

    vi.stubEnv('NODE_ENV', 'development');
    expect((await call()).status).toBe(200);
  });

  it('remonte une erreur de base', async () => {
    h.pci.mockRejectedValueOnce(new Error('mongo HS'));
    expect((await call(`Bearer ${SECRET}`)).status).toBe(500);
  });
});
