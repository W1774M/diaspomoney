// @vitest-environment node
/**
 * POST /api/support/contact : la demande part vers l'adresse de contact (jamais vers une
 * adresse fournie), contenu échappé, erreurs par champ, piège à robots, limite par IP.
 * Avant, le formulaire /support simulait l'envoi : rien n'arrivait au support.
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ sendEmail: vi.fn(), incr: vi.fn(), expire: vi.fn() }));
vi.mock('@/lib/email/resend', () => ({ sendEmail: h.sendEmail }));
vi.mock('@/lib/redis/redis-client', () => ({ getRedisClient: () => ({ incr: h.incr, expire: h.expire }) }));

import { POST, SUPPORT_CONTACT_LIMIT } from '@/app/api/support/contact/route';

const valid = {
  urgency: 'high',
  category: 'payment_issue',
  userEmail: 'awa@test.fr',
  userPhone: '+33 6 12 34 56 78',
  message: 'Mon paiement est bloqué depuis hier <script>alert(1)</script>',
};
const send = async (body: unknown, ip = '1.2.3.4') => {
  const res = await POST(new NextRequest('http://localhost/api/support/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }));
  return { status: res.status, body: await res.json() };
};
const mail = () => h.sendEmail.mock.calls.at(-1)?.[0] as Record<string, any>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  h.sendEmail.mockResolvedValue(true);
  h.incr.mockResolvedValue(1);
});

describe('POST /api/support/contact', () => {
  it('transmet la demande à l’adresse de contact, réponse au demandeur, contenu échappé', async () => {
    expect(await send(valid)).toEqual({ status: 200, body: { success: true } });
    expect(mail()).toMatchObject({ to: 'contact@diaspomoney.fr', replyTo: 'awa@test.fr' });
    expect(mail()['subject']).toBe('[Support CRITIQUE] Problème de paiement — awa@test.fr');
    expect(mail()['html']).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(mail()['html']).not.toContain('<script>');
    expect(mail()['html']).toContain('+33 6 12 34 56 78');
    expect(h.expire).toHaveBeenCalledWith('ratelimit:support-contact:1.2.3.4', 3600);
  });

  it('utilise EMAIL_CONTACT s’il est défini ; jamais une adresse venue du formulaire', async () => {
    vi.stubEnv('EMAIL_CONTACT', 'equipe@diaspomoney.fr');
    await send({ ...valid, to: 'victime@ailleurs.fr' });
    expect(mail()['to']).toBe('equipe@diaspomoney.fr');
  });

  it('renvoie les erreurs champ par champ, sans rien envoyer', async () => {
    const { status, body } = await send({ urgency: '', category: 'inconnue', userEmail: 'pas-un-email', message: 'court' });
    expect(status).toBe(400);
    expect(body.fieldErrors).toEqual({
      urgency: "Choisissez un niveau d'urgence.",
      category: 'Choisissez une catégorie.',
      userEmail: 'Adresse e-mail invalide, par exemple nom@exemple.fr.',
      message: 'Décrivez votre demande en quelques mots (10 caractères au moins).',
    });
    expect((await send('{pas du json')).status).toBe(400);
    expect(h.sendEmail).not.toHaveBeenCalled();
  });

  it('piège à robots : répond comme un succès, n’envoie rien', async () => {
    expect(await send({ ...valid, website: 'http://spam' })).toEqual({ status: 200, body: { success: true } });
    expect(h.sendEmail).not.toHaveBeenCalled();
  });

  it(`limite à ${SUPPORT_CONTACT_LIMIT} demandes par heure et par IP`, async () => {
    h.incr.mockResolvedValue(SUPPORT_CONTACT_LIMIT + 1);
    expect((await send(valid)).status).toBe(429);
    expect(h.sendEmail).not.toHaveBeenCalled();
  });

  it('Redis indisponible : la demande passe quand même', async () => {
    h.incr.mockResolvedValue(0);
    expect((await send(valid)).status).toBe(200);
  });

  it('échec d’envoi : 502 avec l’adresse à utiliser', async () => {
    h.sendEmail.mockResolvedValue(false);
    const { status, body } = await send(valid);
    expect(status).toBe(502);
    expect(body.error).toContain('contact@diaspomoney.fr');
  });
});
