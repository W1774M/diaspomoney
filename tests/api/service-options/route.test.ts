/**
 * GET/POST /api/service-options
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const { mockAuth, getAllOptions, createServiceOption } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  getAllOptions: vi.fn(),
  createServiceOption: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/service/service.service', () => ({
  serviceService: { getAllOptions, createServiceOption },
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

import { GET, POST } from '@/app/api/service-options/route';

function get(qs = '') {
  return GET(new NextRequest(`http://localhost/api/service-options${qs}`));
}

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/service-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('/api/service-options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    getAllOptions.mockResolvedValue([{ id: 'o1', label: 'Urgence', price: 20 }]);
    createServiceOption.mockResolvedValue({ id: 'o2', label: 'Suivi', price: 15 });
  });

  it('filtre category HEALTH et force isActive pour non-admin', async () => {
    const res = await get('?category=HEALTH&isActive=false');
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.count).toBe(1);
    expect(getAllOptions).toHaveBeenCalledWith({
      category: 'HEALTH',
      isActive: true,
    });
  });

  it('ignore une category inconnue', async () => {
    await get('?category=LEGAL');
    expect(getAllOptions).toHaveBeenCalledWith({ isActive: true });
  });

  it('autorise isActive pour admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'a1', roles: [ROLES.ADMIN] },
    });
    await get('?isActive=false');
    expect(getAllOptions).toHaveBeenCalledWith({ isActive: false });
  });

  it('refuse POST non admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', roles: [] } });
    expect(
      (
        await post({
          label: 'X',
          description: 'desc',
          price: 10,
        })
      ).status,
    ).toBe(403);
  });

  it('crée une option admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'a1', roles: [ROLES.ADMIN] },
    });
    const res = await post({
      label: 'Suivi',
      description: 'Consultation de suivi',
      price: 15,
    });
    expect(res.status).toBe(200);
    expect(createServiceOption).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Suivi', price: 15 }),
    );
  });
});
