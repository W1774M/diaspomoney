/**
 * GET/PUT/DELETE /api/service-options/[id]
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const {
  mockAuth,
  getServiceOptionById,
  updateServiceOption,
  deleteServiceOption,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  getServiceOptionById: vi.fn(),
  updateServiceOption: vi.fn(),
  deleteServiceOption: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/service/service.service', () => ({
  serviceService: {
    getServiceOptionById,
    updateServiceOption,
    deleteServiceOption,
  },
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

import { GET, PUT, DELETE } from '@/app/api/service-options/[id]/route';

const ID = 'opt-1';

function params(id = ID) {
  return { params: { id } };
}

describe('/api/service-options/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'a1', roles: [ROLES.ADMIN] },
    });
    getServiceOptionById.mockResolvedValue({ id: ID, label: 'Urgence', price: 20 });
    updateServiceOption.mockResolvedValue({ id: ID, label: 'Urgence+', price: 25 });
    deleteServiceOption.mockResolvedValue(true);
  });

  it('GET retourne l’option', async () => {
    const res = await GET(
      new NextRequest(`http://localhost/api/service-options/${ID}`),
      params(),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data.id).toBe(ID);
  });

  it('GET 404 si absente', async () => {
    getServiceOptionById.mockResolvedValue(null);
    expect(
      (
        await GET(
          new NextRequest(`http://localhost/api/service-options/${ID}`),
          params(),
        )
      ).status,
    ).toBe(404);
  });

  it('PUT refuse non-admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', roles: [] } });
    expect(
      (
        await PUT(
          new NextRequest(`http://localhost/api/service-options/${ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: 'X' }),
          }),
          params(),
        )
      ).status,
    ).toBe(403);
  });

  it('PUT met à jour', async () => {
    const res = await PUT(
      new NextRequest(`http://localhost/api/service-options/${ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: 'Urgence+', price: 25 }),
      }),
      params(),
    );
    expect(res.status).toBe(200);
    expect(updateServiceOption).toHaveBeenCalledWith(
      ID,
      expect.objectContaining({ label: 'Urgence+', price: 25 }),
    );
  });

  it('DELETE 404 si échec', async () => {
    deleteServiceOption.mockResolvedValue(false);
    expect(
      (
        await DELETE(
          new NextRequest(`http://localhost/api/service-options/${ID}`, {
            method: 'DELETE',
          }),
          params(),
        )
      ).status,
    ).toBe(404);
  });

  it('DELETE réussit', async () => {
    const res = await DELETE(
      new NextRequest(`http://localhost/api/service-options/${ID}`, {
        method: 'DELETE',
      }),
      params(),
    );
    expect(res.status).toBe(200);
  });
});
