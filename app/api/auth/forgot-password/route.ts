import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
// Désactiver le prerendering pour cette route API
export const dynamic = 'force-dynamic';

import { logger } from '@/lib/logger';
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth.schema';
import { requestPasswordReset } from '@/services/auth/auth.service';
import { userService } from '@/services/user/user.service';
import * as crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// Désactiver le prerendering pour cette route API
;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    // Skip during build time
    const isBuildTime = process.env['NEXT_PHASE'] === 'phase-production-build' || 
                        process.env['NEXT_PHASE'] === 'phase-development-build';
    if (isBuildTime) {
      return NextResponse.json({ success: true, message: 'Service temporarily unavailable' }, { status: 503 });
    }

    // Validation avec Zod
    const body = await request.json();
    const data: ForgotPasswordInput = validateBody(body, ForgotPasswordSchema);
    
    const { email } = data;

    try {
      // Vérifier si l'utilisateur existe dans la base de données
      const user = await userService.getUserProfile(email.toLowerCase());

      // Si on arrive ici, l'utilisateur existe
      // Générer un token de récupération
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 heure

      // Mettre à jour l'utilisateur avec le token
      await userService.updateUserProfile(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      });

      // Envoyer l'email de réinitialisation (seulement si Resend est configuré)
      if (process.env['RESEND_API_KEY']) {
        await requestPasswordReset(email);
        logger.info({ email: email }, 'Email de récupération envoyé');
      } else {
        logger.warn({ email: email, resetToken: resetToken }, 'Token de récupération généré (email non envoyé - RESEND_API_KEY non configuré)');
      }
    } catch (error) {
      logger.error({ error: error }, 'Error requesting password reset');
    }

    return NextResponse.json({ success: true, message: 'Si cet email existe, vous recevrez un lien de récupération' }, { status: 200 });
  }, 'api/auth/forgot-password');
}
