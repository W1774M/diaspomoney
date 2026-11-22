import { describe, expect, it } from 'vitest';

import { GET } from '../../app/api/flags/[iso]/route';

const call = (iso: string) => GET(new Request(`http://localhost/api/flags/${iso}`), { params: { iso } });

describe('GET /api/flags/[iso]', () => {
  it('sert le drapeau SVG avec un cache immuable', async () => {
    const res = await call('cm');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml');
    expect(res.headers.get('Cache-Control')).toContain('immutable');
    expect(await res.text()).toContain('<svg');
  });

  it('renvoie 404 pour un code inconnu ou mal formé', async () => {
    expect((await call('ZZ')).status).toBe(404);
    expect((await call('../x')).status).toBe(404);
  });
});
