/**
 * POST /api/support/contact : demande de support depuis la page publique /support.
 *
 * L'e-mail part TOUJOURS vers l'adresse de contact de DiaspoMoney (jamais vers une adresse
 * fournie par le visiteur), avec l'adresse du visiteur en réponse : la route ne peut pas
 * servir de relais d'envoi. Contenu échappé, piège à robots, 5 demandes par heure et par IP.
 */
import { NextRequest, NextResponse } from 'next/server';

import { sendEmail } from '@/lib/email/resend';
import { LEGAL_ENTITY } from '@/lib/legal/company';
import { childLogger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis/redis-client';
import {
  SUPPORT_CATEGORIES,
  SUPPORT_URGENCIES,
  SupportContactSchema,
  supportFieldErrors,
} from '@/lib/support/contact-request';

const log = childLogger({ route: 'api/support/contact' });

export const SUPPORT_CONTACT_LIMIT = 5;
const WINDOW_SECONDS = 60 * 60;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'inconnue'
  );
}

/** Vrai si l'IP a dépassé la limite. Redis indisponible : la demande passe (incr renvoie 0). */
async function overLimit(ip: string): Promise<boolean> {
  const redis = getRedisClient();
  const key = `ratelimit:support-contact:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, WINDOW_SECONDS);
  return count > SUPPORT_CONTACT_LIMIT;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête illisible' }, { status: 400 });
  }

  const parsed = SupportContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Certains champs sont à corriger.', fieldErrors: supportFieldErrors(parsed.error) },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Robot (champ caché rempli) : réponse identique à un succès, rien n'est envoyé
  if (data.website?.trim()) {
    log.warn('Demande de support ignorée (piège à robots)');
    return NextResponse.json({ success: true });
  }

  if (await overLimit(clientIp(request))) {
    return NextResponse.json(
      { error: 'Trop de demandes envoyées. Réessayez dans une heure ou écrivez-nous directement.' },
      { status: 429 },
    );
  }

  const urgency = SUPPORT_URGENCIES[data.urgency];
  const category = SUPPORT_CATEGORIES[data.category];
  const contact = process.env['EMAIL_CONTACT'] || LEGAL_ENTITY.email;
  const lines: Array<[string, string]> = [
    ['Urgence', urgency],
    ['Catégorie', category],
    ['E-mail', data.userEmail],
    ...(data.userPhone ? ([['Téléphone', data.userPhone]] as Array<[string, string]>) : []),
  ];

  const sent = await sendEmail({
    to: contact,
    replyTo: data.userEmail,
    subject: `[Support ${data.urgency === 'high' ? 'CRITIQUE' : urgency}] ${category} — ${data.userEmail}`,
    html: `<h2>Demande de support (page /support)</h2>
<ul>${lines.map(([k, v]) => `<li><strong>${k}</strong> : ${escapeHtml(v)}</li>`).join('')}</ul>
<p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
<p>Répondez directement à cet e-mail pour écrire au demandeur.</p>`,
    text: `Demande de support (page /support)\n${lines.map(([k, v]) => `${k} : ${v}`).join('\n')}\n\n${data.message}`,
    tags: [
      { name: 'type', value: 'support_contact' },
      { name: 'urgency', value: data.urgency },
      { name: 'category', value: data.category },
    ],
  } as never);

  if (!sent) {
    log.error({ category: data.category }, 'Demande de support non transmise');
    return NextResponse.json(
      { error: `Votre demande n'a pas pu être transmise. Écrivez-nous à ${contact}.` },
      { status: 502 },
    );
  }

  log.info({ category: data.category, urgency: data.urgency }, 'Demande de support transmise');
  return NextResponse.json({ success: true });
}
