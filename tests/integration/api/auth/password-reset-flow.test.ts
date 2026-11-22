/**
 * Parcours complet « mot de passe oublié » sur la base de test :
 * demande → e-mail (intercepté) → réinitialisation avec le lien → nouveau mot de passe actif.
 */
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { afterAll, describe, expect, it, vi } from 'vitest';

const sent = vi.hoisted(() => ({ urls: [] as string[] }));
vi.mock('@/lib/email/resend', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  sendPasswordResetEmail: vi.fn(async (_to: string, _name: string, url: string) => {
    sent.urls.push(url);
    return true;
  }),
}));

import { POST as forgot } from '@/app/api/auth/forgot-password/route';
import { POST as reset } from '@/app/api/auth/reset-password/route';
import { mongoClient } from '@/lib/mongodb';

const email = `reset-${Date.now()}@example.com`;
const users = async () => (await mongoClient).db().collection('users');
const json = (url: string, body: unknown) =>
  new NextRequest(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

afterAll(async () => {
  await (await users()).deleteOne({ email });
});

describe('Integration: mot de passe oublié → réinitialisation', () => {
  it('envoie un lien qui permet de choisir un nouveau mot de passe, une seule fois', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    await (await users()).insertOne({
      email,
      name: 'Reset Test',
      password: await bcrypt.hash('AncienMotDePasse1!', 4),
      status: 'ACTIVE',
      roles: ['CUSTOMER'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await forgot(json('http://localhost:3000/api/auth/forgot-password', { email: email.toUpperCase() }));
    expect(res.status).toBe(200);
    expect(sent.urls).toHaveLength(1);
    const token = new URL(sent.urls[0]!).searchParams.get('token')!;

    const stored = await (await users()).findOne({ email });
    expect(stored?.['passwordResetToken']).toMatch(/^[0-9a-f]{64}$/);
    expect(stored?.['passwordResetToken']).not.toBe(token);

    const ok = await reset(json('http://localhost:3000/api/auth/reset-password', { token, password: 'NouveauMotDePasse1!', confirmPassword: 'NouveauMotDePasse1!' }));
    expect(ok.status).toBe(200);

    const updated = await (await users()).findOne({ email });
    expect(await bcrypt.compare('NouveauMotDePasse1!', String(updated?.['password']))).toBe(true);
    expect(updated?.['passwordResetToken']).toBeUndefined();

    const again = await reset(json('http://localhost:3000/api/auth/reset-password', { token, password: 'Autre-MotDePasse1!', confirmPassword: 'Autre-MotDePasse1!' }));
    expect(again.status).toBe(400);
  });
});
