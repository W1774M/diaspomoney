/**
 * API Route - Register
 * Endpoint d'inscription
 *
 * Implémente les design patterns :
 * - Service Layer Pattern (via authService)
 * - Repository Pattern (via authService qui utilise les repositories)
 * - Dependency Injection (via authService singleton)
 * - Logger Pattern (structured logging avec childLogger + @Log decorator dans le service)
 * - Error Handling Pattern (Sentry)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache dans authService)
 * - Singleton Pattern (authService)
 */

import { childLogger } from '@/lib/logger';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { authService } from '@/services/auth/auth.service';
import type { RegisterData } from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/auth/register',
  });

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
      log.warn(
        {
          hasEmail: !!email,
          hasFirstName: !!firstName,
          hasLastName: !!lastName,
          hasCountry: !!countryOfResidence,
        },
        'Registration validation failed: missing required fields',
      );
      return NextResponse.json(
        {
          error: 'Tous les champs obligatoires doivent être remplis',
          success: false,
        },
        { status: 400 },
      );
    }

    // Validation du mot de passe (sauf pour OAuth)
    if (!oauth && !password) {
      log.warn(
        { email: email.trim().toLowerCase(), hasOAuth: !!oauth },
        'Registration validation failed: password required',
      );
      return NextResponse.json(
        {
          error: 'Le mot de passe est obligatoire',
          success: false,
        },
        { status: 400 },
      );
    }

    // Validation des conditions d'utilisation
    if (!termsAccepted) {
      log.warn(
        { email: email.trim().toLowerCase() },
        'Registration validation failed: terms not accepted',
      );
      return NextResponse.json(
        {
          error: "Vous devez accepter les conditions d'utilisation",
          success: false,
        },
        { status: 400 },
      );
    }

    // Validation et sanitisation du téléphone
    let sanitizedPhone: string | undefined = undefined;
    if (phone) {
      // Nettoyer le téléphone mais garder le format international
      sanitizedPhone = phone.trim();
      // S'assurer qu'on a bien un téléphone et pas un mot de passe par erreur
      if (sanitizedPhone && sanitizedPhone.length > 20) {
        log.error(
          {
            email: email.trim().toLowerCase(),
            phoneLength: sanitizedPhone.length,
          },
          'Registration validation failed: phone field seems to contain a password',
        );
        Sentry.captureMessage('Suspicious phone field in registration', {
          level: 'warning',
          extra: {
            email: email.trim().toLowerCase(),
            phoneLength: sanitizedPhone.length,
          },
        });
        return NextResponse.json(
          {
            error: 'Format de téléphone invalide',
            success: false,
          },
          { status: 400 },
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

    // Extraire IP et User-Agent pour l'audit
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    log.debug(
      {
        email: sanitizedData.email,
        country: sanitizedData.country,
        hasPhone: !!sanitizedData.phone,
        hasOAuth: !!sanitizedData.oauth,
        ipAddress,
      },
      'Attempting user registration',
    );

    // Tentative d'inscription
    const result = await authService.register(sanitizedData as RegisterData, {
      ipAddress,
      userAgent,
    });

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

    log.info(
      {
        userId: result.user.id,
        email: result.user.email,
        country: sanitizedData.country,
        ipAddress,
      },
      'User registration successful',
    );

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
      { status: 201 },
    );
  } catch (error) {
    log.error(
      {
        error,
        msg: 'Error during user registration',
        email: (error as any)?.email || 'unknown',
      },
      'Registration failed',
    );

    // Enregistrer les métriques d'échec
    monitoringManager.recordMetric({
      name: 'auth_registrations_failed',
      value: 1,
      timestamp: new Date(),
      type: 'counter',
    });

    // Envoyer à Sentry pour monitoring
    Sentry.captureException(error, {
      tags: {
        route: 'api/auth/register',
        action: 'registration',
      },
      extra: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur d'inscription",
        success: false,
      },
      { status: 400 },
    );
  }
}
