/**
 * API Route pour renvoyer le lien d'activation d'un utilisateur
 * Implémente les design patterns :
 * - Service Layer Pattern (via userService)
 * - Logger Pattern (structured logging avec childLogger)
 * - Middleware Pattern (authentification)
 */

import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { ROLES, USER_STATUSES } from '@/lib/constants';
import { userService } from '@/services/user/user.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/users/[id]/resend-activation - Renvoyer le lien d'activation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/users/[id]/resend-activation',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Gérer params qui peut être une Promise dans Next.js 15+
    const resolvedParams = await Promise.resolve(params);
    const targetUserId = resolvedParams?.id;

    // Validation de l'ID
    if (!targetUserId || targetUserId === 'null' || targetUserId === 'undefined' || typeof targetUserId !== 'string' || targetUserId.trim() === '') {
      log.warn({ targetUserId: targetUserId || 'undefined', params: resolvedParams }, 'Invalid user ID provided');
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 },
      );
    }

    // Décoder l'ID si nécessaire (en cas d'encodage URL)
    const decodedUserId = decodeURIComponent(targetUserId);
    log.debug({ targetUserId, decodedUserId }, 'Processing resend activation');

    // Vérifier les permissions (seuls ADMIN et SUPERADMIN peuvent renvoyer le lien d'activation)
    const currentUserId = session.user.id;
    const currentUser = await userService.getUserProfile(currentUserId);
    const isAdmin =
      currentUser.roles?.includes(ROLES.ADMIN) ||
      currentUser.roles?.includes(ROLES.SUPERADMIN);

    if (!isAdmin) {
      log.warn(
        { currentUserId, targetUserId, msg: 'Insufficient permissions' },
        'User attempted to resend activation without admin rights',
      );
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 },
      );
    }

    // Récupérer l'utilisateur cible
    const targetUser = await userService.getUserProfile(decodedUserId);
    
    if (!targetUser) {
      log.warn({ decodedUserId }, 'User not found');
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 },
      );
    }

    // Vérifier que le statut est PENDING
    if (targetUser.status !== USER_STATUSES.PENDING) {
      log.warn(
        { decodedUserId, status: targetUser.status },
        'Attempted to resend activation for non-pending user',
      );
      return NextResponse.json(
        { error: 'Le compte de cet utilisateur est déjà activé ou n\'est pas en attente d\'activation' },
        { status: 400 },
      );
    }

    // Générer un nouveau token d'activation (valide 7 jours)
    const jwt = (await import('jsonwebtoken')).default;
    const activationToken = jwt.sign(
      {
        userId: decodedUserId,
        type: 'account_activation',
      },
      process.env['JWT_SECRET']!,
      { expiresIn: '7d' },
    );

    // Construire l'URL d'activation
    const { cleanUrl } = await import('@/lib/utils');
    const rawBaseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000';
    const baseUrl = cleanUrl(rawBaseUrl);
    const activationUrl = `${baseUrl}/activate-account?token=${activationToken}`;

    // Envoyer l'email d'activation
    const { sendAccountActivationEmail } = await import('@/lib/email/resend');
    const userName = targetUser.name || `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.email;
    
    await sendAccountActivationEmail(
      targetUser.email,
      userName,
      activationUrl,
    );

    log.info({ decodedUserId, email: targetUser.email }, 'Activation email resent successfully');

    return NextResponse.json({
      success: true,
      message: 'Lien d\'activation renvoyé avec succès',
    });
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams?.id || 'undefined';
    log.error(
      { error, userId, msg: 'Error resending activation email' },
      'Error resending activation email',
    );

    if (error.message === 'Utilisateur non trouvé') {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de l'envoi du lien d'activation" },
      { status: 500 },
    );
  }
}

