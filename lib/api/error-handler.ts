/**
 * Gestionnaire d'erreurs centralisé pour les routes API
 * Fournit une gestion d'erreurs cohérente avec logging et Sentry
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { childLogger } from '@/lib/logger';

/**
 * Erreur API personnalisée
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreurs API prédéfinies
 */
export const ApiErrors = {
  UNAUTHORIZED: new ApiError(401, 'Non autorisé', 'UNAUTHORIZED'),
  FORBIDDEN: new ApiError(403, 'Accès non autorisé', 'FORBIDDEN'),
  NOT_FOUND: new ApiError(404, 'Ressource non trouvée', 'NOT_FOUND'),
  VALIDATION_ERROR: (details?: unknown) => 
    new ApiError(400, 'Erreur de validation', 'VALIDATION_ERROR', details),
  INTERNAL_ERROR: new ApiError(500, 'Erreur interne du serveur', 'INTERNAL_ERROR'),
} as const;

/**
 * Gère une route API avec gestion d'erreurs automatique
 * 
 * @param request - La requête Next.js
 * @param handler - Fonction handler qui retourne la réponse
 * @param routeName - Nom de la route pour le logging
 * @returns NextResponse avec gestion d'erreurs automatique
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   return handleApiRoute(request, async () => {
 *     const body = await request.json();
 *     const data = CreateInvoiceSchema.parse(body);
 *     const result = await invoiceFacade.createInvoice(data);
 *     return { success: true, invoice: result };
 *   }, 'api/invoices');
 * }
 * ```
 */
export async function handleApiRoute<T>(
  request: NextRequest,
  handler: () => Promise<T>,
  routeName: string,
): Promise<NextResponse> {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({ requestId: reqId, route: routeName });

  try {
    const result = await handler();
    return NextResponse.json(result);
  } catch (error) {
    // Erreur API personnalisée
    if (error instanceof ApiError) {
      log.warn(
        {
          error: error.message,
          code: error.code,
          statusCode: error.statusCode,
          details: error.details,
        },
        'API error',
      );

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          ...(error.details && typeof error.details === 'object' ? { details: error.details as Record<string, unknown> } : {}),
        },
        { status: error.statusCode },
      );
    }

    // Erreur de validation Zod
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ path: string[]; message: string }> };
      log.warn({ validationErrors: zodError.issues }, 'Validation error');
      
      return NextResponse.json(
        {
          error: 'Erreur de validation',
          code: 'VALIDATION_ERROR',
          details: zodError.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    // Erreur inattendue
    log.error({ error }, 'Unexpected error in API route');
    
    Sentry.captureException(error, {
      tags: {
        component: 'API',
        route: routeName,
      },
      extra: {
        requestId: reqId,
      },
    });

    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}

/**
 * Valide le body de la requête avec un schéma Zod
 * 
 * @param body - Body de la requête
 * @param schema - Schéma Zod pour la validation
 * @returns Données validées
 * @throws ApiError si la validation échoue
 */
export function validateBody<T>(
  body: unknown,
  schema: { parse: (data: unknown) => T },
): T {
  try {
    return schema.parse(body);
  } catch (error) {
    throw ApiErrors.VALIDATION_ERROR(error);
  }
}

/**
 * Valide les query params de la requête avec un schéma Zod
 * 
 * @param searchParams - URLSearchParams de la requête
 * @param schema - Schéma Zod pour la validation
 * @returns Données validées
 * @throws ApiError si la validation échoue
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: { parse: (data: unknown) => T },
): T {
  try {
    // Convertir URLSearchParams en objet
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return schema.parse(params);
  } catch (error) {
    throw ApiErrors.VALIDATION_ERROR(error);
  }
}

