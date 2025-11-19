import { requestPasswordReset } from '@/services/auth/auth.service';
import { userService } from '@/services/user/user.service';
import * as crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env['NODE_ENV'] === 'production' && process.env['NEXT_PHASE'] === 'phase-production-build') {
      return NextResponse.json({ success: true, message: 'Service temporarily unavailable' }, { status: 503 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

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
        console.log(`Email de récupération envoyé à ${email}`);
      } else {
        console.log(`Token de récupération généré pour ${email}: ${resetToken} (email non envoyé - RESEND_API_KEY non configuré)`);
      }
    } catch (_error) {
      // L'utilisateur n'existe pas, mais on ne révèle pas cette information
      console.log(
        `Tentative de récupération pour un email inexistant: ${email}`,
      );
    }

    // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
    return NextResponse.json(
      {
        success: true,
        message: 'Si cet email existe, vous recevrez un lien de récupération',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Erreur récupération mot de passe:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
