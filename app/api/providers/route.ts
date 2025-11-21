/**
 * API Route pour les providers
 * Implémente les design patterns :
 * - Service Layer Pattern (via userService)
 * - Repository Pattern (via userRepository)
 * - Builder Pattern (via UserQueryBuilder)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via CreateProviderSchema, ProviderFiltersSchema)
 */

// Désactiver le prerendering pour cette route API
// Elle nécessite une connexion MongoDB qui n'est pas disponible pendant le build
;

import { UserQueryBuilder } from '@/builders';
import { handleApiRoute, validateBody, validateQuery } from '@/lib/api/error-handler';
import { PROVIDER_CONSTANTS, USER_STATUSES } from '@/lib/constants/index';
import type { PaginationOptions, ProviderInfo, UserFilters, UserStatus } from '@/lib/types';
import { CreateProviderSchema, ProviderFiltersSchema } from '@/lib/validations/provider.schema';
import { getUserRepository } from '@/repositories';
import { userService } from '@/services/user/user.service';
import { NextRequest } from 'next/server';
import { z } from 'zod';

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
    // Par défaut, ne récupérer que les providers ACTIFS
    const status = filters.status || USER_STATUSES.ACTIVE;
    queryBuilder.byStatus(status);
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
    // Utiliser directement findWithPagination avec les filtres MongoDB du builder
    // car findUsersWithFilters reconstruit la requête et peut perdre les filtres
    const result = await (userRepository as any).findWithPagination(
      query.filters,
      pagination,
    );

    // Récupérer les prestataires avec filtres (pour compatibilité avec le code existant)
    const serviceFilters: Partial<UserFilters> = {};
    if (role) {
      serviceFilters.role = role;
    }
    // Par défaut, ne récupérer que les providers ACTIFS
    const statusForService = filters.status || USER_STATUSES.ACTIVE;
    serviceFilters.status = Array.isArray(statusForService)
      ? (statusForService as any[]).map(s => s as any) as UserStatus[]
      : [statusForService as any] as UserStatus[];
    if (limit !== undefined) {
      serviceFilters.limit = limit;
    }
    if (offset !== undefined) {
      serviceFilters.offset = offset;
    }
    const serviceResult = await userService.getUsers(serviceFilters);

    // Appliquer les filtres supplémentaires côté serveur si nécessaire
    // Utiliser les données du repository (plus complètes) ou du service (fallback)
    let filteredProviders: ProviderInfo[] = (result?.data || serviceResult?.data || []) as ProviderInfo[];

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
        // Note: ProviderInfo utilise 'specialties' (pluriel) mais le schéma centralisé utilise 'specialities'
        const providerSpecialties = (provider as any).specialties || (provider as any).specialities;
        if (providerSpecialties && Array.isArray(providerSpecialties)) {
          return providerSpecialties.some((spec: string) =>
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
        (provider) => {
          if (!provider) return false;
          const city = provider['city'] || (provider as any).city;
          return city &&
            typeof city === 'string' &&
            city.toLowerCase().includes(filters.city!.toLowerCase());
        },
      );
    }

    // Filtrage par spécialité
    if (filters.specialty) {
      filteredProviders = filteredProviders.filter(
        (provider) => {
          if (!provider) return false;
          // Gérer les deux variantes : specialties (ProviderInfo) et specialities (schéma)
          const providerSpecialties = (provider as any).specialties || (provider as any).specialities;
          return providerSpecialties &&
            Array.isArray(providerSpecialties) &&
            providerSpecialties.some((spec: string) =>
              spec.toLowerCase().includes(filters.specialty!.toLowerCase()),
            );
        },
      );
    }

    // Filtrage par service
    if (filters.service) {
      filteredProviders = filteredProviders.filter(
        (provider) => {
          if (!provider) return false;
          const services = provider.services;
          if (!services || !Array.isArray(services)) return false;
          return services.some((serv) => {
            // Gérer les deux cas : Service (objet) ou string
            const serviceName = typeof serv === 'string' 
              ? serv 
              : (serv as any).name || (serv as any).id || String(serv);
            return serviceName.toLowerCase().includes(filters.service!.toLowerCase());
          });
        },
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
