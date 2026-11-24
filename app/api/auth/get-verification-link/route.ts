/**
 * POST /api/auth/get-verification-link
 * Génère un lien d'activation e-mail pour un compte (support admin / superadmin).
 * Le self-service mot de passe reste sur /api/auth/forgot-password.
 */

import { auth } from '@/auth';
import { getPublicBaseUrl } from '@/lib/api/public-url';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { isSupportAgent } from '@/lib/support/impersonation-policy';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Même périmètre que le support : ADMIN / SUPERADMIN (rôles session).
    if (!isSupportAgent(session.user.roles)) {
      return NextResponse.json(
        { error: 'Accès réservé au support (administrateurs).' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Adresse email requise' },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await (User as any).findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json(
        { error: 'Aucun compte trouvé avec cette adresse email' },
        { status: 404 },
      );
    }

    const emailVerificationToken = jwt.sign(
      { userId: user._id?.toString() || user.id, type: 'email_verification' },
      process.env['JWT_SECRET']!,
      { expiresIn: '24h' },
    );

    const baseUrl = getPublicBaseUrl(request);
    const verificationUrl = `${baseUrl}/verify-email?token=${emailVerificationToken}`;

    logger.info(
      {
        email: email.toLowerCase().trim(),
        agentId: session.user.id,
        roles: session.user.roles,
      },
      'Lien de vérification généré par le support',
    );

    return NextResponse.json({
      success: true,
      message: 'Lien de vérification généré',
      email: email.toLowerCase().trim(),
      verificationUrl,
    });
  } catch (error) {
    logger.error({ error }, 'Erreur get-verification-link API');

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la génération du lien',
        success: false,
      },
      { status: 400 },
    );
  }
}
