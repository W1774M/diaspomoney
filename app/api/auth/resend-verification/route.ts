/**
// Désactiver le prerendering pour cette route API


 * API Route - Resend Verification
 * Endpoint pour renvoyer l'email de vérification
 */

import { sendWelcomeEmail } from '@/lib/email/resend';
import dbConnect from '@/lib/mongodb';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
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
        { status: 400 },
      );
    }

    // S'assurer que la connexion à la base de données est établie
    await dbConnect();

    // Trouver l'utilisateur
    const user = await (User as any).findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Aucun compte trouvé avec cette adresse email' },
        { status: 404 },
      );
    }

    // Vérifier si l'email est déjà vérifié
    if (user.isEmailVerified) {
      return NextResponse.json(
        {
          success: true,
          message: 'Email déjà vérifié',
          email: user.email,
        },
        { status: 200 },
      );
    }

    // Générer un nouveau token de vérification
    const emailVerificationToken = jwt.sign(
      { userId: user._id?.toString() || user.id, type: 'email_verification' },
      process.env['JWT_SECRET']!,
      { expiresIn: '24h' },
    );

    // Envoyer l'email de bienvenue avec lien de vérification
    const verificationUrl = `${process.env['NEXTAUTH_URL'] || 'http://localhost:3000'}/verify-email?token=${emailVerificationToken}`;
    const emailSent = await sendWelcomeEmail(
      user.email,
      `${user.firstName} ${user.lastName}`,
      verificationUrl,
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 },
      );
    }

    // Enregistrer les métriques
    monitoringManager.recordMetric({
      name: 'auth_verification_emails_sent',
      value: 1,
      timestamp: new Date(),
      labels: {
        user_id: user._id?.toString() || user.id,
      },
      type: 'counter',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email de vérification renvoyé avec succès',
        email: user.email,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Erreur resend-verification API:', error);

    // Enregistrer les métriques d'échec
    monitoringManager.recordMetric({
      name: 'auth_verification_emails_failed',
      value: 1,
      timestamp: new Date(),
      type: 'counter',
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'envoi de l'email",
        success: false,
      },
      { status: 400 },
    );
  }
}
