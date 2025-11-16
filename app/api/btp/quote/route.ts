/**
 * API Route - BTP Quote
 * Endpoint pour les demandes de devis BTP
 * Implémente les design patterns :
 * - Service Layer Pattern (via btpService)
 * - Repository Pattern (via btpService qui utilise le repository)
 * - Dependency Injection (via btpService singleton)
 * - Logger Pattern (structured logging avec childLogger + @Log decorator dans le service)
 * - Middleware Pattern (authentification optionnelle)
 * - Decorator Pattern (@Log, @InvalidateCache dans btpService)
 * - Singleton Pattern (btpService)
 */

import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { btpService } from '@/services/btp/btp.service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({ requestId: reqId, route: 'api/btp/quote' });

  try {
    // Authentification optionnelle (pour les utilisateurs connectés)
    const session = await auth();
    const userId = session?.user?.id;

    const body = await request.json();
    const {
      projectType,
      area,
      features,
      budget,
      timeline,
      location,
      contact,
      description,
      urgency,
      providerId,
    } = body;

    log.debug(
      {
        userId,
        projectType,
        area,
        hasFeatures: (features || []).length > 0,
      },
      'Creating BTP quote request'
    );

    // Validation des entrées
    if (!projectType || !area || !contact.name || !contact.email) {
      log.warn({ body }, 'Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Utiliser le service avec décorateurs (@Log, @InvalidateCache)
    // Le service gère toute la logique métier, le cache et les notifications
    const quote = await btpService.createBTPQuote({
      projectType,
      area: typeof area === 'string' ? parseInt(area) : area,
      features: features || [],
      budget: budget
        ? typeof budget === 'string'
          ? parseInt(budget)
          : budget
        : undefined,
      timeline,
      location,
      contact,
      description,
      urgency: urgency || 'MEDIUM',
      providerId: providerId || userId,
    });

    log.info(
      {
        userId,
        quoteId: quote.id,
        projectType,
        estimatedCost: quote.costEstimate,
      },
      'BTP quote request created successfully'
    );

    return NextResponse.json(
      {
        success: true,
        quote,
        message: 'Demande de devis envoyée avec succès',
      },
      { status: 201 }
    );
  } catch (error) {
    log.error(
      { error, msg: 'Error creating BTP quote' },
      'Error creating BTP quote'
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
