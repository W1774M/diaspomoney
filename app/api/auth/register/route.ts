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

import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { RegisterSchema, type RegisterInput } from '@/lib/validations/auth.schema';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { authService } from '@/services/auth/auth.service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/auth/register',
  });

  return handleApiRoute(
    request,
    async () => {
      // Validation avec Zod
      const body = await request.json();
      const data: RegisterInput = validateBody(body, RegisterSchema);

      // Sanitisation des entrées
      const sanitizedData = {
        email: data.email.trim().toLowerCase(),
        password: data.password, // Ne pas modifier le mot de passe ici
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone?.trim(),
        country: data.countryOfResidence.trim(),
        dateOfBirth: data.dateOfBirth,
        targetCountry: data.targetCountry,
        targetCity: data.targetCity,
        monthlyBudget: data.monthlyBudget,
        securityQuestion: data.securityQuestion,
        securityAnswer: data.securityAnswer,
        termsAccepted: data.termsAccepted,
        marketingConsent: data.marketingConsent || false,
        selectedServices: data.selectedServices,
        oauth: data.oauth,
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
      const result = await authService.register(sanitizedData as any, {
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
    },
    'api/auth/register',
  );
}
