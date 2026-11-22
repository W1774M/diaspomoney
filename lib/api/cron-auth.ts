import { timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

import { ApiErrors } from '@/lib/api/error-handler';

/**
 * Authentifie un appel de tâche planifiée : `Authorization: Bearer <secret>`.
 * Toujours fermé sans secret configuré, sauf en développement local (NODE_ENV=development).
 * Comparaison en temps constant.
 */
export function assertCronSecret(request: NextRequest, envVar: string): void {
  const expected = process.env[envVar];
  if (!expected) {
    if (process.env['NODE_ENV'] === 'development') return;
    throw ApiErrors.FORBIDDEN;
  }

  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw ApiErrors.UNAUTHORIZED;
  }
}
