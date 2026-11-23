/**
 * GET/POST /api/specialities
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const { mockAuth, getAllSpecialities, createSpeciality } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  getAllSpecialities: vi.fn(),
  createSpeciality: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/speciality/speciality.service', () => ({
  specialityService: { getAllSpecialities, createSpeciality },
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

import { GET, POST } from '@/app/api/specialities/route';

function get(qs = '') {
  return GET(new NextRequest(`http://localhost/api/specialities${qs}`));
}

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/specialities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('/api/specialities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    getAllSpecialities.mockResolvedValue([{ _id: 's1', name: 'Cardiologie', isActive: true }]);
    createSpeciality.mockResolvedValue({ _id: 's2', name: 'Dermatologie' });
  });

  it('liste les spécialités actives pour un invité', async () => {
    const res = await get('?group=HEALTH');
    expect(res.status).toBe(200);
    expect(getAllSpecialities).toHaveBeenCalledWith({
      group: 'HEALTH',
      isActive: true,
    });
  });

  it('permet à un admin de filtrer isActive=false', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'a1', roles: [ROLES.ADMIN] },
    });
    await get('?isActive=false');
    expect(getAllSpecialities).toHaveBeenCalledWith({ isActive: false });
  });

  it('refuse POST sans session', async () => {
    expect((await post({ name: 'X', type: 'HEALTH' })).status).toBe(401);
  });

  it('refuse POST sans rôle admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', roles: [ROLES.PROVIDER] },
    });
    expect((await post({ name: 'X', type: 'HEALTH' })).status).toBe(403);
  });

  it('crée une spécialité admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'a1', roles: [ROLES.ADMIN] },
    });
    const res = await post({
      name: 'Dermatologie',
      type: 'HEALTH',
      description: 'Peau',
    });
    expect(res.status).toBe(200);
    expect(createSpeciality).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Dermatologie',
        group: 'HEALTH',
        description: 'Peau',
      }),
    );
  });
});
