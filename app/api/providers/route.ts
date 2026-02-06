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
import { logger } from '@/lib/logger';
import { mapProviderToResponse } from '@/lib/mappers/provider.mapper';
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

    logger.debug({ 
      query, 
      filters, 
      isAdmin, 
      isCSM,
      ROLES_PROVIDER: ROLES.PROVIDER 
    }, 'Provider query filters before CSM check');

    // Si CSM: restreindre aux providers de son portefeuille
    // ⚠️ Nouveau comportement:
    // - Si le portefeuille est vide, on ne bloque plus complètement la liste
    //   (sinon aucun prestataire n'apparaît dans le select d'attribution).
    // - On log l'information mais on laisse la requête générale s'appliquer,
    //   ce qui permet au CSM de voir les prestataires globaux.
    if (isCSM) {
      const client = await getMongoClient();
      const db = client.db();
      const users = db.collection(DATABASE.COLLECTIONS.USERS);
      const csm = await users.findOne(
        { _id: new ObjectId(userId) },
        { projection: { csmPortfolioProviderIds: 1 } },
      );
      const ids = (csm?.['csmPortfolioProviderIds'] as string[] | undefined) || [];
      logger.debug({ portfolioIds: ids }, 'CSM portfolio provider IDs');

      // Si le CSM n'a pas (encore) de portefeuille défini, on ne filtre pas,
      // afin d'éviter d'avoir une liste vide côté front.
      if (ids.length > 0) {
        // Injecter le filtre _id (ObjectId) dans la requête Mongo
        query['_id'] = { $in: ids.map((id) => new ObjectId(id)) };
      }
    }

    // Vérifier directement en BDD s'il y a des providers (pour débogage)
    try {
      const client = await getMongoClient();
      const db = client.db();
      const usersCollection = db.collection(DATABASE.COLLECTIONS.USERS);
      
      // Compter tous les utilisateurs avec le rôle PROVIDER
      const totalProvidersCount = await usersCollection.countDocuments({
        roles: { $in: [ROLES.PROVIDER] }
      });
      
      // Compter avec le filtre de statut si applicable
      const queryWithStatus = { ...query };
      const providersWithStatusCount = await usersCollection.countDocuments(queryWithStatus);
      
      // Essayer différentes variantes de la requête pour déboguer
      const queryRolesOnly = { roles: { $in: [ROLES.PROVIDER] } };
      const countRolesOnly = await usersCollection.countDocuments(queryRolesOnly);
      
      // Vérifier aussi avec roles comme string (au cas où)
      const queryRolesString = { roles: ROLES.PROVIDER };
      const countRolesString = await usersCollection.countDocuments(queryRolesString);
      
      // Vérifier aussi avec roles comme array contenant PROVIDER
      const queryRolesArray = { roles: { $elemMatch: { $eq: ROLES.PROVIDER } } };
      const countRolesArray = await usersCollection.countDocuments(queryRolesArray);
      
      // Récupérer un échantillon pour voir la structure
      const sampleProvider = await usersCollection.findOne({ roles: { $in: [ROLES.PROVIDER] } });
      
      logger.debug({ 
        totalProvidersCount,
        providersWithStatusCount,
        countRolesOnly,
        countRolesString,
        countRolesArray,
        queryWithStatus,
        requestedStatus: filters.status,
        shouldFilterStatus,
        sampleProviderRoles: sampleProvider?.['roles'],
        sampleProviderStatus: sampleProvider?.['status'],
        sampleProviderId: sampleProvider?._id?.toString()
      }, 'Direct MongoDB provider counts and sample');
    } catch (debugError) {
      logger.error({ error: debugError }, 'Error in debug MongoDB query');
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

    logger.debug({ 
      query, 
      paginationOptions, 
      resultCount: result?.data?.length || 0,
      total: result?.total || 0
    }, 'Providers query result from repository');

    // Récupérer les prestataires avec filtres (pour compatibilité avec le code existant)
    const serviceFilters: Partial<UserFilters> = {};
    if (role) {
      serviceFilters.role = role;
    }
    // Par défaut, ne récupérer que les providers ACTIFS (status=ALL => pas de filtre statut)
    // Ne pas utiliser serviceResult si on a déjà un result du repository
    // car cela peut créer des incohérences
    const statusForService = filters.status || '';
    const statusForServiceUpper = statusForService.toString().trim().toUpperCase();
    if (statusForServiceUpper !== 'ALL' && statusForServiceUpper !== '') {
      serviceFilters.status = Array.isArray(statusForService)
        ? (statusForService as any[]).map(s => s as any) as UserStatus[]
        : [statusForService as any] as UserStatus[];
    } else if (!statusForServiceUpper) {
      // Si pas de status spécifié, utiliser ACTIVE par défaut pour le service
      serviceFilters.status = [USER_STATUSES.ACTIVE as unknown as UserStatus];
    }
    if (limit !== undefined) {
      serviceFilters.limit = limit;
    }
    if (offset !== undefined) {
      serviceFilters.offset = offset;
    }
    const serviceResult = await userService.getUsers(serviceFilters);

    logger.debug({ 
      serviceFilters, 
      serviceResultCount: serviceResult?.data?.length || 0 
    }, 'Providers query result from service');

    // Mapper les providers depuis le repository ou, en fallback, depuis le service
    // Important : si le repository renvoie un tableau vide, on ne veut PAS ignorer
    // un éventuel résultat non vide du service (cas observé en pré-prod).
    const resultData = Array.isArray(result?.data) ? result.data : [];
    const serviceData = Array.isArray(serviceResult?.data) ? serviceResult.data : [];
    const rawProviders = resultData.length > 0 ? resultData : serviceData;
    let filteredProviders: ProviderInfo[] = rawProviders.map((p: any) => {
      // Si déjà au format ProviderInfo, retourner tel quel
      if (p.id && p.email && p.name && p.documents !== undefined) {
        return p as ProviderInfo;
      }
      // Sinon, mapper avec mapProviderToResponse
      try {
        const mapped = mapProviderToResponse(p);
        const providerType = Array.isArray(mapped.type) ? mapped.type[0] : mapped.type;
        return {
          id: mapped.id,
          _id: mapped._id || mapped.id,
          email: mapped.email,
          name: mapped.name,
          firstName: mapped.firstName,
          lastName: mapped.lastName,
          phone: mapped.phone,
          roles: mapped.roles,
          status: mapped.status as any,
          specialty: mapped.specialty,
          specialties: mapped.specialties || [],
          rating: mapped.rating || 0,
          reviewCount: mapped.reviewCount || 0,
          isVerified: false,
          type: providerType || 'INDIVIDUAL',
          category: (p as any).category || 'OTHER',
          services: (mapped.services || []).map((s: any) => ({
            id: s.id || '',
            name: s.name || '',
            description: s.description,
            price: s.price,
            duration: s.duration || 0,
            category: s.category || 'OTHER',
          })) as any,
          city: mapped.city,
          address: mapped.address,
          company: mapped.company,
          documents: (p as any).documents || [],
          createdAt: mapped.createdAt ? new Date(mapped.createdAt) : new Date(),
          updatedAt: mapped.updatedAt ? new Date(mapped.updatedAt) : new Date(),
        } as ProviderInfo;
      } catch (error) {
        logger.error({ error, provider: p }, 'Error mapping provider');
        return null;
      }
    }).filter((p: ProviderInfo | null): p is ProviderInfo => p !== null);

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

    // Calculer le total correct (avant filtrage côté serveur)
    const total = result?.total || serviceResult?.total || filteredProviders.length;

    logger.debug({ 
      filteredCount: filteredProviders.length,
      total,
      page: Math.floor(offset / limit) + 1,
      limit
    }, 'Final providers response');

    return createPaginatedResponse(
      filteredProviders,
      {
        page: Math.floor(offset / limit) + 1,
        limit,
        total: total,
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
 * POST /api/providers - Transformer un utilisateur existant en provider
 * 
 * Implémente les design patterns :
 * - Service Layer Pattern (via userService)
 * - Repository Pattern (via userRepository)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via CreateProviderSchema)
 * 
 * @param request - La requête HTTP
 * @returns Le provider créé
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    // Vérifier l'authentification et l'autorisation
    const session = await auth();
    if (!session?.user?.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    const userRoles = session.user.roles || [];
    const isAdmin = userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SUPERADMIN);
    
    if (!isAdmin) {
      throw ApiErrors.FORBIDDEN;
    }

    const body = await request.json();

    // Validation avec Zod
    const data = validateBody(body, CreateProviderSchema);

    const { userId, specialities, category, city, rating, services } = data;

    // Récupérer l'utilisateur existant
    const userRepository = getUserRepository();
    const existingUser = await userRepository.findById(userId);

    if (!existingUser) {
      throw ApiErrors.NOT_FOUND;
    }

    // Vérifier que l'utilisateur n'est pas déjà un provider
    const currentRoles = Array.isArray(existingUser.roles) 
      ? existingUser.roles.map(r => String(r))
      : existingUser.roles 
        ? [String(existingUser.roles)] 
        : [];
    
    const isAlreadyProvider = currentRoles.some(role => 
      role === ROLES.PROVIDER || role.toUpperCase() === 'PROVIDER'
    );

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Ajouter le rôle PROVIDER s'il n'est pas déjà présent
    if (!isAlreadyProvider) {
      const newRoles = [...currentRoles, ROLES.PROVIDER];
      updateData['roles'] = newRoles;
    }

    // Mettre à jour les spécialités
    if (specialities && specialities.length > 0) {
      updateData['specialties'] = specialities;
      updateData['specialty'] = specialities[0]; // Première spécialité comme spécialité principale
    }

    // Mettre à jour la catégorie si fournie
    if (category) {
      updateData['category'] = category;
    }

    // Construire ou mettre à jour le providerInfo
    const existingProviderInfo = (existingUser as any).providerInfo || {};
    const providerInfoData: any = {
      ...existingProviderInfo,
      specialties: specialities || existingProviderInfo.specialties || [],
      ...(category && { category }),
      ...(rating !== undefined && { 
        rating: rating,
        reviewCount: existingProviderInfo.reviewCount || 0,
      }),
      ...(city && {
        professionalAddress: {
          ...existingProviderInfo.professionalAddress,
          city: city,
        },
      }),
      // Conserver le type s'il existe, sinon utiliser INDIVIDUAL par défaut
      type: existingProviderInfo.type || 'INDIVIDUAL',
      // Conserver isVerified s'il existe, sinon false
      isVerified: existingProviderInfo.isVerified || false,
    };

    updateData['providerInfo'] = providerInfoData;

    // Mettre à jour les services si fournis
    if (services && services.length > 0) {
      updateData['selectedServices'] = services;
    }

    // Mettre à jour la ville au niveau utilisateur si fournie
    if (city) {
      // La ville peut être stockée dans address ou dans un champ séparé
      // On peut aussi la stocker dans metadata pour faciliter la recherche
      if (!updateData['metadata']) {
        updateData['metadata'] = (existingUser as any).metadata || {};
      }
      (updateData['metadata'] as Record<string, unknown>)['city'] = city;
    }

    // Utiliser userService pour mettre à jour le profil
    const updatedUser = await userService.updateUserProfile(userId, updateData as any);

    if (!updatedUser) {
      throw new Error('Erreur lors de la mise à jour de l\'utilisateur en provider');
    }

    // Construire la réponse avec les informations du provider
    const providerResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      roles: Array.isArray(updatedUser.roles) ? updatedUser.roles : [updatedUser.roles],
      status: updatedUser.status,
      specialties: specialities || [],
      category: category || existingProviderInfo.category,
      city: city || existingProviderInfo.professionalAddress?.city,
      rating: rating !== undefined ? rating : existingProviderInfo.rating || 0,
      services: services || [],
      providerInfo: providerInfoData,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return createResourceResponse(
      providerResponse,
      {
        message: 'Prestataire créé avec succès',
      },
    );
  }, 'api/providers');
}
