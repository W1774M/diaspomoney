/**
 * API Route - Register
 * Endpoint d'inscription
 */

import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { authService, RegisterData } from '@/services/auth/auth.service';
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
      oauth,
    } = body;

    // Validation des entrées obligatoires
    if (!email || !firstName || !lastName || !countryOfResidence) {
      return NextResponse.json(
        {
          error: 'Tous les champs obligatoires doivent être remplis',
          success: false,
        },
        { status: 400 }
      );
    }

    // Validation du mot de passe (sauf pour OAuth)
    if (!oauth && !password) {
      return NextResponse.json(
        {
          error: 'Le mot de passe est obligatoire',
          success: false,
        },
        { status: 400 }
      );
    }

    // Validation des conditions d'utilisation
    if (!termsAccepted) {
      return NextResponse.json(
        {
          error: "Vous devez accepter les conditions d'utilisation",
          success: false,
        },
        { status: 400 }
      );
    }

    // Validation et sanitisation du téléphone
    let sanitizedPhone: string | undefined = undefined;
    if (phone) {
      // Nettoyer le téléphone mais garder le format international
      sanitizedPhone = phone.trim();
      // S'assurer qu'on a bien un téléphone et pas un mot de passe par erreur
      if (sanitizedPhone && sanitizedPhone.length > 20) {
        console.error('[REGISTER] Phone field seems to contain a password!');
        return NextResponse.json(
          {
            error: 'Format de téléphone invalide',
            success: false,
          },
          { status: 400 }
        );
      }
    }

    // Sanitisation des entrées
    const sanitizedData = {
      email: email.trim().toLowerCase(),
      password: password, // Ne pas modifier le mot de passe ici
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: sanitizedPhone,
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
    const result = await authService.register(sanitizedData as RegisterData);

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
