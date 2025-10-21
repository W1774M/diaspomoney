import { userService } from '@/services/user/user.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('API Provider [id] - ID:', params.id); // Debug

    // Récupérer l'utilisateur par ID
    const provider = await userService.getUserProfile(params.id);

    console.log('Provider trouvé:', {
      id: provider.id,
      email: provider.email,
      roles: provider.roles,
      status: provider.status,
    }); // Debug

    // Vérifier que l'utilisateur a le rôle PROVIDER
    if (
      !provider.roles ||
      !Array.isArray(provider.roles) ||
      !provider.roles.includes('PROVIDER')
    ) {
      console.log('Provider non trouvé - roles:', provider.roles); // Debug
      return NextResponse.json(
        { error: 'Prestataire non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le provider est actif
    if (provider.status !== 'ACTIVE') {
      console.log('Provider inactif - status:', provider.status); // Debug
      return NextResponse.json(
        { error: 'Prestataire non disponible' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du prestataire:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
