// @vitest-environment node
/**
 * Consultation du support : règles pures et blocage des écritures par le proxy.
 */
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  canBeImpersonated,
  isAllowedDuringImpersonation,
  isImpersonatedSession,
  isImpersonationActive,
  isSupportAgent,
  toImpersonationInfo,
  type ImpersonationState,
} from '@/lib/support/impersonation-policy';
import proxy from '../../../proxy';

vi.mock('next-auth/jwt', () => ({ getToken: vi.fn() }));
const mockedGetToken = vi.mocked(getToken);

const state = (over: Partial<ImpersonationState> = {}): ImpersonationState => ({
  ticketId: 't1',
  adminId: 'admin1',
  adminName: 'Admin',
  targetId: 'user1',
  targetEmail: 'u@test.fr',
  targetName: 'Awa',
  targetRoles: ['CUSTOMER'],
  reason: 'ticket 123',
  expiresAt: Date.now() + 60_000,
  ...over,
});

describe('règles', () => {
  it('seuls ADMIN et SUPERADMIN consultent ; eux-mêmes ne sont jamais consultés', () => {
    expect(isSupportAgent(['ADMIN'])).toBe(true);
    expect(isSupportAgent(['CUSTOMER', 'SUPERADMIN'])).toBe(true);
    expect(isSupportAgent(['CSM'])).toBe(false);
    expect(isSupportAgent(undefined)).toBe(false);
    expect(canBeImpersonated(['CUSTOMER', 'PROVIDER'])).toBe(true);
    expect(canBeImpersonated(['PROVIDER', 'ADMIN'])).toBe(false);
  });

  it('une consultation est active jusqu’à son échéance, si elle est complète', () => {
    expect(isImpersonationActive(state())).toBe(true);
    expect(isImpersonationActive(state({ expiresAt: Date.now() - 1 }))).toBe(false);
    expect(isImpersonationActive(state({ targetId: '' }))).toBe(false);
    expect(isImpersonationActive({ ...state(), adminId: undefined })).toBe(false);
    expect(isImpersonationActive(undefined)).toBe(false);
    expect(isImpersonationActive('x')).toBe(false);
  });

  it('lecture seule : seules les lectures et la sortie NextAuth passent', () => {
    for (const m of ['GET', 'head', 'OPTIONS']) expect(isAllowedDuringImpersonation(m, '/api/bookings')).toBe(true);
    expect(isAllowedDuringImpersonation('POST', '/api/auth/session')).toBe(true);
    expect(isAllowedDuringImpersonation('POST', '/api/auth/signout/')).toBe(true);
    expect(isAllowedDuringImpersonation('POST', '/api/auth/_log')).toBe(true);
    for (const [m, p] of [
      ['POST', '/api/payments/create-intent'],
      ['PUT', '/api/users/me'],
      ['DELETE', '/api/beneficiaries/1'],
      ['PATCH', '/api/bookings/1'],
      ['POST', '/api/auth/reset-password'],
      ['POST', '/api/auth/callback/credentials'],
      ['POST', '/dashboard/settings'],
    ] as const) {
      expect(isAllowedDuringImpersonation(m, p)).toBe(false);
    }
  });

  it('expose au navigateur le strict nécessaire', () => {
    const info = toImpersonationInfo(state());
    expect(Object.keys(info).sort()).toEqual(['adminName', 'expiresAt', 'reason', 'targetId', 'targetName']);
    expect(isImpersonatedSession({ impersonation: info })).toBe(true);
    expect(isImpersonatedSession({ impersonation: { ...info, expiresAt: Date.now() - 1 } })).toBe(false);
    expect(isImpersonatedSession({ user: {} })).toBe(false);
    expect(isImpersonatedSession(null)).toBe(false);
  });
});

describe('proxy en consultation', () => {
  beforeEach(() => {
    mockedGetToken.mockReset();
    process.env['AUTH_SECRET'] = 'test-secret';
  });

  const send = (method: string, path: string) =>
    proxy(new NextRequest(`https://diaspomoney.fr${path}`, { method, headers: { 'content-type': 'application/json' } }));

  it('refuse toute écriture pendant une consultation', async () => {
    mockedGetToken.mockResolvedValue({ userId: 'admin1', impersonation: state() } as never);
    for (const [m, p] of [
      ['POST', '/api/payments/create-intent'],
      ['PUT', '/api/users/me'],
      ['DELETE', '/api/beneficiaries/1'],
    ]) {
      const res = await send(m!, p!);
      expect(res.status).toBe(403);
      expect(await res.json()).toMatchObject({ code: 'IMPERSONATION_READ_ONLY' });
    }
  });

  it('laisse passer les lectures et la sortie de consultation', async () => {
    mockedGetToken.mockResolvedValue({ userId: 'admin1', impersonation: state() } as never);
    expect((await send('GET', '/api/bookings')).status).toBe(200);
    expect((await send('POST', '/api/auth/session')).status).toBe(200);
  });

  it('ne gêne ni une session normale ni une consultation expirée', async () => {
    mockedGetToken.mockResolvedValue({ userId: 'u1' } as never);
    expect((await send('POST', '/api/payments/create-intent')).status).toBe(200);
    mockedGetToken.mockResolvedValue({ userId: 'admin1', impersonation: state({ expiresAt: Date.now() - 1 }) } as never);
    expect((await send('POST', '/api/payments/create-intent')).status).toBe(200);
    mockedGetToken.mockResolvedValue(null);
    expect((await send('POST', '/api/auth/register')).status).toBe(200);
  });

  it('ne lit le jeton que pour les écritures', async () => {
    mockedGetToken.mockResolvedValue({ userId: 'admin1', impersonation: state() } as never);
    await send('GET', '/api/bookings');
    expect(mockedGetToken).not.toHaveBeenCalled();
  });
});
