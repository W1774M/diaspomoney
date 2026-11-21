import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decode } from 'next-auth/jwt';
import { authenticateUser } from '@/lib/auth/middleware';

vi.mock('next-auth/jwt', () => ({
  decode: vi.fn(),
}));

const mockedDecode = vi.mocked(decode);

describe('lib/auth/middleware', () => {
  const originalAuthSecret = process.env['AUTH_SECRET'];
  const originalNextAuthSecret = process.env['NEXTAUTH_SECRET'];
  const originalVercelEnv = process.env['VERCEL_ENV'];

  beforeEach(() => {
    mockedDecode.mockReset();
    delete process.env['AUTH_SECRET'];
    delete process.env['NEXTAUTH_SECRET'];
    process.env['VERCEL_ENV'] = 'production';
  });

  afterEach(() => {
    if (originalAuthSecret === undefined) {
      delete process.env['AUTH_SECRET'];
    } else {
      process.env['AUTH_SECRET'] = originalAuthSecret;
    }

    if (originalNextAuthSecret === undefined) {
      delete process.env['NEXTAUTH_SECRET'];
    } else {
      process.env['NEXTAUTH_SECRET'] = originalNextAuthSecret;
    }

    if (originalVercelEnv === undefined) {
      delete process.env['VERCEL_ENV'];
    } else {
      process.env['VERCEL_ENV'] = originalVercelEnv;
    }
  });

  it('refuse la session NextAuth en production si aucun secret auth n’est configuré', async () => {
    mockedDecode.mockResolvedValue({
      sub: 'user-1',
      email: 'user@example.com',
      role: 'CUSTOMER',
    });

    const request = new NextRequest('https://diaspomoney.fr/dashboard', {
      headers: {
        cookie: 'next-auth.session-token=session-token',
      },
    });

    await expect(authenticateUser(request)).resolves.toBeNull();
    expect(mockedDecode).not.toHaveBeenCalled();
  });
});
