import { auth } from '@/lib/auth';
import { mongoClient } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { provider } = await request.json();
    if (!provider || !['google', 'facebook'].includes(provider)) {
      return NextResponse.json({ error: 'Provider invalide' }, { status: 400 });
    }

    const client = await mongoClient;
    const db = client.db();
    const users = db.collection('users');

    const email = session.user.email.toLowerCase();

    // Récupérer l'utilisateur pour vérifier les moyens d'authentification
    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Vérifier qu'il reste au moins un moyen d'authentification
    const hasPassword = user['password'] && user['password'].length > 0;
    const linkedOAuthAccounts = [];

    if (user['oauth']?.google?.linked) linkedOAuthAccounts.push('google');
    if (user['oauth']?.facebook?.linked) linkedOAuthAccounts.push('facebook');

    const willHaveLinkedAccounts = linkedOAuthAccounts.filter(
      acc => acc !== provider
    );

    if (!hasPassword && willHaveLinkedAccounts.length === 0) {
      return NextResponse.json(
        {
          error:
            'Impossible de dissocier ce compte. Vous devez avoir au moins un mot de passe actif ou un autre compte social lié pour pouvoir vous connecter.',
        },
        { status: 400 }
      );
    }

    const update = {
      $set: { [`oauth.${provider}.linked`]: false },
      $unset: { [`oauth.${provider}.providerAccountId`]: '' },
    } as any;

    const result = await users.updateOne({ email }, update);
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[USER][oauth.unlink] erreur:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
