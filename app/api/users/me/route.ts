import { auth } from '@/auth';
import { getUserRepository } from '@/repositories';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Récupérer l'utilisateur authentifié via NextAuth
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Utiliser UserRepository (Repository Pattern)
    const userRepository = getUserRepository();
    const userDoc = await userRepository.findByEmail(session.user.email);

    if (!userDoc) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Retourner l'utilisateur de la base de données
    // Le repository retourne déjà un objet User formaté
    return NextResponse.json({
      user: {
        id: userDoc.id || userDoc._id?.toString() || '',
        email: userDoc.email,
        name: userDoc.name || `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim(),
        firstName: userDoc.firstName || '',
        lastName: userDoc.lastName || '',
        phone: userDoc.phone || '',
        company: (userDoc as any)['company'] || '',
        address: (userDoc as any)['address'] || '',
        roles: userDoc.roles || ['CUSTOMER'],
        status: userDoc.status || 'ACTIVE',
        avatar: (userDoc as any)['avatar'] || { image: '', name: userDoc.name || '' },
        oauth: (userDoc as any)['oauth'] || {},
        specialty: (userDoc as any)['specialty'] || '',
        recommended: (userDoc as any)['recommended'] || false,
        providerInfo: (userDoc as any)['providerInfo'] || {},
        preferences: (userDoc as any)['preferences'] || {},
        createdAt:
          userDoc.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt:
          (userDoc as any)['updatedAt']?.toISOString() || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[USER][me] erreur:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
