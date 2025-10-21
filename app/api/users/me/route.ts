import { auth } from '@/lib/auth';
import { getMongoClient } from '@/lib/database/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Récupérer la session NextAuth
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Connecter à la base de données MongoDB
    const client = await getMongoClient();
    const db = client.db();
    const usersCollection = db.collection('users');

    // Récupérer l'utilisateur par email de la session
    const user = await usersCollection.findOne({
      email: session.user.email.toLowerCase(),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Retourner l'utilisateur de la base de données
    return NextResponse.json({
      user: {
        id: user['_id']?.toString() || '',
        email: user['email'],
        name: user['name'],
        firstName: user['firstName'] || '',
        lastName: user['lastName'] || '',
        phone: user['phone'] || '',
        company: user['company'] || '',
        address: user['address'] || '',
        roles: user['roles'] || ['CUSTOMER'],
        status: user['status'] || 'ACTIVE',
        avatar: user['avatar'] || { image: '', name: user['name'] },
        oauth: user['oauth'] || {},
        specialty: user['specialty'] || '',
        recommended: user['recommended'] || false,
        providerInfo: user['providerInfo'] || {},
        preferences: user['preferences'] || {},
        createdAt: user['createdAt']?.toISOString() || new Date().toISOString(),
        updatedAt: user['updatedAt']?.toISOString() || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[USER][me] erreur:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
