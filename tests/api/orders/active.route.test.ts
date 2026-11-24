/**
 * GET /api/orders/active
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiErrors } from '@/lib/api/error-handler';

const { requireApiSession, getActiveOrdersUseCase } = vi.hoisted(() => ({
  requireApiSession: vi.fn(),
  getActiveOrdersUseCase: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({ requireApiSession }));
vi.mock('@/services/orders/get-active-orders.use-case', () => ({
  getActiveOrdersUseCase,
}));

import { GET } from '@/app/api/orders/active/route';

describe('GET /api/orders/active', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiSession.mockResolvedValue({ user: { id: 'user-1' } });
    getActiveOrdersUseCase.mockResolvedValue([{ id: 'o1' }]);
  });

  it('répond 401 sans session', async () => {
    requireApiSession.mockRejectedValue(ApiErrors.UNAUTHORIZED);
    const res = await GET(new NextRequest('http://localhost/api/orders/active'));
    expect(res.status).toBe(401);
    expect(getActiveOrdersUseCase).not.toHaveBeenCalled();
  });

  it('retourne les commandes actives', async () => {
    const res = await GET(new NextRequest('http://localhost/api/orders/active'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.orders).toEqual([{ id: 'o1' }]);
    expect(getActiveOrdersUseCase).toHaveBeenCalledWith('user-1');
  });
});
