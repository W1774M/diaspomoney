/**
 * GET/POST /api/auth/error — redirection vers /login
 */
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { GET, POST } from '@/app/api/auth/error/route';

describe('/api/auth/error', () => {
  it('GET redirige vers /login en préservant error', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/auth/error?error=AccessDenied', {
        headers: { host: 'localhost:3000' },
      }),
    );
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const location = res.headers.get('location') || '';
    expect(location).toMatch(/\/login/);
    expect(location).toMatch(/error=AccessDenied/);
  });

  it('POST redirige aussi vers /login', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/auth/error', {
        method: 'POST',
        headers: { host: 'localhost:3000' },
      }),
    );
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.headers.get('location') || '').toMatch(/\/login/);
  });
});
