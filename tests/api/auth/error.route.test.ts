/**
 * /api/auth/error — redirection vers la connexion
 */
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT } from '@/app/api/auth/error/route';

function request(method: string, url = 'http://localhost/api/auth/error?error=AccessDenied') {
  return new NextRequest(url, { method, headers: { host: 'diaspomoney.fr' } });
}

describe('/api/auth/error', () => {
  it('redirige vers /login en conservant l’erreur, pour chaque méthode', async () => {
    for (const handler of [GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS]) {
      const res = await handler(request('GET'));
      expect(res.status).toBe(307);
      const location = res.headers.get('location') || '';
      expect(location).toContain('http://diaspomoney.fr/login');
      expect(location).toContain('error=AccessDenied');
    }
  });

  it('redirige sans paramètre d’erreur, et sans en-tête Host', async () => {
    const plain = await GET(new NextRequest('http://localhost/api/auth/error', { headers: { host: '' } }));
    const location = plain.headers.get('location') || '';
    expect(location).toContain('/login');
    expect(location).not.toContain('error=');
  });
});
