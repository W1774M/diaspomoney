/**
 * GET /api/flags/[iso] — drapeau SVG
 */
import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/flags/[iso]/route';

describe('GET /api/flags/[iso]', () => {
  it('répond 404 pour un code invalide', async () => {
    const res = await GET(new Request('http://localhost/api/flags/XX'), {
      params: { iso: 'X' },
    });
    expect(res.status).toBe(404);
  });

  it('répond 404 pour un ISO inconnu', async () => {
    const res = await GET(new Request('http://localhost/api/flags/ZZ'), {
      params: { iso: 'ZZ' },
    });
    expect(res.status).toBe(404);
  });

  it('sert le SVG FR avec cache immutable', async () => {
    const res = await GET(new Request('http://localhost/api/flags/fr'), {
      params: Promise.resolve({ iso: 'fr' }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml');
    expect(res.headers.get('Cache-Control')).toMatch(/immutable/);
    const body = await res.text();
    expect(body).toMatch(/<svg/i);
  });
});
