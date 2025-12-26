/**
 * API Route pour les providers
 * Implémente les design patterns :
 * - Service Layer Pattern (via userService)
 * - Repository Pattern (via userRepository)
 * - Builder Pattern (via UserQueryBuilder)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via CreateProviderSchema, ProviderFiltersSchema)
 */

// Elle nécessite une connexion MongoDB qui n'est pas disponible pendant le build
;

import { ProviderQueryBuilder } from '@/builders';
import { auth } from '@/auth';
import { handleApiRoute, validateBody, validateQuery, ApiErrors } from '@/lib/api/error-handler';
import { createPaginatedResponse, createResourceResponse } from '@/lib/api/response';
import { PROVIDER_CONSTANTS, USER_STATUSES, ROLES, DATABASE } from '@/lib/constants/index';
import type { PaginationOptions, ProviderInfo, UserFilters, UserStatus } from '@/lib/types';
import { CreateProviderSchema, ProviderFiltersSchema } from '@/lib/validations/provider.schema';
import { getUserRepository } from '@/repositories';
import { userService } from '@/services/user/user.service';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getMongoClient } from '@/lib/database/mongodb';
/**
 * GET /api/providers - Récupérer les providers
 * 
 * @param request - La requête HTTP
 * @returns Liste paginée des providers
 */
export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    // Auth + authorization (CSM ne doit voir que son portefeuille)
    const session = await auth();
    const userId = session?.user?.id;
    const userRoles = session?.user?.roles || [];
    if (!userId) throw ApiErrors.UNAUTHORIZED;
    const isAdmin = userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SUPERADMIN);
    const isCSM = userRoles.includes(ROLES.CSM);
    if (!isAdmin && !isCSM) throw ApiErrors.FORBIDDEN;

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

    // Utiliser ProviderQueryBuilder pour construire la requête (Builder Pattern)
    const queryBuilder = new ProviderQueryBuilder();

    // Appliquer les filtres de base
    queryBuilder.providers(); // Filtrer uniquement les providers
    // Par défaut, ne récupérer que les providers ACTIFS
    // Exception: status=ALL => ne pas filtrer par statut (utile pour un portefeuille CSM)
    const requestedStatusRaw = (filters.status || '').trim().toUpperCase();
    const shouldFilterStatus = requestedStatusRaw !== 'ALL';
    const status = (filters.status || USER_STATUSES.ACTIVE) as typeof USER_STATUSES[keyof typeof USER_STATUSES];
    if (shouldFilterStatus) {
      queryBuilder.byStatus(status);
    }
    if (filters.city) {
      queryBuilder.byCity(filters.city);
    }
    if (filters.minRating !== undefined) {
      queryBuilder.withMinRating(filters.minRating);
    }

    // Pagination
    const page = Math.floor(offset / limit) + 1;
    queryBuilder.page(page, limit);

    // Construire la requête
    const query = queryBuilder.getFilters();
    const sort = queryBuilder.getSort();
    const pagination = queryBuilder.getPagination();

    // Si CSM: restreindre aux providers de son portefeuille
    if (isCSM) {
      const client = await getMongoClient();
      const db = client.db();
      const users = db.collection(DATABASE.COLLECTIONS.USERS);
      const csm = await users.findOne(
        { _id: new ObjectId(userId) },
        { projection: { csmPortfolioProviderIds: 1 } },
      );
      const ids = (csm?.['csmPortfolioProviderIds'] as string[] | undefined) || [];
      if (ids.length === 0) {
        return createPaginatedResponse([], { page: 1, limit, total: 0 });
      }
      // Injecter le filtre _id (ObjectId) dans la requête Mongo
      query['_id'] = { $in: ids.map((id) => new ObjectId(id)) };
    }

    // Utiliser le repository avec les filtres du builder
    const userRepository = getUserRepository();
    // Normaliser pagination pour garantir limit et page
    const paginationOptions: PaginationOptions = {
      limit: pagination.limit ?? 20,
      page: pagination.page ?? 1,
      ...(pagination.offset !== undefined && { offset: pagination.offset }),
      ...(Object.keys(sort).length > 0 && { sort }),
    };
    // Utiliser directement findWithPagination avec les filtres MongoDB du builder
    // car findUsersWithFilters reconstruit la requête et peut perdre les filtres
    const result = await (userRepository as any).findWithPagination(
      query,
      paginationOptions,
    );

    // Récupérer les prestataires avec filtres (pour compatibilité avec le code existant)
    const serviceFilters: Partial<UserFilters> = {};
    if (role) {
      serviceFilters.role = role;
    }
    // Par défaut, ne récupérer que les providers ACTIFS (status=ALL => pas de filtre statut)
    const statusForService = filters.status || USER_STATUSES.ACTIVE;
    if (((statusForService as any) || '').toString().trim().toUpperCase() !== 'ALL') {
      serviceFilters.status = Array.isArray(statusForService)
        ? (statusForService as any[]).map(s => s as any) as UserStatus[]
        : [statusForService as any] as UserStatus[];
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
    let filteredProviders: ProviderInfo[] = (result?.data || serviceResult?.data || []) as ProviderInfo[];

    // Re-filtrer en sécurité côté application pour CSM (au cas où le fallback serviceResult contiendrait plus)
    if (isCSM) {
      const portfolioSet = new Set(
        (query['_id']?.$in || []).map((x: any) => x.toString()),
      );
      filteredProviders = filteredProviders.filter((p: any) => {
        const id = p?.id || p?._id?.toString?.();
        return id && portfolioSet.has(String(id));
      });
    }

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

    return createPaginatedResponse(
      filteredProviders,
      {
        page: Math.floor(offset / limit) + 1,
        limit,
        total: filteredProviders.length,
      },
      {
        metadata: {
          hasResults: filteredProviders.length > 0,
        },
      },
    );
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

    return createResourceResponse(
      newProvider,
      {
        message: 'Prestataire créé avec succès',
      },
    );
  }, 'api/providers');
}
