import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { getPublicBaseUrl } from '@/lib/api/public-url';
import { issuePasswordReset } from '@/lib/auth/password-reset';
import { logger } from '@/lib/logger';
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth.schema';
import { getUserRepository } from '@/repositories';
import { NextRequest, NextResponse } from 'next/server';

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
        await issuePasswordReset(user, getPublicBaseUrl(request));
      }
    } catch (error) {
      logger.error({ error }, 'Error requesting password reset');
    }

    return NextResponse.json({ success: true, message: 'Si cet email existe, vous recevrez un lien de récupération' }, { status: 200 });
  }, 'api/auth/forgot-password');
}
