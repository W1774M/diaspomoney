/**
 * POST/DELETE /api/services/associations
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const { mockAuth, associateOptionToService, dissociateOptionFromService } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    associateOptionToService: vi.fn(),
    dissociateOptionFromService: vi.fn(),
  }));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/service/service.service', () => ({
  serviceService: { associateOptionToService, dissociateOptionFromService },
}));

import { POST, DELETE } from '@/app/api/services/associations/route';

function req(method: 'POST' | 'DELETE', body: unknown) {
  const init = {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
  const request = new NextRequest(
    'http://localhost/api/services/associations',
    init,
  );
  return method === 'POST' ? POST(request) : DELETE(request);
}

describe('/api/services/associations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', roles: [ROLES.ADMIN] },
    });
    associateOptionToService.mockResolvedValue(undefined);
    dissociateOptionFromService.mockResolvedValue(undefined);
  });

  it('POST répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect(
      (await req('POST', { serviceId: 's1', optionId: 'o1' })).status,
    ).toBe(401);
  });

  it('POST répond 403 si non admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', roles: [ROLES.CUSTOMER] },
    });
    expect(
      (await req('POST', { serviceId: 's1', optionId: 'o1' })).status,
    ).toBe(403);
  });

  it('POST associe une option', async () => {
    const res = await req('POST', { serviceId: 's1', optionId: 'o1' });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(associateOptionToService).toHaveBeenCalledWith('s1', 'o1');
  });

  it('DELETE dissocie une option', async () => {
    const res = await req('DELETE', { serviceId: 's1', optionId: 'o1' });
    expect(res.status).toBe(200);
    expect(dissociateOptionFromService).toHaveBeenCalledWith('s1', 'o1');
  });
});
