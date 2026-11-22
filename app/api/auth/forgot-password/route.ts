import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { getPublicBaseUrl } from '@/lib/api/public-url';
import { hashResetToken } from '@/lib/auth/reset-token';
import { invalidateAppCache } from '@/lib/cache/redis';
import { sendPasswordResetEmail } from '@/lib/email/resend';
import { logger } from '@/lib/logger';
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth.schema';
import { getUserRepository } from '@/repositories';
import * as crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const RESET_TTL_MS = 60 * 60 * 1000; // 1 heure

/**
 * Demande de réinitialisation du mot de passe.
 * Un jeton aléatoire est envoyé par e-mail ; seule son empreinte SHA-256 est stockée en base
 * (voir /api/auth/reset-password). La réponse est identique que l'e-mail existe ou non.
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    // Skip during build time
    const isBuildTime = process.env['NEXT_PHASE'] === 'phase-production-build' ||
                        process.env['NEXT_PHASE'] === 'phase-development-build';
    if (isBuildTime) {
      return NextResponse.json({ success: true, message: 'Service temporarily unavailable' }, { status: 503 });
    }

    const body = await request.json();
    const data: ForgotPasswordInput = validateBody(body, ForgotPasswordSchema);
    const email = data.email.trim().toLowerCase();

    try {
      const user = await getUserRepository().findByEmail(email);

      if (!user) {
        logger.info('Réinitialisation demandée pour un e-mail inconnu');
      } else {
        const resetToken = crypto.randomBytes(32).toString('hex');
        await getUserRepository().update(user.id, {
          passwordResetToken: hashResetToken(resetToken),
          passwordResetExpires: new Date(Date.now() + RESET_TTL_MS),
        } as never);
        await invalidateAppCache('UserRepository'); // écriture hors cache : le vider

        if (process.env['RESEND_API_KEY']) {
          const resetUrl = `${getPublicBaseUrl(request)}/reset-password?token=${resetToken}`;
          const name = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Utilisateur';
          const sent = await sendPasswordResetEmail(user.email, name, resetUrl);
          if (sent) {
            logger.info({ userId: user.id }, 'E-mail de réinitialisation envoyé');
          } else {
            logger.warn({ userId: user.id }, 'Échec de l’envoi de l’e-mail de réinitialisation');
          }
        } else {
          logger.warn({ userId: user.id }, 'Jeton de réinitialisation créé, e-mail non envoyé (RESEND_API_KEY absente)');
        }
      }
    } catch (error) {
      logger.error({ error }, 'Error requesting password reset');
    }

    return NextResponse.json({ success: true, message: 'Si cet email existe, vous recevrez un lien de récupération' }, { status: 200 });
  }, 'api/auth/forgot-password');
}
