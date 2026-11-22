// @vitest-environment node
/**
 * POST /api/auth/forgot-password : recherche par e-mail, jeton stocké sous forme d'empreinte,
 * lien envoyé avec le jeton en clair, réponse identique que le compte existe ou non.
 */
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  update: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  invalidateAppCache: vi.fn(),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/repositories', () => ({ getUserRepository: () => ({ findByEmail: h.findByEmail, update: h.update }) }));
vi.mock('@/lib/email/resend', () => ({ sendPasswordResetEmail: h.sendPasswordResetEmail }));
vi.mock('@/lib/cache/redis', () => ({ invalidateAppCache: h.invalidateAppCache }));
vi.mock('@/lib/logger', () => ({ logger: h.logger }));
vi.mock('@/lib/api/error-handler', () => ({
  handleApiRoute: (_req: unknown, handler: () => unknown) => handler(),
  validateBody: (body: unknown) => body,
}));

import { POST } from '@/app/api/auth/forgot-password/route';

const post = (email: string) =>
  POST(new NextRequest('http://localhost/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }));
const sha = (t: string) => createHash('sha256').update(t).digest('hex');
const OK = { success: true, message: 'Si cet email existe, vous recevrez un lien de récupération' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PHASE', '');
  vi.stubEnv('NEXTAUTH_URL', 'https://app.test');
  vi.stubEnv('RESEND_API_KEY', 're_test');
  h.findByEmail.mockResolvedValue({ id: 'u1', email: 'awa@test.fr', name: 'Awa Diallo' });
  h.update.mockResolvedValue({});
  h.sendPasswordResetEmail.mockResolvedValue(true);
});

describe('POST /api/auth/forgot-password', () => {
  it('stocke l’empreinte du jeton et envoie le lien avec le jeton en clair', async () => {
    const res = await post(' Awa@Test.FR ');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(OK);
    expect(h.findByEmail).toHaveBeenCalledWith('awa@test.fr');

    const [to, name, url] = h.sendPasswordResetEmail.mock.calls[0]!;
    expect([to, name]).toEqual(['awa@test.fr', 'Awa Diallo']);
    expect(url).toMatch(/^https:\/\/app\.test\/reset-password\?token=[0-9a-f]{64}$/);
    const token = new URL(url).searchParams.get('token')!;

    const [id, stored] = h.update.mock.calls[0]!;
    expect(id).toBe('u1');
    expect(stored.passwordResetToken).toBe(sha(token));
    expect(stored.passwordResetToken).not.toBe(token);
    expect(stored.passwordResetExpires.getTime()).toBeGreaterThan(Date.now() + 59 * 60_000);
    expect(h.invalidateAppCache).toHaveBeenCalledWith('UserRepository');
  });

  it('compose le nom à partir du prénom et du nom', async () => {
    h.findByEmail.mockResolvedValueOnce({ id: 'u1', email: 'awa@test.fr', firstName: 'Awa', lastName: 'Diallo' });
    await post('awa@test.fr');
    expect(h.sendPasswordResetEmail.mock.calls[0]![1]).toBe('Awa Diallo');
  });

  it('répond pareil pour un e-mail inconnu, sans rien écrire ni envoyer', async () => {
    h.findByEmail.mockResolvedValueOnce(null);
    const res = await post('inconnu@test.fr');
    expect(await res.json()).toEqual(OK);
    expect(h.update).not.toHaveBeenCalled();
    expect(h.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('n’envoie rien sans Resend et n’écrit jamais le jeton dans les journaux', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    await post('awa@test.fr');
    expect(h.update).toHaveBeenCalled();
    expect(h.sendPasswordResetEmail).not.toHaveBeenCalled();
    const logged = JSON.stringify([h.logger.info.mock.calls, h.logger.warn.mock.calls]);
    expect(logged).not.toContain(h.update.mock.calls[0]![1].passwordResetToken);
    expect(logged).not.toMatch(/[0-9a-f]{64}/);
  });

  it('répond 200 même si l’envoi ou la base échoue', async () => {
    h.sendPasswordResetEmail.mockResolvedValueOnce(false);
    expect((await post('awa@test.fr')).status).toBe(200);
    expect(h.logger.warn).toHaveBeenCalled();

    h.findByEmail.mockRejectedValueOnce(new Error('mongo HS'));
    const res = await post('awa@test.fr');
    expect(await res.json()).toEqual(OK);
    expect(h.logger.error).toHaveBeenCalled();
  });

  it('renvoie 503 pendant la compilation', async () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-build');
    expect((await post('awa@test.fr')).status).toBe(503);
    expect(h.findByEmail).not.toHaveBeenCalled();
  });
});
