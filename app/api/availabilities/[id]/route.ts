/**
 * API Route - Availability Rule by ID
 * Endpoints pour gérer une règle de disponibilité spécifique
 * Utilise AvailabilityRuleRepository (Repository Pattern) et handleApiRoute (Error Handling Pattern)
 */

import { auth } from '@/auth';
import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { logger } from '@/lib/logger';
import type { AvailabilityRule } from '@/lib/types';
import { getAvailabilityRuleRepository, getUserRepository } from '@/repositories';
import { UpdateAvailabilityRuleSchema } from '@/lib/validations/availability.schema';
import { NextRequest } from 'next/server';

/**
 * GET /api/availabilities/[id] - Récupérer une règle de disponibilité par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return handleApiRoute(
    request,
    async () => {
      const session = await auth();
      const userEmail = session?.user?.email;

      if (!userEmail) {
        throw ApiErrors.UNAUTHORIZED;
      }

      // Utiliser UserRepository (Repository Pattern)
      const userRepository = getUserRepository();
      const user = await userRepository.findByEmail(userEmail);

      if (!user) {
        throw ApiErrors.NOT_FOUND;
      }

      const userId = user.id || (user as any)._id?.toString() || '';

      // Utiliser AvailabilityRuleRepository (Repository Pattern)
      const availabilityRuleRepository = getAvailabilityRuleRepository();
      const rule = await availabilityRuleRepository.findById(params.id);

      if (!rule) {
        throw ApiErrors.NOT_FOUND;
      }

      // Vérifier que la règle appartient à l'utilisateur
      if (rule.userId !== userId) {
        throw ApiErrors.FORBIDDEN;
      }

      logger.info({ userId, ruleId: params.id }, 'Availability rule retrieved');

      return {
        success: true,
        data: rule,
      };
    },
    'api/availabilities/[id]',
  );
}

/**
 * PUT /api/availabilities/[id] - Mettre à jour une règle de disponibilité
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return handleApiRoute(
    request,
    async () => {
      const session = await auth();
      const userEmail = session?.user?.email;

      if (!userEmail) {
        throw ApiErrors.UNAUTHORIZED;
      }

      // Utiliser UserRepository (Repository Pattern)
      const userRepository = getUserRepository();
      const user = await userRepository.findByEmail(userEmail);

      if (!user) {
        throw ApiErrors.NOT_FOUND;
      }

      const userId = user.id || (user as any)._id?.toString() || '';

      // Validation avec Zod
      const body = await request.json();
      const validatedData = validateBody(body, UpdateAvailabilityRuleSchema);

      // Utiliser AvailabilityRuleRepository (Repository Pattern)
      const availabilityRuleRepository = getAvailabilityRuleRepository();
      const existingRule = await availabilityRuleRepository.findById(params.id);

      if (!existingRule) {
        throw ApiErrors.NOT_FOUND;
      }

      // Vérifier que la règle appartient à l'utilisateur
      if (existingRule.userId !== userId) {
        throw ApiErrors.FORBIDDEN;
      }

      // Créer un objet partiel en filtrant les propriétés undefined pour exactOptionalPropertyTypes
      const data: Partial<AvailabilityRule> = {};
      if (validatedData.name !== undefined) data.name = validatedData.name;
      if (validatedData.type !== undefined) data.type = validatedData.type;
      if (validatedData.isActive !== undefined) data.isActive = validatedData.isActive;
      if (validatedData.startDate !== undefined) data.startDate = validatedData.startDate;
      if (validatedData.endDate !== undefined) data.endDate = validatedData.endDate;
      if (validatedData.timeSlots !== undefined) data.timeSlots = validatedData.timeSlots;
      if (validatedData.timezone !== undefined) data.timezone = validatedData.timezone;

      const updatedRule = await availabilityRuleRepository.update(params.id, data);

      if (!updatedRule) {
        throw ApiErrors.NOT_FOUND;
      }

      logger.info(
        { userId, ruleId: params.id, name: updatedRule.name },
        'Availability rule updated',
      );

      return {
        success: true,
        data: updatedRule,
        message: 'Règle de disponibilité mise à jour avec succès',
      };
    },
    'api/availabilities/[id]',
  );
}

/**
 * DELETE /api/availabilities/[id] - Supprimer une règle de disponibilité
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return handleApiRoute(
    request,
    async () => {
      const session = await auth();
      const userEmail = session?.user?.email;

      if (!userEmail) {
        throw ApiErrors.UNAUTHORIZED;
      }

      // Utiliser UserRepository (Repository Pattern)
      const userRepository = getUserRepository();
      const user = await userRepository.findByEmail(userEmail);

      if (!user) {
        throw ApiErrors.NOT_FOUND;
      }

      const userId = user.id || (user as any)._id?.toString() || '';

      // Utiliser AvailabilityRuleRepository (Repository Pattern)
      const availabilityRuleRepository = getAvailabilityRuleRepository();
      const existingRule = await availabilityRuleRepository.findById(params.id);

      if (!existingRule) {
        throw ApiErrors.NOT_FOUND;
      }

      // Vérifier que la règle appartient à l'utilisateur
      if (existingRule.userId !== userId) {
        throw ApiErrors.FORBIDDEN;
      }

      const deleted = await availabilityRuleRepository.delete(params.id);

      if (!deleted) {
        throw ApiErrors.NOT_FOUND;
      }

      logger.info({ userId, ruleId: params.id }, 'Availability rule deleted');

      return {
        success: true,
        message: 'Règle de disponibilité supprimée avec succès',
      };
    },
    'api/availabilities/[id]',
  );
}

