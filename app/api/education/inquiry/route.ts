/**
 * API Route - Education Inquiry
 * Endpoint pour les demandes de renseignements éducation
 * Implémente les design patterns :
 * - Service Layer Pattern (via educationService)
 * - Repository Pattern (via educationService qui utilise le repository)
 * - Dependency Injection (via educationService singleton)
 * - Logger Pattern (structured logging avec childLogger + @Log decorator dans le service)
 * - Middleware Pattern (authentification optionnelle)
 * - Decorator Pattern (@Log, @InvalidateCache dans educationService)
 * - Singleton Pattern (educationService)
 */

import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { educationService } from '@/services/education/education.service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({ requestId: reqId, route: 'api/education/inquiry' });

  try {
    // Authentification optionnelle (pour les utilisateurs connectés)
    const session = await auth();
    const userId = session?.user?.id;

    const body = await request.json();
    const {
      studentType,
      studentInfo,
      academicInfo,
      contact,
      preferences,
      questions,
      schoolId,
    } = body;

    log.debug(
      {
        userId,
        studentType,
        studentName: `${studentInfo?.firstName || ''} ${
          studentInfo?.lastName || ''
        }`,
        hasSchool: !!schoolId,
      },
      'Creating education inquiry request'
    );

    // Validation des entrées
    if (
      !studentInfo?.firstName ||
      !studentInfo?.lastName ||
      !contact?.name ||
      !contact?.email
    ) {
      log.warn({ body }, 'Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Utiliser le service avec décorateurs (@Log, @InvalidateCache)
    // Le service gère toute la logique métier, le cache et les notifications
    const quote = await educationService.createEducationInquiry({
      studentType: studentType || 'SELF',
      studentInfo,
      academicInfo,
      contact,
      preferences,
      questions,
      schoolId,
    });

    log.info(
      {
        userId,
        quoteId: quote.id,
        studentType,
        program: academicInfo?.desiredProgram,
      },
      'Education inquiry request created successfully'
    );

    return NextResponse.json(
      {
        success: true,
        inquiryRequest: quote,
        message: 'Demande de renseignements envoyée avec succès',
      },
      { status: 201 }
    );
  } catch (error) {
    log.error(
      { error, msg: 'Error creating education inquiry' },
      'Error creating education inquiry'
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur de traitement de la demande',
        success: false,
      },
      { status: 500 }
    );
  }
}
