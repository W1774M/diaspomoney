/**
 * API Route - Verify Email
 * Endpoint de vérification d'email
 */

import dbConnect from '@/lib/mongodb';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token de vérification requis' },
        { status: 400 },
      );
    }

    // S'assurer que la connexion à la base de données est établie
    await dbConnect();

    // Vérifier le token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env['JWT_SECRET']!) as any;
    } catch (error) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré', reason: 'expired' },
        { status: 400 },
      );
    }

    if (decoded.type !== 'email_verification') {
      return NextResponse.json(
        { error: 'Type de token invalide' },
        { status: 400 },
      );
    }

    // Trouver l'utilisateur
    const user = await (User as any).findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
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

    // Marquer l'email comme vérifié
    await (User as any).findByIdAndUpdate(decoded.userId, {
      isEmailVerified: true,
      emailVerified: true,
    });

    // Enregistrer les métriques
    monitoringManager.recordMetric({
      name: 'auth_email_verifications_successful',
      value: 1,
      timestamp: new Date(),
      labels: {
        user_id: decoded.userId,
      },
      type: 'counter',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email vérifié avec succès',
        email: user.email,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Erreur verify-email API:', error);

    // Enregistrer les métriques d'échec
    monitoringManager.recordMetric({
      name: 'auth_email_verifications_failed',
      value: 1,
      timestamp: new Date(),
      type: 'counter',
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur de vérification d'email",
        success: false,
      },
      { status: 400 },
    );
  }
}
