import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getToken } from 'next-auth/jwt';
import proxy from '../../../proxy';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

const mockedGetToken = vi.mocked(getToken);

describe('middleware dashboard', () => {
  beforeEach(() => {
    mockedGetToken.mockReset();
    process.env['AUTH_SECRET'] = 'test-secret';
  });

  it('redirige les accès dashboard non authentifiés vers login avec callbackUrl', async () => {
    mockedGetToken.mockResolvedValue(null);

    const request = new NextRequest('https://diaspomoney.fr/dashboard/bookings?status=pending');
    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://diaspomoney.fr/login?callbackUrl=%2Fdashboard%2Fbookings%3Fstatus%3Dpending',
    );
  });

  it('laisse passer les accès dashboard authentifiés', async () => {
    mockedGetToken.mockResolvedValue({ sub: 'user-1', email: 'user@example.com' });

    const request = new NextRequest('https://diaspomoney.fr/dashboard');
    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
