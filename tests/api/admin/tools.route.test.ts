/**
 * GET /api/admin/tools
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiErrors } from '@/lib/api/error-handler';
import { ROLES } from '@/lib/constants';

const { requireApiRoles, buildAdminToolLinks } = vi.hoisted(() => ({
  requireApiRoles: vi.fn(),
  buildAdminToolLinks: vi.fn(() => [
    { name: 'Grafana', url: 'https://grafana.example' },
  ]),
}));

vi.mock('@/lib/api/auth', () => ({ requireApiRoles }));
vi.mock('@/lib/admin-tools', () => ({ buildAdminToolLinks }));

import { GET } from '@/app/api/admin/tools/route';

describe('GET /api/admin/tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiRoles.mockResolvedValue({
      user: { id: 'sa-1', roles: [ROLES.SUPERADMIN] },
    });
  });

  it('refuse sans SUPERADMIN', async () => {
    requireApiRoles.mockRejectedValue(ApiErrors.FORBIDDEN);
    const res = await GET(new NextRequest('http://localhost/api/admin/tools'));
    expect(res.status).toBe(403);
  });

  it('retourne les liens d’outils', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/tools'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.tools).toEqual([
      { name: 'Grafana', url: 'https://grafana.example' },
    ]);
    expect(buildAdminToolLinks).toHaveBeenCalled();
    expect(res.headers.get('Cache-Control')).toMatch(/no-store/);
  });
});
