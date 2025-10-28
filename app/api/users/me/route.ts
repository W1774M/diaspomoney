import { authenticateUser } from '@/lib/auth/middleware';
import { getMongoClient } from '@/lib/database/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Récupérer l'utilisateur authentifié (NextAuth ou JWT)
    const user = await authenticateUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Connecter à la base de données MongoDB
    const client = await getMongoClient();
    const db = client.db();
    const usersCollection = db.collection('users');

    // Récupérer l'utilisateur par email
    const userDoc = await usersCollection.findOne({
      email: user.email.toLowerCase(),
    });

    if (!userDoc) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Retourner l'utilisateur de la base de données
    return NextResponse.json({
      user: {
        id: userDoc['_id']?.toString() || '',
        email: userDoc['email'],
        name: userDoc['name'],
        firstName: userDoc['firstName'] || '',
        lastName: userDoc['lastName'] || '',
        phone: userDoc['phone'] || '',
        company: userDoc['company'] || '',
        address: userDoc['address'] || '',
        roles: userDoc['roles'] || ['CUSTOMER'],
        status: userDoc['status'] || 'ACTIVE',
        avatar: userDoc['avatar'] || { image: '', name: userDoc['name'] },
        oauth: userDoc['oauth'] || {},
        specialty: userDoc['specialty'] || '',
        recommended: userDoc['recommended'] || false,
        providerInfo: userDoc['providerInfo'] || {},
        preferences: userDoc['preferences'] || {},
        createdAt:
          userDoc['createdAt']?.toISOString() || new Date().toISOString(),
        updatedAt:
          userDoc['updatedAt']?.toISOString() || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[USER][me] erreur:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
