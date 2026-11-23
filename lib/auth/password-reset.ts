import { hashResetToken } from '@/lib/auth/reset-token';
import { invalidateAppCache } from '@/lib/cache/redis';
import { sendPasswordResetEmail } from '@/lib/email/resend';
import { logger } from '@/lib/logger';
import { getUserRepository } from '@/repositories';
import * as crypto from 'crypto';

export const RESET_TTL_MS = 60 * 60 * 1000; // 1 heure

interface ResetTarget {
  id: string;
  email: string;
  name?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
}

/**
 * Crée un jeton de réinitialisation du mot de passe et l'envoie par e-mail.
 * Seule l'empreinte SHA-256 du jeton est stockée (voir /api/auth/reset-password) ;
 * le jeton n'est jamais journalisé. Renvoie true si l'e-mail est parti.
 */
export async function issuePasswordReset(user: ResetTarget, baseUrl: string): Promise<boolean> {
  const resetToken = crypto.randomBytes(32).toString('hex');
  await getUserRepository().update(user.id, {
    passwordResetToken: hashResetToken(resetToken),
    passwordResetExpires: new Date(Date.now() + RESET_TTL_MS),
  } as never);
  await invalidateAppCache('UserRepository'); // écriture hors cache : le vider

  if (!process.env['RESEND_API_KEY']) {
    logger.warn({ userId: user.id }, 'Jeton de réinitialisation créé, e-mail non envoyé (RESEND_API_KEY absente)');
    return false;
  }

  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  const name = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Utilisateur';
  const sent = await sendPasswordResetEmail(user.email, name, resetUrl);
  if (sent) {
    logger.info({ userId: user.id }, 'E-mail de réinitialisation envoyé');
  } else {
    logger.warn({ userId: user.id }, 'Échec de l’envoi de l’e-mail de réinitialisation');
  }
  return Boolean(sent);
}
