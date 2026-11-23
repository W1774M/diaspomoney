/**
 * GET/POST /api/packs
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const { mockAuth, find, findOne, create, lean, sort } = vi.hoisted(() => {
  const lean = vi.fn();
  const sort = vi.fn(() => ({ lean }));
  const find = vi.fn(() => ({ sort }));
  return {
    mockAuth: vi.fn(),
    find,
    findOne: vi.fn(),
    create: vi.fn(),
    lean,
    sort,
  };
});

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/models/Pack', () => ({
  default: { find, findOne, create },
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { GET, POST } from '@/app/api/packs/route';

function get(qs = '') {
  return GET(new NextRequest(`http://localhost/api/packs${qs}`));
}

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/packs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('/api/packs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'a1', roles: [ROLES.ADMIN] },
    });
    lean.mockResolvedValue([{ id: 'pack-1', label: 'Essentiel' }]);
    findOne.mockResolvedValue(null);
    create.mockResolvedValue({
      id: 'essentiel-sante',
      _id: 'oid1',
      label: 'Essentiel Santé',
    });
  });

  it('refuse sans auth', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
  });

  it('refuse non-admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', roles: [ROLES.PROVIDER] } });
    expect((await get()).status).toBe(403);
  });

  it('liste les packs filtrés', async () => {
    const res = await get('?category=HEALTH&isActive=true');
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.count).toBe(1);
    expect(find).toHaveBeenCalledWith({ category: 'HEALTH', isActive: true });
  });

  it('crée un pack avec slug auto', async () => {
    const res = await post({
      label: 'Essentiel Santé',
      category: 'HEALTH',
      serviceIds: ['svc-1'],
    });
    expect(res.status).toBe(201);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'essentiel-sante',
        category: 'HEALTH',
        createdBy: 'a1',
      }),
    );
  });

  it('répond 409 si id déjà pris', async () => {
    findOne.mockResolvedValue({ id: 'pack-1' });
    expect(
      (
        await post({
          id: 'pack-1',
          label: 'Dup',
          category: 'HEALTH',
          serviceIds: ['svc-1'],
        })
      ).status,
    ).toBe(409);
  });
});
