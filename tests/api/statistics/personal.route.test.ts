/**
 * GET /api/statistics/personal
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuth, getPersonalStatistics } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  getPersonalStatistics: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/statistics/statistics.service', () => ({
  statisticsService: { getPersonalStatistics },
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { GET } from '@/app/api/statistics/personal/route';

const statistics = {
  budget: {
    monthly: { budget: 100, spent: 40 },
    annual: { budget: 1200, spent: 400 },
  },
  services: { mostUsed: [{ id: 's1' }] },
  providers: { favorites: [] },
};

describe('GET /api/statistics/personal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    getPersonalStatistics.mockResolvedValue(statistics);
  });

  it('refuse sans session', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(new NextRequest('http://localhost/api/statistics/personal'));
    expect(res.status).toBe(401);
  });

  it('retourne le budget et les habitudes de la personne', async () => {
    const res = await GET(new NextRequest('http://localhost/api/statistics/personal'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, statistics });
    expect(getPersonalStatistics).toHaveBeenCalledWith('user-1');
  });

  it('répond 500 si le service échoue', async () => {
    getPersonalStatistics.mockRejectedValue(new Error('db'));
    const res = await GET(new NextRequest('http://localhost/api/statistics/personal'));
    expect(res.status).toBe(500);
  });
});
