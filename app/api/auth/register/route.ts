/**
 * API Route - Register
 * Endpoint d'inscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { securityManager } from '@/lib/security/advanced-security';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, country, consents } = body;

    // Validation des entrées
    if (!email || !password || !firstName || !lastName || !country) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    if (!consents || !Array.isArray(consents)) {
      return NextResponse.json(
        { error: 'Les consentements sont requis' },
        { status: 400 }
      );
    }

    // Sanitisation des entrées
    const sanitizedData = {
      email: securityManager.sanitizeInput(email),
      password: securityManager.sanitizeInput(password),
      firstName: securityManager.sanitizeInput(firstName),
      lastName: securityManager.sanitizeInput(lastName),
      phone: phone ? securityManager.sanitizeInput(phone) : undefined,
      country: securityManager.sanitizeInput(country),
      consents: securityManager.sanitizeInput(consents)
    };

    // Tentative d'inscription
    const result = await authService.register(sanitizedData);

    // Enregistrer les métriques
    monitoringManager.recordMetric({
      name: 'auth_registrations_successful',
      value: 1,
      timestamp: new Date(),
      labels: {
        country: sanitizedData.country,
        has_phone: sanitizedData.phone ? 'true' : 'false'
      },
      type: 'counter'
    });

    // Retourner la réponse
    return NextResponse.json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      message: 'Compte créé avec succès. Vérifiez votre email pour activer votre compte.'
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur register API:', error);
    
    // Enregistrer les métriques d'échec
    monitoringManager.recordMetric({
      name: 'auth_registrations_failed',
      value: 1,
      timestamp: new Date(),
      type: 'counter'
    });

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erreur d\'inscription',
        success: false 
      },
      { status: 400 }
    );
  }
}