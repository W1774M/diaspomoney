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

import { GET } from '@/app/api/statistics/personal/route';

describe('GET /api/statistics/personal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    getPersonalStatistics.mockResolvedValue({
      budget: {
        monthly: { budget: 100, spent: 40 },
        annual: { budget: 1200, spent: 400 },
      },
      services: { mostUsed: [] },
      providers: { favorites: [] },
    });
  });

  it('répond 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(
      new NextRequest('http://localhost/api/statistics/personal'),
    );
    expect(res.status).toBe(401);
  });

  it('retourne les statistiques personnelles', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/statistics/personal'),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.statistics.budget.monthly.spent).toBe(40);
    expect(getPersonalStatistics).toHaveBeenCalledWith('user-1');
  });
});
