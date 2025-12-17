import { userService } from '@/services/user/user.service';
import { ROLES, USER_STATUSES, HTTP_STATUS_CODES } from '@/lib/constants';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    logger.debug({ providerId: params.id }, 'API Provider [id] - Récupération');

    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      logger.warn({ providerId: params.id }, 'ID invalide');
      return NextResponse.json(
        { error: 'ID de prestataire invalide' },
        { status: HTTP_STATUS_CODES.BAD_REQUEST },
      );
    }

    // Récupérer l'utilisateur par ID
    const provider = await userService.getUserProfile(params.id);

    logger.debug({
      id: provider._id,
      email: provider.email,
      roles: provider.roles,
      status: provider.status,
    }, 'Provider trouvé');

    // Vérifier que l'utilisateur a le rôle PROVIDER
    if (
      !provider.roles ||
      !Array.isArray(provider.roles) ||
      !provider.roles.includes(ROLES.PROVIDER)
    ) {
      logger.warn({ roles: provider.roles }, 'Provider non trouvé - rôle PROVIDER manquant');
      return NextResponse.json(
        { error: 'Prestataire non trouvé' },
        { status: HTTP_STATUS_CODES.NOT_FOUND },
      );
    }

    // Vérifier que le provider est actif
    if (provider.status !== USER_STATUSES.ACTIVE) {
      logger.warn({ status: provider.status }, 'Provider inactif');
      return NextResponse.json(
        { error: 'Prestataire non disponible' },
        { status: HTTP_STATUS_CODES.NOT_FOUND },
      );
    }

    return NextResponse.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    logger.error({ error }, 'Erreur lors de la récupération du prestataire');

    // Gérer le cas où l'utilisateur n'est pas trouvé
    if (error instanceof Error && error.message === 'Utilisateur non trouvé') {
      return NextResponse.json(
        { error: 'Prestataire non trouvé' },
        { status: HTTP_STATUS_CODES.NOT_FOUND },
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR },
    );
  }
}
