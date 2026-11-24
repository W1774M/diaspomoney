/**
 * GET/POST /api/admin/support/users/[id]
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ID = '507f1f77bcf86cd799439011';

const {
  mockAuth,
  requireSupportAgent,
  getSupportSummary,
  runSupportAction,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  requireSupportAgent: vi.fn(),
  getSupportSummary: vi.fn(),
  runSupportAction: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/support/support.service', () => ({
  requireSupportAgent,
  getSupportSummary,
  runSupportAction,
}));
vi.mock('@/lib/api/public-url', () => ({
  getPublicBaseUrl: () => 'http://localhost:3000',
}));

import { GET, POST } from '@/app/api/admin/support/users/[id]/route';

const params = { params: Promise.resolve({ id: ID }) };

describe('/api/admin/support/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'agent-1', roles: ['ADMIN'] } });
    requireSupportAgent.mockResolvedValue({ id: 'agent-1', name: 'Agent' });
    getSupportSummary.mockResolvedValue({
      userId: ID,
      status: 'ACTIVE',
      bookingsCount: 2,
    });
    runSupportAction.mockResolvedValue({ action: 'suspend', ok: true });
  });

  it('GET refuse un non-agent support', async () => {
    const { ApiErrors } = await import('@/lib/api/error-handler');
    requireSupportAgent.mockRejectedValue(ApiErrors.FORBIDDEN);
    const res = await GET(
      new NextRequest(`http://localhost/api/admin/support/users/${ID}`),
      params,
    );
    expect(res.status).toBe(403);
  });

  it('GET retourne la fiche support', async () => {
    const res = await GET(
      new NextRequest(`http://localhost/api/admin/support/users/${ID}`),
      params,
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe(ID);
  });

  it('POST exécute une action support', async () => {
    const res = await POST(
      new NextRequest(`http://localhost/api/admin/support/users/${ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suspend', reason: 'fraude' }),
      }),
      params,
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(runSupportAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'agent-1' }),
      ID,
      'suspend',
      'fraude',
      expect.any(Object),
    );
  });
});
