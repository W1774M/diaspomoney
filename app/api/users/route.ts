/**
;

 * API Route pour les utilisateurs
 * Implémente les design patterns :
 * - Facade Pattern (via userFacade)
 * - Service Layer Pattern (via userFacade qui utilise userService)
 * - Repository Pattern (via userFacade qui utilise userRepository)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via CreateUserSchema, UserFiltersSchema)
 */

import { handleApiRoute, validateBody, validateQuery, ApiError } from '@/lib/api/error-handler';
import { createPaginatedResponse, createResourceResponse } from '@/lib/api/response';
import { CreateUserSchema, UserFiltersSchema } from '@/lib/validations/user.schema';
import type { z } from 'zod';
import type { UserFilters, UserStatus } from '@/lib/types';
import { LANGUAGES, TIMEZONES, USER_STATUSES, ROLES } from '@/lib/constants';
import { NextRequest } from 'next/server';
import { getPublicBaseUrl } from '@/lib/api/public-url';

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
    // Pour les entreprises (INSTITUTION), firstName/lastName ne sont pas requis
    const extendedData = body as ExtendedUserData;
    const isInstitutionProvider = extendedData.providerInfo?.type === 'INSTITUTION';
    
    let firstName: string;
    let lastName: string;
    let name: string;

    if (isInstitutionProvider && extendedData.providerInfo?.institution?.legalName) {
      // Pour les entreprises, utiliser le nom de l'entreprise
      name = extendedData.providerInfo.institution.legalName.trim();
      firstName = name; // Utiliser le nom de l'entreprise comme firstName
      lastName = ''; // Vide pour les entreprises
    } else if (data.firstName && data.lastName) {
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

    // Validation finale - ne pas exiger firstName/lastName pour les entreprises
    if (!isInstitutionProvider && (!firstName || !lastName)) {
      throw new Error('Le prénom et le nom sont obligatoires');
    }
    
    if (!name) {
      throw new Error('Le nom est obligatoire');
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
      providerInfo?: {
        type: 'INDIVIDUAL' | 'INSTITUTION';
        category: 'HEALTH' | 'BTP' | 'EDUCATION';
        specialties?: string[];
        recommended?: boolean;
        individual?: {
          firstName: string;
          lastName: string;
          rcs?: string;
          tva?: string;
          siret?: string;
          siren?: string;
        };
        institution?: {
          legalName: string;
          registrationNumber?: string;
          taxId?: string;
          rcs?: string;
          siret?: string;
          siren?: string;
        };
        professionalAddress: {
          street: string;
          city: string;
          country: string;
          postalCode: string;
        };
      };
    };

    // Utiliser UserFacade pour créer l'utilisateur (Facade Pattern)
    // Le statut doit être PENDING pour activation via email
    const facadeData = {
      email: data.email.toLowerCase(),
      name: name,
      firstName: firstName,
      lastName: lastName,
      ...(data.phone?.trim() && { phone: data.phone.trim() }),
      roles: data.roles || [ROLES.CUSTOMER],
      status: extendedData.status || USER_STATUSES.PENDING, // Toujours PENDING pour activation via email
      ...(extendedData.kycData && { kycData: extendedData.kycData }),
      sendWelcomeNotification: false, // On enverra un email d'activation personnalisé
      metadata: {
        ...(extendedData.company?.trim() && { company: extendedData.company.trim() }),
        ...(extendedData.address?.trim() && { address: extendedData.address.trim() }),
        ...(extendedData.specialty?.trim() && { specialty: extendedData.specialty.trim() }),
        ...(extendedData.clientNotes && { clientNotes: extendedData.clientNotes }),
        ...(extendedData.preferences && { preferences: extendedData.preferences }),
        ...(extendedData.recommended !== undefined && { recommended: extendedData.recommended }),
      },
    };

    const result = await userFacade.execute(facadeData);

    if (!result.success || !result.user) {
      const errorMessage = result.error || 'Erreur lors de la création de l\'utilisateur';
      
      // Détecter les erreurs de duplication et retourner un statut 409 (Conflict)
      if (errorMessage.includes('existe déjà') || errorMessage.includes('duplicate')) {
        throw new ApiError(409, errorMessage, 'DUPLICATE_EMAIL');
      }
      
      throw new Error(errorMessage);
    }

    // Créer le providerInfo si fourni
    const createdUser = result.user;
    if (extendedData.providerInfo && createdUser) {
      try {
        const { getUserRepository } = await import('@/repositories');
        const userRepository = getUserRepository();
        const userId = createdUser.id || createdUser._id || '';
        
        // Construire le providerInfo selon le modèle
        const providerInfoData: any = {
          type: extendedData.providerInfo.type,
          category: extendedData.providerInfo.category,
          specialties: extendedData.providerInfo.specialties || [],
          recommended: extendedData.providerInfo.recommended || false,
          professionalAddress: extendedData.providerInfo.professionalAddress,
        };

        if (extendedData.providerInfo.type === 'INDIVIDUAL' && extendedData.providerInfo.individual) {
          providerInfoData.individual = {
            firstName: extendedData.providerInfo.individual.firstName,
            lastName: extendedData.providerInfo.individual.lastName,
            // Stocker les numéros dans qualifications (champ existant dans le modèle) ou dans un objet personnalisé
            qualifications: [
              ...(extendedData.providerInfo.individual.rcs ? [`RCS: ${extendedData.providerInfo.individual.rcs}`] : []),
              ...(extendedData.providerInfo.individual.tva ? [`TVA: ${extendedData.providerInfo.individual.tva}`] : []),
              ...(extendedData.providerInfo.individual.siret ? [`SIRET: ${extendedData.providerInfo.individual.siret}`] : []),
              ...(extendedData.providerInfo.individual.siren ? [`SIREN: ${extendedData.providerInfo.individual.siren}`] : []),
            ],
            // Stocker aussi dans un objet personnalisé pour faciliter l'accès
            registrationNumbers: {
              rcs: extendedData.providerInfo.individual.rcs,
              tva: extendedData.providerInfo.individual.tva,
              siret: extendedData.providerInfo.individual.siret,
              siren: extendedData.providerInfo.individual.siren,
            },
          };
        } else if (extendedData.providerInfo.type === 'INSTITUTION' && extendedData.providerInfo.institution) {
          providerInfoData.institution = {
            legalName: extendedData.providerInfo.institution.legalName,
            registrationNumber: extendedData.providerInfo.institution.registrationNumber || extendedData.providerInfo.institution.rcs || extendedData.providerInfo.institution.siret || extendedData.providerInfo.institution.siren || '',
            taxId: extendedData.providerInfo.institution.taxId || '',
            // Stocker les numéros supplémentaires dans certifications (champ existant)
            certifications: [
              ...(extendedData.providerInfo.institution.rcs ? [`RCS: ${extendedData.providerInfo.institution.rcs}`] : []),
              ...(extendedData.providerInfo.institution.siret ? [`SIRET: ${extendedData.providerInfo.institution.siret}`] : []),
              ...(extendedData.providerInfo.institution.siren ? [`SIREN: ${extendedData.providerInfo.institution.siren}`] : []),
            ],
            // Stocker aussi dans un objet personnalisé pour faciliter l'accès
            registrationNumbers: {
              rcs: extendedData.providerInfo.institution.rcs,
              siret: extendedData.providerInfo.institution.siret,
              siren: extendedData.providerInfo.institution.siren,
            },
          };
        }

        // Mettre à jour l'utilisateur avec le providerInfo
        await userRepository.update(userId, {
          providerInfo: providerInfoData,
          recommended: extendedData.providerInfo.recommended || false,
          specialties: extendedData.providerInfo.specialties || [],
        } as any);
      } catch (providerError) {
        const { logger } = await import('@/lib/logger');
        logger.warn(
          { error: providerError, userId: createdUser.id || createdUser._id },
          'Failed to create providerInfo, but user was created',
        );
      }
    }

    // Générer un token d'activation et envoyer un email
    const { getUserRepository } = await import('@/repositories');
    const userRepository = getUserRepository();
    const fullUser = await userRepository.findById(createdUser.id || createdUser._id || '');
    
    // Générer un token d'activation (valide 7 jours)
    if (fullUser) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        
        // Générer un token d'activation (pour définir le mot de passe et activer le compte)
        const activationToken = jwt.sign(
          {
            userId: createdUser.id || createdUser._id,
            type: 'account_activation',
          },
          process.env['JWT_SECRET']!,
          { expiresIn: '7d' },
        );

        // Construire l'URL d'activation
        const baseUrl = getPublicBaseUrl(request);
        const activationUrl = `${baseUrl}/activate-account?token=${activationToken}`;

        // Envoyer l'email d'activation avec le lien
        // Utiliser sendAccountActivationEmail pour les comptes créés par un admin
        const { sendAccountActivationEmail } = await import('@/lib/email/resend');
        const userName = createdUser.name || `${createdUser.firstName || ''} ${createdUser.lastName || ''}`.trim();
        await sendAccountActivationEmail(
          createdUser.email,
          userName,
          activationUrl, // URL d'activation
        );
      } catch (emailError) {
        // Logger l'erreur mais ne pas faire échouer la création de l'utilisateur
        const { logger } = await import('@/lib/logger');
        logger.warn(
          { error: emailError, userId: createdUser.id || createdUser._id, email: createdUser.email },
          'Failed to send activation email, but user was created',
        );
      }
    }

    // Mapper vers le format attendu par le frontend
    const userToMap = result.user;
    const userRecord = userToMap as Record<string, unknown>;
    
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

    // Convertir les dates en string de manière sécurisée
    const createdAt = userToMap.createdAt 
      ? (userToMap.createdAt instanceof Date ? userToMap.createdAt.toISOString() : String(userToMap.createdAt))
      : new Date().toISOString();
    
    const updatedAt = userToMap.updatedAt 
      ? (userToMap.updatedAt instanceof Date ? userToMap.updatedAt.toISOString() : String(userToMap.updatedAt))
      : new Date().toISOString();

    // Créer l'objet utilisateur mappé de manière sécurisée
    const mappedUser: UserResponse = {
      id: String(userToMap.id || userToMap._id || ''),
      _id: String(userToMap.id || userToMap._id || ''),
      email: String(userToMap.email || ''),
      name: String(userToMap.name || `${userToMap.firstName || ''} ${userToMap.lastName || ''}`.trim() || ''),
      firstName: String(userToMap.firstName || ''),
      lastName: String(userToMap.lastName || ''),
      phone: String(userToMap.phone || ''),
      company: userRecord['company'] ? String(userRecord['company']) : undefined,
      address: userRecord['address'] ? String(userRecord['address']) : undefined,
      roles: Array.isArray(userToMap.roles) ? userToMap.roles.map(String) : [],
      status: String(userToMap.status || USER_STATUSES.PENDING),
      specialty: userRecord['specialty'] ? String(userRecord['specialty']) : undefined,
      preferences: (userRecord['preferences'] as UserResponse['preferences']) || {
        language: LANGUAGES.FR.code,
        timezone: TIMEZONES.PARIS,
        notifications: true,
      },
      createdAt,
      updatedAt,
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
