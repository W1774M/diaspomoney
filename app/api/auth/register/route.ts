/**
 * API Route - Register
 * Endpoint d'inscription
 */

import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { authService } from '@/services/auth/auth.service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      countryOfResidence,
      targetCountry,
      targetCity,
      dateOfBirth,
      monthlyBudget,
      securityQuestion,
      securityAnswer,
      termsAccepted,
      marketingConsent,
      selectedServices,
      oauth
    } = body;

    // Validation des entrées obligatoires
    if (!email || !firstName || !lastName || !countryOfResidence) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Validation du mot de passe (sauf pour OAuth)
    if (!oauth && !password) {
      return NextResponse.json(
        { error: 'Le mot de passe est obligatoire' },
        { status: 400 }
      );
    }

    // Validation des conditions d'utilisation
    if (!termsAccepted) {
      return NextResponse.json(
        { error: 'Vous devez accepter les conditions d\'utilisation' },
        { status: 400 }
      );
    }

    // Sanitisation des entrées
    const sanitizedData = {
      email: email.trim().toLowerCase(),
      password: password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone ? phone.trim() : undefined,
      country: countryOfResidence.trim(),
      dateOfBirth: dateOfBirth,
      targetCountry: targetCountry,
      targetCity: targetCity,
      monthlyBudget: monthlyBudget,
      securityQuestion: securityQuestion,
      securityAnswer: securityAnswer,
      termsAccepted: termsAccepted,
      marketingConsent: marketingConsent || false,
      selectedServices: selectedServices,
      oauth: oauth,
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
        has_phone: sanitizedData.phone ? 'true' : 'false',
      },
      type: 'counter',
    });

    // Retourner la réponse
    return NextResponse.json(
      {
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        message:
          'Compte créé avec succès. Vérifiez votre email pour activer votre compte.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur register API:', error);

    // Enregistrer les métriques d'échec
    monitoringManager.recordMetric({
      name: 'auth_registrations_failed',
      value: 1,
      timestamp: new Date(),
      type: 'counter',
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur d'inscription",
        success: false,
      },
      { status: 400 }
    );
  }
}
