/**
 * API Route - Get Verification Link
 * Endpoint pour obtenir le lien de vérification (pour les tests)
 */

import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Adresse email requise' },
        { status: 400 }
      );
    }

    // S'assurer que la connexion à la base de données est établie
    await dbConnect();

    // Trouver l'utilisateur
    const user = await (User as any).findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Aucun compte trouvé avec cette adresse email' },
        { status: 404 }
      );
    }

    // Générer un nouveau token de vérification
    const emailVerificationToken = jwt.sign(
      { userId: user._id?.toString() || user.id, type: 'email_verification' },
      process.env['JWT_SECRET']!,
      { expiresIn: '24h' }
    );

    // Créer le lien de vérification
    const verificationUrl = `${process.env['NEXTAUTH_URL'] || 'http://localhost:3000'}/verify-email?token=${emailVerificationToken}`;

    console.log('🔗 Lien de vérification généré pour:', email);
    console.log('🔗 URL:', verificationUrl);

    return NextResponse.json(
      {
        success: true,
        message: 'Lien de vérification généré',
        email: email,
        verificationUrl: verificationUrl,
        note: "En développement, l'email est envoyé à malarbillaudrey@gmail.com. Utilisez ce lien pour tester la vérification.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur get-verification-link API:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la génération du lien',
        success: false,
      },
      { status: 400 }
    );
  }
}
