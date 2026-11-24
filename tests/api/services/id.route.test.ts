/**
 * GET/PUT/DELETE /api/services/[id]
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const { mockAuth, getService, updateService, deleteService } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  getService: vi.fn(),
  updateService: vi.fn(),
  deleteService: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/service/service.service', () => ({
  serviceService: { getService, updateService, deleteService },
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

import { GET, PUT, DELETE } from '@/app/api/services/[id]/route';

const ID = 'svc-1';

function params(id = ID) {
  return { params: { id } };
}

describe('/api/services/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'a1', roles: [ROLES.ADMIN] },
    });
    getService.mockResolvedValue({ id: ID, label: 'Consultation', price: 50 });
    updateService.mockResolvedValue({ id: ID, label: 'Consultation+', price: 60 });
    deleteService.mockResolvedValue(true);
  });

  it('GET retourne le service', async () => {
    const res = await GET(
      new NextRequest(`http://localhost/api/services/${ID}`),
      params(),
    );
    expect(res.status).toBe(200);
  });

  it('GET 404 si absent', async () => {
    getService.mockResolvedValue(null);
    expect(
      (
        await GET(new NextRequest(`http://localhost/api/services/${ID}`), params())
      ).status,
    ).toBe(404);
  });

  it('PUT refuse sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect(
      (
        await PUT(
          new NextRequest(`http://localhost/api/services/${ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: 'X' }),
          }),
          params(),
        )
      ).status,
    ).toBe(401);
  });

  it('PUT met à jour en admin', async () => {
    const res = await PUT(
      new NextRequest(`http://localhost/api/services/${ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: 'Consultation+', price: 60 }),
      }),
      params(),
    );
    expect(res.status).toBe(200);
    expect(updateService).toHaveBeenCalledWith(
      ID,
      expect.objectContaining({ label: 'Consultation+', price: 60 }),
    );
  });

  it('DELETE 404 si échec', async () => {
    deleteService.mockResolvedValue(false);
    expect(
      (
        await DELETE(
          new NextRequest(`http://localhost/api/services/${ID}`, {
            method: 'DELETE',
          }),
          params(),
        )
      ).status,
    ).toBe(404);
  });

  it('DELETE réussit', async () => {
    expect(
      (
        await DELETE(
          new NextRequest(`http://localhost/api/services/${ID}`, {
            method: 'DELETE',
          }),
          params(),
        )
      ).status,
    ).toBe(200);
  });
});
