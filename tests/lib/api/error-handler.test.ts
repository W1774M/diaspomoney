import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { handleApiRoute } from '@/lib/api/error-handler';

describe('lib/api/error-handler.handleApiRoute', () => {
  it('devrait préserver un statusCode custom (ex: 429) au lieu de renvoyer 500', async () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { 'x-request-id': 'test-req-id' },
    });

    const handler = async () => {
      const err: any = new Error('Trop de requêtes, veuillez réessayer plus tard');
      err.statusCode = 429;
      err.remaining = 0;
      err.resetTime = Date.now() + 60_000;
      throw err;
    };

    const res = await handleApiRoute(req, handler, 'api/test');
    expect(res.status).toBe(429);

    const payload = await res.json();
    expect(payload.success).toBe(false);
    expect(payload.error).toContain('Trop de requêtes');
    expect(payload.requestId).toBe('test-req-id');
    expect(payload.details).toBeDefined();
  });
});


