/**
// Désactiver le prerendering pour cette route API
;

 * API Route pour les utilisateurs
 * Implémente les design patterns :
 * - Facade Pattern (via userFacade)
 * - Service Layer Pattern (via userFacade qui utilise userService)
 * - Repository Pattern (via userFacade qui utilise userRepository)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via CreateUserSchema, UserFiltersSchema)
 */

import { handleApiRoute, validateBody, validateQuery } from '@/lib/api/error-handler';
import { createPaginatedResponse, createResourceResponse } from '@/lib/api/response';
import { CreateUserSchema, UserFiltersSchema } from '@/lib/validations/user.schema';
import type { z } from 'zod';
import type { UserFilters, UserStatus } from '@/lib/types';
import { LANGUAGES, TIMEZONES, USER_STATUSES, ROLES } from '@/lib/constants';
import { NextRequest } from 'next/server';

type CreateUserInput = z.infer<typeof CreateUserSchema>;

/**
 * GET /api/users - Récupérer les utilisateurs
 * 
 * Implémente les design patterns :
 * - Facade Pattern (via userFacade.getUsers)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via UserFiltersSchema)
 * 
 * @param request - La requête HTTP
 * @returns Liste paginée des utilisateurs
 */
export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const { searchParams } = new URL(request.url);

    // Validation des paramètres de requête
    const filtersResult = validateQuery(searchParams, UserFiltersSchema);
    // Zod always returns a typed object so we can safely type the result
    type Filters = typeof filtersResult;
    const filters: Filters = filtersResult;

    // Pagination
    const limit = filters.limit ?? 20;
    const page = filters.page ?? 1;

    // Importer userFacade
    const { userFacade } = await import('@/facades');

    // Utiliser UserFacade pour récupérer les utilisateurs (Facade Pattern)
    // Convertir status en string si c'est un tableau (pour compatibilité avec UserFilters)
    const statusFilter = Array.isArray(filters.status) 
      ? filters.status[0] 
      : filters.status;

    // Construire les filtres en excluant les valeurs undefined pour exactOptionalPropertyTypes
    // Note: UserFilters.status attend UserStatus[] mais on passe string pour le builder
    const userFilters: Partial<UserFilters> = {};
    if (filters.role) {
      userFilters.role = filters.role;
    }
    if (statusFilter && typeof statusFilter === 'string') {
      // Convertir string en UserStatus[] pour correspondre au type UserFilters
      userFilters.status = [statusFilter as UserStatus];
    }
    if (filters.search) {
      userFilters.search = filters.search;
    }

    const result = await userFacade.getUsers(
      userFilters,
      {
        limit,
        page,
      },
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Erreur lors de la récupération des utilisateurs');
    }

    return createPaginatedResponse(
      result.data,
      result.pagination || {
        page,
        limit,
        total: result.total || 0,
      },
    );
  }, 'api/users');
}

/**
 * POST /api/users - Créer un nouvel utilisateur
 * 
 * Implémente les design patterns :
 * - Facade Pattern (via userFacade)
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

    // Importer userFacade
    const { userFacade } = await import('@/facades');

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
      kycData?: {
        documents: Array<{
          type: string;
          fileUrl: string;
        }>;
      };
      sendWelcomeNotification?: boolean;
    };

    const extendedData = body as ExtendedUserData;

    // Utiliser UserFacade pour créer l'utilisateur (Facade Pattern)
    const facadeData = {
      email: data.email.toLowerCase(),
      name: name,
      firstName: firstName,
      lastName: lastName,
      ...(data.phone?.trim() && { phone: data.phone.trim() }),
      roles: data.roles || [ROLES.CUSTOMER],
      status: extendedData.status || USER_STATUSES.ACTIVE,
      ...(extendedData.kycData && { kycData: extendedData.kycData }),
      sendWelcomeNotification: extendedData.sendWelcomeNotification ?? true,
      metadata: {
        ...(extendedData.company?.trim() && { company: extendedData.company.trim() }),
        ...(extendedData.address?.trim() && { address: extendedData.address.trim() }),
        ...(extendedData.specialty?.trim() && { specialty: extendedData.specialty.trim() }),
        ...(extendedData.clientNotes && { clientNotes: extendedData.clientNotes }),
        ...(extendedData.preferences && { preferences: extendedData.preferences }),
      },
    };

    const result = await userFacade.execute(facadeData);

    if (!result.success || !result.user) {
      throw new Error(result.error || 'Erreur lors de la création de l\'utilisateur');
    }

    // Mapper vers le format attendu par le frontend
    const user = result.user;
    const userRecord = user as Record<string, unknown>;
    
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

    return createResourceResponse(
      mappedUser,
      {
        message: result.message || 'Utilisateur créé avec succès',
        metadata: {
          notificationSent: result.notificationSent,
        },
      },
    );
  }, 'api/users');
}
