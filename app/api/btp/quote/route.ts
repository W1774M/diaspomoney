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
import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { CreateQuoteSchema, type CreateQuoteInput } from '@/lib/validations/quote.schema';
import { btpService } from '@/services/btp/btp.service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({ requestId: reqId, route: 'api/btp/quote' });

  return handleApiRoute(request, async () => {
    // Authentification optionnelle (pour les utilisateurs connectés)
    const session = await auth();
    const userId = session?.user?.id;

    const body = await request.json();
    
    // Validation avec Zod - S'assurer que le type est BTP
    const validatedBody = { ...body, type: 'BTP' as const };
    const data: CreateQuoteInput = validateBody(validatedBody, CreateQuoteSchema);

    log.debug(
      {
        userId,
        projectType: data.projectType,
        area: data.area,
        hasFeatures: (data.features || []).length > 0,
      },
      'Creating BTP quote request',
    );

    // Utiliser le service avec décorateurs (@Log, @InvalidateCache)
    // Le service gère toute la logique métier, le cache et les notifications
    if (!data.location) {
      throw new Error('Location is required for BTP quote');
    }
    
    const quoteData: {
      projectType: string;
      area: number;
      features: string[];
      budget?: number;
      timeline?: string;
      location: { city: string; country: string };
      contact: { name: string; email: string; phone?: string };
      description?: string;
      urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
      providerId?: string;
    } = {
      projectType: data.projectType!,
      area: data.area!,
      features: data.features || [],
      location: data.location,
      contact: {
        name: data.contact.name,
        email: data.contact.email,
      },
    };
    
    if (data.budget !== undefined) quoteData.budget = data.budget;
    if (data.timeline !== undefined) quoteData.timeline = data.timeline;
    if (data.contact.phone !== undefined) quoteData.contact.phone = data.contact.phone;
    if (data.description !== undefined) quoteData.description = data.description;
    if (data.urgency !== undefined) quoteData.urgency = data.urgency;
    const finalProviderId = data.providerId || userId;
    if (finalProviderId !== undefined) quoteData.providerId = finalProviderId;
    
    const quote = await btpService.createBTPQuote(quoteData);

    log.info(
      {
        userId,
        quoteId: quote.id,
        projectType: data.projectType,
        estimatedCost: quote.costEstimate,
      },
      'BTP quote request created successfully',
    );

    return NextResponse.json(
      {
        success: true,
        quote,
        message: 'Demande de devis envoyée avec succès',
      },
      { status: 201 },
    );
  }, 'api/btp/quote');
}
