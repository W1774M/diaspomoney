import { auth } from '@/auth';
import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { logger } from '@/lib/logger';
import { CompleteProfileSchema, type CompleteProfileInput } from '@/lib/validations/auth.schema';
import { getUserRepository } from '@/repositories';
import { getMongoClient } from '@/lib/database/mongodb';
import { NextRequest } from 'next/server';

/**
 * POST /api/auth/complete-profile - Compléter le profil utilisateur
 * 
 * Implémente les design patterns :
 * - Service Layer Pattern (via userRepository)
 * - Repository Pattern (via getUserRepository)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via CompleteProfileSchema)
 * - Middleware Pattern (authentification)
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user?.email || !session.user.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    // Validation avec Zod
    const body = await request.json();
    const data: CompleteProfileInput = validateBody(body, CompleteProfileSchema);
    
    const {
      phone,
      countryOfResidence,
      targetCountry,
      targetCity,
      monthlyBudget,
    } = data;

    const userId = session.user.id;
    const email = session.user.email.toLowerCase();

    logger.info({
      userId,
      email,
      phone,
      countryOfResidence,
      targetCountry,
      targetCity,
      monthlyBudget,
    }, 'Completing user profile');

    // Utiliser MongoDB directement pour la mise à jour (comme dans /api/users/me)
    const client = await getMongoClient();
    const db = client.db();
    const users = db.collection('users');

    // Construire l'objet de mise à jour
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Mettre à jour les champs fournis
    if (phone !== undefined && phone) {
      updateData['phone'] = phone.trim();
    }
    if (countryOfResidence !== undefined && countryOfResidence) {
      updateData['countryOfResidence'] = countryOfResidence.trim();
    }
    if (targetCountry !== undefined && targetCountry) {
      updateData['targetCountry'] = targetCountry.trim();
    }
    if (targetCity !== undefined && targetCity) {
      updateData['targetCity'] = targetCity.trim();
    }
    if (monthlyBudget !== undefined && monthlyBudget) {
      // Convertir le budget en nombre si c'est une plage (ex: "500-1000" -> 750)
      // Sinon, stocker la chaîne telle quelle
      updateData['monthlyBudget'] = monthlyBudget.trim();
    }

    // Mettre à jour l'utilisateur dans la base de données
    const result = await users.updateOne(
      { email },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      logger.error({ email }, 'User not found for profile completion');
      throw ApiErrors.NOT_FOUND;
    }

    // Récupérer l'utilisateur mis à jour pour vérification
    const userRepository = getUserRepository();
    const updatedUser = await userRepository.findByEmail(email);

    if (!updatedUser) {
      logger.error({ email }, 'User not found after profile completion');
      throw ApiErrors.NOT_FOUND;
    }

    logger.info({
      userId,
      email,
      phone: updatedUser['phone'],
      countryOfResidence: updatedUser['countryOfResidence'],
      targetCountry: updatedUser['targetCountry'],
      targetCity: updatedUser['targetCity'],
      monthlyBudget: updatedUser['monthlyBudget'],
    }, 'Profile completed successfully');

    return {
      success: true,
      message: 'Profil complété avec succès',
      user: {
        id: updatedUser._id?.toString() || updatedUser['id'],
        email: updatedUser.email,
        phone: updatedUser['phone'],
        countryOfResidence: updatedUser['countryOfResidence'],
        targetCountry: updatedUser['targetCountry'],
        targetCity: updatedUser['targetCity'],
        monthlyBudget: updatedUser['monthlyBudget'],
      },
    };
  }, 'api/auth/complete-profile');
}
