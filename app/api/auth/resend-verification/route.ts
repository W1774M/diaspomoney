import { sendEmail } from '@/lib/email';
import { mongoClient } from '@/lib/mongodb';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    // Connexion à la base de données
    const client = await mongoClient;
    const db = client.db();
    const usersCollection = db.collection('users');

    // Recherche de l'utilisateur
    const user = await usersCollection.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return NextResponse.json(
        {
          success: true,
          message:
            'Si cet email existe, vous recevrez un nouveau lien de vérification',
        },
        { status: 200 }
      );
    }

    // Vérification si l'email est déjà vérifié
    if (user['isEmailVerified']) {
      return NextResponse.json(
        {
          success: true,
          message: 'Cet email a déjà été vérifié',
        },
        { status: 200 }
      );
    }

    // Génération d'un nouveau token de vérification
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    // Mise à jour du token dans la base de données
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationToken,
          emailVerificationExpires,
        },
      }
    );

    // Envoi de l'email de vérification
    try {
      const verificationUrl = `${process.env['NEXTAUTH_URL'] || 'http://localhost:3000'}/verify-email?token=${emailVerificationToken}`;
      await sendEmail(
        user['email'],
        'Vérification de votre email',
        verificationUrl
      );
      console.log(
        `[RESEND-VERIFICATION] Email de vérification renvoyé à ${user['email']}`
      );
    } catch (error) {
      console.error(
        "[RESEND-VERIFICATION] Erreur lors de l'envoi de l'email:",
        error
      );
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email de vérification" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email de vérification envoyé avec succès',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors du renvoi de l'email de vérification:", error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
