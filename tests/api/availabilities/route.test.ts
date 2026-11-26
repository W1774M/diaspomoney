/**
 * GET/POST /api/availabilities
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuth, findByEmail, findRulesWithFilters, create } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  findByEmail: vi.fn(),
  findRulesWithFilters: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/repositories', () => ({
  getUserRepository: () => ({ findByEmail }),
  getAvailabilityRuleRepository: () => ({ findRulesWithFilters, create }),
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

import { GET, POST } from '@/app/api/availabilities/route';

const user = { id: 'user-1', email: 'awa@example.com' };

function get(query = '') {
  return GET(new NextRequest(`http://localhost/api/availabilities${query}`));
}

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/availabilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('/api/availabilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { email: user.email } });
    findByEmail.mockResolvedValue(user);
    findRulesWithFilters.mockResolvedValue({ data: [{ id: 'r1' }], total: 1 });
    create.mockResolvedValue({ id: 'r2', name: 'Semaine', type: 'weekly' });
  });

  it('refuse sans email de session ou si le compte est introuvable', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
    expect((await post({ name: 'Semaine', type: 'weekly' })).status).toBe(401);

    mockAuth.mockResolvedValue({ user: { email: user.email } });
    findByEmail.mockResolvedValue(null);
    expect((await get()).status).toBe(404);
    expect((await post({ name: 'Semaine', type: 'weekly' })).status).toBe(404);
  });

  it('liste les règles, éventuellement filtrées par type', async () => {
    const all = await get();
    expect((await all.json()).total).toBe(1);
    expect(findRulesWithFilters).toHaveBeenCalledWith(
      { userId: 'user-1' },
      expect.objectContaining({ limit: 100 }),
    );

    await get('?type=weekly');
    expect(findRulesWithFilters).toHaveBeenLastCalledWith(
      { userId: 'user-1', type: 'weekly' },
      expect.any(Object),
    );
  });

  it('crée une règle hebdomadaire et refuse un corps invalide', async () => {
    const res = await post({
      name: 'Semaine',
      type: 'weekly',
      timeSlots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }],
    });
    expect(res.status).toBe(200);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', name: 'Semaine', timezone: 'UTC' }),
    );

    expect((await post({ name: '', type: 'weekly' })).status).toBe(400);
  });

  it('retombe sur _id si le compte n’a pas d’id métier', async () => {
    findByEmail.mockResolvedValue({ _id: { toString: () => 'mongo-id' }, email: user.email });
    await get();
    expect(findRulesWithFilters).toHaveBeenCalledWith(
      { userId: 'mongo-id' },
      expect.any(Object),
    );
  });
});
