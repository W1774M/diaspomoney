import { userService } from '@/services/user/user.service';
import { ROLES, USER_STATUSES, HTTP_STATUS_CODES } from '@/lib/constants';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    console.log('API Provider [id] - ID:', params.id); // Debug

    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      console.log('ID invalide:', params.id); // Debug
      return NextResponse.json(
        { error: 'ID de prestataire invalide' },
        { status: HTTP_STATUS_CODES.BAD_REQUEST },
      );
    }

    // Récupérer l'utilisateur par ID
    const provider = await userService.getUserProfile(params.id);

    console.log('Provider trouvé:', {
      id: provider._id,
      email: provider.email,
      roles: provider.roles,
      status: provider.status,
    }); // Debug

    // Vérifier que l'utilisateur a le rôle PROVIDER
    if (
      !provider.roles ||
      !Array.isArray(provider.roles) ||
      !provider.roles.includes(ROLES.PROVIDER)
    ) {
      console.log('Provider non trouvé - roles:', provider.roles); // Debug
      return NextResponse.json(
        { error: 'Prestataire non trouvé' },
        { status: HTTP_STATUS_CODES.NOT_FOUND },
      );
    }

    // Vérifier que le provider est actif
    if (provider.status !== USER_STATUSES.ACTIVE) {
      console.log('Provider inactif - status:', provider.status); // Debug
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
    console.error('Erreur lors de la récupération du prestataire:', error);

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
