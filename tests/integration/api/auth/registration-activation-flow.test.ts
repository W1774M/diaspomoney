/**
 * Parcours complet sur la base de test : inscription avec mot de passe → e-mail d'activation
 * (intercepté) → un clic suffit → connexion avec le mot de passe choisi à l'inscription.
 */
import { NextRequest } from 'next/server';
import { afterAll, describe, expect, it, vi } from 'vitest';

const sent = vi.hoisted(() => ({ urls: [] as string[] }));
vi.mock('@/lib/email/resend', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  sendWelcomeEmail: vi.fn(async (_to: string, _name: string, url: string) => {
    sent.urls.push(url);
    return true;
  }),
}));
// Pas de Redis en test : le compteur d'échecs de connexion est neutre ici
vi.mock('@/lib/security/advanced-security', async (importOriginal) => {
  const mod = await importOriginal<Record<string, any>>();
  return {
    ...mod,
    securityManager: Object.assign(Object.create(mod['securityManager']), {
      isUserBlocked: async () => false,
      detectAnomalies: async () => undefined,
      resetLoginAttempts: async () => undefined,
    }),
  };
});

import { POST as activate } from '@/app/api/auth/activate-account/route';
import { POST as register } from '@/app/api/auth/register/route';
import { authConfig } from '@/auth.config';
import { mongoClient } from '@/lib/mongodb';

const email = `inscription-${Date.now()}@example.com`;
const password = 'MotDePasse-Inscription1!';
const users = async () => (await mongoClient).db().collection('users');
const json = (url: string, body: unknown) =>
  new NextRequest(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
type Authorize = (c: Record<string, string>) => Promise<{ id: string } | null>;
const authorize = (authConfig.providers.find((p) => p.id === 'credentials') as unknown as { options: { authorize: Authorize } }).options.authorize;

afterAll(async () => {
  await (await users()).deleteOne({ email });
});

describe('Integration: inscription → activation → connexion', () => {
  it('garde le mot de passe choisi à l’inscription et active le compte en un clic', async () => {
    const res = await register(json('http://localhost:3000/api/auth/register', {
      email, password, firstName: 'Awa', lastName: 'Diallo', countryOfResidence: 'SN', termsAccepted: true,
    }));
    expect([200, 201]).toContain(res.status);

    const created = await (await users()).findOne({ email });
    expect(created).toMatchObject({ status: 'PENDING', countryOfResidence: 'SN' });
    expect(created?.['password']).toMatch(/^\$2[aby]\$12\$/);

    // Compte en attente : la connexion est refusée
    expect(await authorize({ email, password })).toBeNull();

    // Le lien de l'e-mail suffit
    expect(sent.urls).toHaveLength(1);
    const token = new URL(sent.urls[0]!).searchParams.get('token')!;
    const act = await activate(json('http://localhost:3000/api/auth/activate-account', { token }));
    expect(act.status).toBe(200);
    expect(await (await users()).findOne({ email })).toMatchObject({ status: 'ACTIVE', isEmailVerified: true });

    // Connexion avec le mot de passe choisi à l'inscription
    expect(await authorize({ email, password })).toMatchObject({ id: String(created?._id) });
    expect(await authorize({ email, password: 'mauvais-mot-de-passe' })).toBeNull();
  });
});
