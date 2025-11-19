/**
 * API Route pour les providers
 * Implémente les design patterns :
 * - Service Layer Pattern (via userService)
 * - Repository Pattern (via userRepository)
 * - Builder Pattern (via UserQueryBuilder)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via CreateProviderSchema, ProviderFiltersSchema)
 */

import { UserQueryBuilder } from '@/builders';
import { handleApiRoute, validateBody, validateQuery } from '@/lib/api/error-handler';
import { PROVIDER_CONSTANTS, USER_STATUSES } from '@/lib/constants/index';
import type { PaginationOptions, UserFilters, UserStatus } from '@/lib/types';
import { getUserRepository } from '@/repositories';
import { userService } from '@/services/user/user.service';
import { NextRequest } from 'next/server';

// Import schemas directly to avoid validation import errors
import { z } from 'zod';

// Define ProviderFiltersSchema here (fix import)
export const ProviderFiltersSchema = z.object({
  role: z.string().optional(),
  status: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  specialty: z.string().optional(),
  service: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

// Define CreateProviderSchema as a basic example for POST (fix import)
export const CreateProviderSchema = z.object({
  category: z.string().min(1, 'Category is required').optional(),
  city: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  // Add required fields here as appropriate
});

/**
 * Interface pour un provider avec types stricts
 */
interface Provider {
  id?: string;
  _id?: string;
  category?: string;
  city?: string;
  specialties?: string[];
  services?: string[];
  rating?: number;
  [key: string]: unknown;
}

/**
 * GET /api/providers - Récupérer les providers
 * 
 * @param request - La requête HTTP
 * @returns Liste paginée des providers
 */
export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const { searchParams } = new URL(request.url);

    // Validation des paramètres de requête
    const filtersResult = validateQuery(searchParams, ProviderFiltersSchema);
    // Safe typing to fix "unknown" lint error
    type Filters = z.infer<typeof ProviderFiltersSchema>;
    const filters: Filters = filtersResult;

    // Récupérer les paramètres de filtrage et pagination
    const role = filters.role || PROVIDER_CONSTANTS.DEFAULT_ROLE;
    const limit = filters.limit ?? PROVIDER_CONSTANTS.DEFAULT_LIMIT;
    const offset = filters.offset ?? PROVIDER_CONSTANTS.DEFAULT_OFFSET;

    // Utiliser UserQueryBuilder pour construire la requête (Builder Pattern)
    const queryBuilder = new UserQueryBuilder();

    // Appliquer les filtres de base
    queryBuilder.byRole(role);
    if (filters.status) {
      queryBuilder.byStatus(filters.status);
    }
    if (filters.city) {
      queryBuilder.byCity(filters.city);
    }
    if (filters.minRating !== undefined) {
      queryBuilder.minRating(filters.minRating);
    }

    // Pagination
    const page = Math.floor(offset / limit) + 1;
    queryBuilder.page(page, limit);

    // Construire la requête
    const query = queryBuilder.build();

    // Utiliser le repository avec les filtres du builder
    const userRepository = getUserRepository();
    // Normaliser pagination pour garantir limit et page
    const pagination: PaginationOptions = {
      limit: query.pagination.limit ?? 20,
      page: query.pagination.page ?? 1,
      ...(query.pagination.offset !== undefined && { offset: query.pagination.offset }),
      ...(query.sort && { sort: query.sort }),
    };
    const result = await userRepository.findUsersWithFilters(
      query.filters,
      pagination,
    );

    // Récupérer les prestataires avec filtres (pour compatibilité avec le code existant)
    const serviceFilters: Partial<UserFilters> = {};
    if (role) {
      serviceFilters.role = role;
    }
    if (filters.status) {
      serviceFilters.status = Array.isArray(filters.status)
        ? (filters.status as any[]).map(s => s as any) as UserStatus[]
        : [filters.status as any] as UserStatus[];
    }
    if (limit !== undefined) {
      serviceFilters.limit = limit;
    }
    if (offset !== undefined) {
      serviceFilters.offset = offset;
    }
    const serviceResult = await userService.getUsers(serviceFilters);

    // Appliquer les filtres supplémentaires côté serveur si nécessaire
    // Utiliser les données du repository (plus complètes) ou du service (fallback)
    let filteredProviders: Provider[] = (result?.data || serviceResult?.data || []) as Provider[];

    // Filtrage par catégorie (si les prestataires ont une propriété category)
    if (filters.category) {
      const categorySpecialties = PROVIDER_CONSTANTS.CATEGORY_MAPPING[
        filters.category as keyof typeof PROVIDER_CONSTANTS.CATEGORY_MAPPING
      ] || [];
      filteredProviders = filteredProviders.filter((provider) => {
        if (!provider) return false;

        if (provider.category) {
          return provider.category === filters.category;
        }
        // Fallback: filtrer par spécialités si pas de catégorie
        if (provider.specialties && Array.isArray(provider.specialties)) {
          return provider.specialties.some((spec: string) =>
            (categorySpecialties as unknown as string[]).some((catSpec: string) =>
              spec.toLowerCase().includes(catSpec.toLowerCase()),
            ),
          );
        }
        return true;
      });
    }

    // Filtrage par ville
    if (filters.city) {
      filteredProviders = filteredProviders.filter(
        (provider) =>
          provider &&
          provider.city &&
          typeof provider.city === 'string' &&
          provider.city.toLowerCase().includes(filters.city!.toLowerCase()),
      );
    }

    // Filtrage par spécialité
    if (filters.specialty) {
      filteredProviders = filteredProviders.filter(
        (provider) =>
          provider &&
          provider.specialties &&
          Array.isArray(provider.specialties) &&
          provider.specialties.some((spec: string) =>
            spec.toLowerCase().includes(filters.specialty!.toLowerCase()),
          ),
      );
    }

    // Filtrage par service
    if (filters.service) {
      filteredProviders = filteredProviders.filter(
        (provider) =>
          provider &&
          provider.services &&
          Array.isArray(provider.services) &&
          provider.services.some((serv: string) =>
            serv.toLowerCase().includes(filters.service!.toLowerCase()),
          ),
      );
    }

    // Filtrage par note minimale
    if (filters.minRating !== undefined) {
      const rating = filters.minRating;
      filteredProviders = filteredProviders.filter(
        (provider) =>
          provider && 
          typeof provider.rating === 'number' && 
          provider.rating >= rating,
      );
    }

    return {
      success: true,
      providers: filteredProviders,
      total: filteredProviders.length,
      limit,
      offset,
      hasResults: filteredProviders.length > 0,
    };
  }, 'api/providers');
}

/**
 * POST /api/providers - Créer un nouveau provider
 * 
 * @param request - La requête HTTP
 * @returns Le provider créé
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const body = await request.json();

    // Validation avec Zod
    const data = validateBody(body, CreateProviderSchema);

    // Création d'un nouveau prestataire
    // TODO: Implémenter la création réelle via userService
    const newProvider = {
      id: `provider_${Date.now()}`,
      ...(data as Record<string, unknown>),
      status: USER_STATUSES.PENDING,
      createdAt: new Date(),
    };

    return {
      success: true,
      provider: newProvider,
      message: 'Prestataire créé avec succès',
    };
  }, 'api/providers');
}
