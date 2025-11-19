import { auth } from '@/auth';
import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { mapUserToResponse } from '@/lib/mappers/user.mapper';
import { UpdateUserSchema } from '@/lib/validations/user.schema';
import { UserDocument } from '@/lib/types/user-document.types';
import { getUserRepository } from '@/repositories';
import { getMongoClient } from '@/lib/database/mongodb';
import { NextRequest } from 'next/server';

/**
 * GET /api/users/me - Récupérer le profil de l'utilisateur authentifié
 *
 * Implémente les design patterns :
 * - Service Layer Pattern (via userRepository)
 * - Repository Pattern (via getUserRepository)
 * - Error Handling Pattern (via handleApiRoute)
 * - Mapper Pattern (via mapUserToResponse)
 */
export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    // Récupérer l'utilisateur authentifié via NextAuth
    const session = await auth();
    if (!session?.user?.email) {
      throw ApiErrors.UNAUTHORIZED;
    }

    // Utiliser UserRepository (Repository Pattern)
    const userRepository = getUserRepository();
    const userDoc = await userRepository.findByEmail(session.user.email);

    if (!userDoc) {
      throw ApiErrors.NOT_FOUND;
    }

    // Mapper le document utilisateur vers la réponse API (Mapper Pattern)
    const userResponse = mapUserToResponse(userDoc as UserDocument);

    return {
      user: userResponse,
    };
  }, 'api/users/me');
}

/**
 * PUT /api/users/me - Mettre à jour le profil utilisateur
 *
 * Implémente les design patterns :
 * - Service Layer Pattern (via userRepository)
 * - Repository Pattern (via getUserRepository)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via CreateUserSchema)
 * - Mapper Pattern (via mapUserToResponse)
 */
export async function PUT(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.email) {
      throw ApiErrors.UNAUTHORIZED;
    }

    // Validation avec Zod
    const body = await request.json();
    const userData = validateBody(body, UpdateUserSchema);

    const client = await getMongoClient();
    const db = client.db();
    const users = db.collection('users');

    const email = session.user.email.toLowerCase();

    // Construire l'objet de mise à jour avec types stricts
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Mettre à jour les champs fournis
    if (userData.name !== undefined) updateData['name'] = userData.name?.trim() || null;
    if (userData.firstName !== undefined) updateData['firstName'] = userData.firstName?.trim() || null;
    if (userData.lastName !== undefined) updateData['lastName'] = userData.lastName?.trim() || null;
    if (userData.phone !== undefined) updateData['phone'] = userData.phone?.trim() || null;
    if (userData.company !== undefined) updateData['company'] = userData.company?.trim() || null;
    if (userData.address !== undefined) updateData['address'] = userData.address?.trim() || null;
    if (userData.dateOfBirth !== undefined) {
      updateData['dateOfBirth'] = userData.dateOfBirth ? new Date(userData.dateOfBirth) : null;
    }
    if (userData.countryOfResidence !== undefined) {
      updateData['countryOfResidence'] = userData.countryOfResidence?.trim() || null;
    }
    if (userData.targetCountry !== undefined) {
      updateData['targetCountry'] = userData.targetCountry?.trim() || null;
    }
    if (userData.targetCity !== undefined) {
      updateData['targetCity'] = userData.targetCity?.trim() || null;
    }
    if (userData.monthlyBudget !== undefined) {
      updateData['monthlyBudget'] = userData.monthlyBudget?.trim() || null;
    }
    if (userData.marketingConsent !== undefined) {
      updateData['marketingConsent'] = userData.marketingConsent === true;
    }
    if (userData.kycConsent !== undefined) {
      updateData['kycConsent'] = userData.kycConsent === true;
    }
    if (userData.specialty !== undefined) {
      updateData['specialty'] = userData.specialty?.trim() || null;
    }

    // Mettre à jour les préférences
    if (userData.preferences) {
      updateData['preferences'] = {
        language: userData.preferences.language || 'fr',
        timezone: userData.preferences.timezone || 'Europe/Paris',
        notifications: userData.preferences.notifications !== false,
      };
    }

    // Mettre à jour les informations de prestataire
    if (userData.providerInfo) {
      updateData['providerInfo'] = userData.providerInfo;
    }

    const result = await users.updateOne({ email }, { $set: updateData });

    if (result.matchedCount === 0) {
      throw ApiErrors.NOT_FOUND;
    }

    // Récupérer l'utilisateur mis à jour
    const userRepository = getUserRepository();
    const userDoc = await userRepository.findByEmail(email);
    if (!userDoc) {
      throw ApiErrors.NOT_FOUND;
    }

    const userResponse = mapUserToResponse(userDoc as UserDocument);

    return {
      success: true,
      message: 'Profil mis à jour avec succès',
      user: userResponse,
    };
  }, 'api/users/me');
}
