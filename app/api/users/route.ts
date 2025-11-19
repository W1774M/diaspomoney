/**
 * API Route pour les utilisateurs
 * Implémente les design patterns :
 * - Service Layer Pattern (via userRepository)
 * - Repository Pattern (via userRepository)
 * - Builder Pattern (via UserQueryBuilder)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via CreateUserSchema)
 */

import { UserQueryBuilder } from '@/builders';
import { handleApiRoute, validateBody, validateQuery } from '@/lib/api/error-handler';
import type { PaginationOptions, User, UserRole, UserStatus, ProviderInfo } from '@/lib/types';
import { getUserRepository } from '@/repositories';
import { CreateUserSchema, UserFiltersSchema } from '@/lib/validations/user.schema';
import type { z } from 'zod';
import { LANGUAGES, TIMEZONES, USER_STATUSES, ROLES } from '@/lib/constants';
import { NextRequest } from 'next/server';

type CreateUserInput = z.infer<typeof CreateUserSchema>;

/**
 * GET /api/users - Récupérer les utilisateurs
 * 
 * @param request - La requête HTTP
 * @returns Liste paginée des utilisateurs
 */
export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const { searchParams } = new URL(request.url);
    const userRepository = getUserRepository();

    // Validation des paramètres de requête
    const filtersResult = validateQuery(searchParams, UserFiltersSchema);
    // Zod always returns a typed object so we can safely type the result
    type Filters = typeof filtersResult;
    const filters: Filters = filtersResult;

    // Utiliser UserQueryBuilder pour construire la requête
    const queryBuilder = new UserQueryBuilder();

    // Appliquer les filtres
    if (filters.role) {
      queryBuilder.byRole(filters.role);
    }
    if (filters.status) {
      queryBuilder.byStatus(filters.status);
    }
    if (filters.search) {
      queryBuilder.whereOr([
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ]);
    }

    // Pagination (PAGINATION from constants may not provide .DEFAULT_LIMIT/.DEFAULT_PAGE, fix that)
    const limit = filters.limit ?? 20;
    const page = filters.page ?? 1;
    queryBuilder.page(page, limit);

    // Construire et exécuter la requête
    const query = queryBuilder.build();
    // Normaliser pagination pour garantir limit et page
    const pagination: PaginationOptions = {
      limit: query.pagination.limit ?? limit,
      page: query.pagination.page ?? page,
      ...(query.pagination.offset !== undefined && { offset: query.pagination.offset }),
      ...(query.sort && { sort: query.sort }),
    };
    const result = await userRepository.findUsersWithFilters(
      query.filters,
      pagination,
    );

    return {
      success: true,
      data: result.data,
      total: result.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      hasMore: result.pagination.hasNext,
    };
  }, 'api/users');
}

/**
 * POST /api/users - Créer un nouvel utilisateur
 * 
 * Implémente les design patterns :
 * - Service Layer Pattern (via userRepository)
 * - Repository Pattern (via getUserRepository)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via CreateUserSchema)
 * 
 * @param request - La requête HTTP
 * @returns L'utilisateur créé
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const body = await request.json();

    // Validation avec Zod
    const data: CreateUserInput = validateBody(body, CreateUserSchema);

    // Utiliser UserRepository (Repository Pattern)
    const userRepository = getUserRepository();

    // Préparer les données pour la création
    // Gérer le cas où name est fourni mais pas firstName/lastName, ou vice versa
    let firstName: string;
    let lastName: string;
    let name: string;

    if (data.firstName && data.lastName) {
      firstName = data.firstName.trim();
      lastName = data.lastName.trim();
      name = data.name || `${firstName} ${lastName}`.trim();
    } else if (data.name) {
      const nameParts = data.name.trim().split(' ').filter(Boolean);
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
      name = data.name.trim();
    } else {
      // Fallback si rien n'est fourni (ne devrait pas arriver grâce à la validation)
      firstName = data.firstName?.trim() || '';
      lastName = data.lastName?.trim() || '';
      name = `${firstName} ${lastName}`.trim() || '';
    }

    // Validation finale
    if (!firstName || !lastName) {
      throw new Error('Le prénom et le nom sont obligatoires');
    }

    // Type pour les champs supplémentaires non validés par le schéma
    type ExtendedUserData = CreateUserInput & {
      company?: string;
      address?: string;
      status?: string;
      specialty?: string;
      recommended?: boolean;
      clientNotes?: string;
      preferences?: {
        language?: string;
        timezone?: string;
        notifications?: boolean;
      };
    };

    const extendedData = body as ExtendedUserData;

    // Créer l'utilisateur via le repository
    // Note: On utilise Record<string, unknown> pour éviter les problèmes avec exactOptionalPropertyTypes
    const userData = {
      email: data.email.toLowerCase(),
      name: name,
      firstName: firstName,
      lastName: lastName,
      ...(data.phone?.trim() && { phone: data.phone.trim() }),
      ...(extendedData.company?.trim() && { company: extendedData.company.trim() }),
      ...(extendedData.address?.trim() && { address: extendedData.address.trim() }),
      roles: (data.roles || [ROLES.CUSTOMER]) as UserRole[],
      status: (extendedData.status || USER_STATUSES.ACTIVE) as UserStatus,
      ...(extendedData.specialty?.trim() || data.specialty?.trim() ? { specialty: (extendedData.specialty?.trim() || data.specialty?.trim())! } : {}),
      preferences: (extendedData.preferences && {
        language: extendedData.preferences.language || LANGUAGES.FR.code,
        timezone: extendedData.preferences.timezone || TIMEZONES.PARIS,
        notifications: extendedData.preferences.notifications ?? true,
      }) || (data.preferences && {
        language: data.preferences.language || LANGUAGES.FR.code,
        timezone: data.preferences.timezone || TIMEZONES.PARIS,
        notifications: data.preferences.notifications ?? true,
      }) || {
        language: LANGUAGES.FR.code,
        timezone: TIMEZONES.PARIS,
        notifications: true,
      },
      // Champs optionnels supplémentaires
      ...(extendedData.clientNotes && {
        clientNotes: extendedData.clientNotes,
      }),
    } as Partial<User> & {
      providerInfo?: Partial<ProviderInfo>;
    };

    const user = await userRepository.create(userData);

    // Mapper vers le format attendu par le frontend
    type UserResponse = {
      id: string;
      _id: string;
      email: string;
      name: string;
      firstName: string;
      lastName: string;
      phone: string;
      company: string | undefined;
      address: string | undefined;
      roles: string[];
      status: string;
      specialty: string | undefined;
      preferences: {
        language: string;
        timezone: string;
        notifications: boolean;
      };
      createdAt: string;
      updatedAt: string;
    };

    const userRecord = user as Record<string, unknown>;
    const mappedUser: UserResponse = {
      id: user.id || user._id || '',
      _id: user.id || user._id || '',
      email: user.email,
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      company: userRecord['company'] as string | undefined,
      address: userRecord['address'] as string | undefined,
      roles: user.roles || [],
      status: user.status || USER_STATUSES.ACTIVE,
      specialty: userRecord['specialty'] as string | undefined,
      preferences: (userRecord['preferences'] as UserResponse['preferences']) || {
        language: LANGUAGES.FR.code,
        timezone: TIMEZONES.PARIS,
        notifications: true,
      },
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    };

    return {
      success: true,
      data: mappedUser,
      message: 'Utilisateur créé avec succès',
    };
  }, 'api/users');
}
