/**
 * GET /api/validate-retry-token
 */
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/validate-retry-token/route';

function makeRequest(query: string) {
  return new NextRequest(`http://localhost/api/validate-retry-token?${query}`);
}

describe('GET /api/validate-retry-token', () => {
  it('répond 400 sans token ni expires', async () => {
    const res = await GET(makeRequest(''));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/manquant/i);
  });

  it('répond 400 si expires n’est pas une date valide', async () => {
    const res = await GET(makeRequest('token=abc&expires=pas-un-nombre'));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/expiration/i);
  });

  it('répond 410 si le token est expiré', async () => {
    const past = Date.now() - 60_000;
    const res = await GET(makeRequest(`token=abc&expires=${past}`));
    expect(res.status).toBe(410);
    const json = await res.json();
    expect(json.expired).toBe(true);
  });

  it('répond 200 si le token n’est pas encore expiré', async () => {
    const future = Date.now() + 15 * 60_000;
    const res = await GET(makeRequest(`token=abc&expires=${future}`));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.valid).toBe(true);
    expect(json.success).toBe(true);
  });
});
