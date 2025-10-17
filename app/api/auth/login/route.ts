/**
 * API Route - Login
 * Endpoint d'authentification
 */

import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { authService } from '@/services/auth/auth.service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // Validation des entrées
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Sanitisation des entrées
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password;

    // Tentative de connexion
    const result = await authService.login({
      email: sanitizedEmail,
      password: sanitizedPassword,
      rememberMe: rememberMe || false,
    });

    // Enregistrer les métriques
    monitoringManager.recordMetric({
      name: 'auth_logins_successful',
      value: 1,
      timestamp: new Date(),
      labels: {
        user_role: result.user.role,
      },
      type: 'counter',
    });

    // Retourner la réponse
    return NextResponse.json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    console.error('Erreur login API:', error);

    // Enregistrer les métriques d'échec
    monitoringManager.recordMetric({
      name: 'auth_logins_failed',
      value: 1,
      timestamp: new Date(),
      type: 'counter',
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erreur de connexion',
        success: false,
      },
      { status: 401 }
    );
  }
}
