/**
 * POST/DELETE /api/services/associations
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const { mockAuth, associateOptionToService, dissociateOptionFromService } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  associateOptionToService: vi.fn(),
  dissociateOptionFromService: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/service/service.service', () => ({
  serviceService: { associateOptionToService, dissociateOptionFromService },
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { DELETE, POST } from '@/app/api/services/associations/route';

function call(method: 'POST' | 'DELETE', body: unknown) {
  const request = new NextRequest('http://localhost/api/services/associations', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return method === 'POST' ? POST(request) : DELETE(request);
}

describe('/api/services/associations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'admin', roles: [ROLES.ADMIN] } });
    associateOptionToService.mockResolvedValue(undefined);
    dissociateOptionFromService.mockResolvedValue(undefined);
  });

  it('refuse sans session ou sans rôle admin', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await call('POST', { serviceId: 's', optionId: 'o' })).status).toBe(401);
    expect((await call('DELETE', { serviceId: 's', optionId: 'o' })).status).toBe(401);

    mockAuth.mockResolvedValue({ user: { id: 'u', roles: [ROLES.CUSTOMER] } });
    expect((await call('POST', { serviceId: 's', optionId: 'o' })).status).toBe(403);
    expect((await call('DELETE', { serviceId: 's', optionId: 'o' })).status).toBe(403);
  });

  it('associe puis dissocie une option', async () => {
    const created = await call('POST', { serviceId: 's1', optionId: 'o1' });
    expect(created.status).toBe(200);
    expect(associateOptionToService).toHaveBeenCalledWith('s1', 'o1');

    const removed = await call('DELETE', { serviceId: 's1', optionId: 'o1' });
    expect(removed.status).toBe(200);
    expect(dissociateOptionFromService).toHaveBeenCalledWith('s1', 'o1');
  });

  it('rejette un corps incomplet et une erreur du service', async () => {
    expect((await call('POST', { serviceId: '' })).status).toBe(400);
    expect((await call('DELETE', {})).status).toBe(400);

    associateOptionToService.mockRejectedValue(new Error('db'));
    expect((await call('POST', { serviceId: 's1', optionId: 'o1' })).status).toBe(500);
  });
});
