/**
 * GET /api/statistics/users
 */
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const { mockAuth, findAll } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  findAll: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/repositories', () => ({
  getUserRepository: () => ({ findAll }),
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { GET } from '@/app/api/statistics/users/route';

function get() {
  return GET(new NextRequest('http://localhost/api/statistics/users'));
}

describe('GET /api/statistics/users', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0));
    mockAuth.mockResolvedValue({ user: { id: 'admin', roles: [ROLES.ADMIN] } });
    findAll.mockResolvedValue([
      { createdAt: new Date(2026, 5, 15, 8, 0, 0), status: 'ACTIVE' },
      { createdat: new Date(2026, 4, 10, 8, 0, 0), isActive: true },
      { createdAt: new Date(2026, 0, 1), status: 'INACTIVE' },
      { status: 'ACTIVE' },
    ]);
  });

  it('refuse sans session ou sans rôle admin', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await get()).status).toBe(401);

    mockAuth.mockResolvedValue({ user: { id: 'u', roles: [ROLES.CUSTOMER] } });
    expect((await get()).status).toBe(403);
  });

  it('estime volumes du jour, du mois précédent et des requêtes', async () => {
    const res = await get();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.statistics.totalUsers).toBe(4);
    expect(body.statistics.usersToday).toBe(2);
    expect(body.statistics.previousMonthUsers).toBe(1);
    expect(body.statistics.restRequests).toBe(45);
    expect(body.statistics.authRequests).toBe(9);
    expect(findAll).toHaveBeenCalledWith({});
  });

  it('accepte un superadmin et répond 500 si le dépôt échoue', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'sa', roles: [ROLES.SUPERADMIN] } });
    expect((await get()).status).toBe(200);

    findAll.mockRejectedValue(new Error('db'));
    expect((await get()).status).toBe(500);
  });
});
