/**
 * API Route pour les devis/quotes
 * Implémente les design patterns :
 * - Service Layer Pattern (via quoteRepository)
 * - Repository Pattern (via quoteRepository)
 * - Builder Pattern (via QuoteQueryBuilder)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via schemas)
 */

import { auth } from '@/auth';
import { QuoteQueryBuilder } from '@/builders';
import { handleApiRoute, validateQuery, ApiErrors } from '@/lib/api/error-handler';
import { createPaginatedResponse } from '@/lib/api/response';
import { getQuoteRepository } from '@/repositories';
import { quoteMapper } from '@/lib/mappers';
import { NextRequest } from 'next/server';
import { z } from 'zod';
const QuoteFiltersSchema = z.object({
  type: z.enum(['BTP', 'EDUCATION']).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
  providerId: z.string().optional(),
  schoolId: z.string().optional(),
  userId: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

/**
 * GET /api/quotes - Récupérer la liste des devis
 */
export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Validation des paramètres de requête
    const filtersResult = validateQuery(searchParams, QuoteFiltersSchema);
    type Filters = z.infer<typeof QuoteFiltersSchema>;
    const filters: Filters = filtersResult;

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    // Utiliser QuoteQueryBuilder pour construire la requête (Builder Pattern)
    const queryBuilder = new QuoteQueryBuilder();

    // Vérifier si l'utilisateur est admin
    const isAdmin =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('SUPERADMIN');

    // Si l'utilisateur n'est pas admin, filtrer par userId (via contact.email ou providerId)
    if (!isAdmin && userId) {
      // Pour l'instant, on filtre par userId si fourni dans les query params
      // Sinon, on pourrait filtrer par contact.email basé sur l'email de l'utilisateur
      if (filters.userId) {
        // Logique de filtrage à implémenter selon les besoins
      }
    }

    // Appliquer les filtres
    if (filters.type) {
      queryBuilder.byType(filters.type);
    }
    if (filters.status) {
      queryBuilder.byStatus(filters.status);
    }
    if (filters.providerId) {
      queryBuilder.byProvider(filters.providerId);
    }
    if (filters.schoolId) {
      queryBuilder.bySchool(filters.schoolId);
    }

    // Pagination
    queryBuilder.page(page, limit);

    // Construire la requête
    const query = queryBuilder.build();

    // Utiliser le repository avec les filtres du builder
    const quoteRepository = getQuoteRepository();
    const pageNumber = query.pagination?.page || 1;
    const pageLimit = query.pagination?.limit || 20;
    const offset = (pageNumber - 1) * pageLimit;

    // Utiliser findAll avec les filtres
    const allQuotes = await quoteRepository.findAll(query.filters);

    // Pagination manuelle (le repository pourrait avoir une méthode avec pagination)
    const total = allQuotes.length;
    const paginatedQuotes = allQuotes.slice(offset, offset + pageLimit);

    // Mapper les quotes avec quoteMapper
    const mappedQuotes = paginatedQuotes.map(quote => quoteMapper.map(quote as any));

    return createPaginatedResponse(
      mappedQuotes,
      {
        page: pageNumber,
        limit: pageLimit,
        total,
      },
    );
  }, 'api/quotes');
}

