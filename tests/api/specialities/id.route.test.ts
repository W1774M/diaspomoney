/**
 * GET /api/specialities/[id]
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ID = '507f1f77bcf86cd799439011';

const { mockAuth, getSpecialityById } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  getSpecialityById: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/speciality/speciality.service', () => ({
  specialityService: { getSpecialityById },
}));

import { GET } from '@/app/api/specialities/[id]/route';

describe('GET /api/specialities/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'u1', roles: ['ADMIN'] } });
    getSpecialityById.mockResolvedValue({ id: ID, name: 'Cardio' });
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(
      new NextRequest(`http://localhost/api/specialities/${ID}`),
      { params: { id: ID } },
    );
    expect(res.status).toBe(401);
  });

  it('répond 400 pour un id invalide', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/specialities/bad'),
      { params: { id: 'bad' } },
    );
    expect(res.status).toBe(400);
  });

  it('répond 404 si introuvable', async () => {
    getSpecialityById.mockResolvedValue(null);
    const res = await GET(
      new NextRequest(`http://localhost/api/specialities/${ID}`),
      { params: { id: ID } },
    );
    expect(res.status).toBe(404);
  });

  it('retourne la spécialité', async () => {
    const res = await GET(
      new NextRequest(`http://localhost/api/specialities/${ID}`),
      { params: { id: ID } },
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.speciality.name).toBe('Cardio');
  });
});
