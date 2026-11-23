/**
 * API Route - Availability Rules
 * Endpoints pour gérer les règles de disponibilité
 * Utilise AvailabilityRuleRepository (Repository Pattern) et handleApiRoute (Error Handling Pattern)
 */

import { auth } from '@/auth';
import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { logger } from '@/lib/logger';
import type { PaginationOptions } from '@/lib/types';
import { getAvailabilityRuleRepository, getUserRepository } from '@/repositories';
import {
  CreateAvailabilityRuleSchema,
} from '@/lib/validations/availability.schema';
import { NextRequest } from 'next/server';

/**
 * GET /api/availabilities - Récupérer toutes les règles de disponibilité de l'utilisateur
 */
export async function GET(request: NextRequest) {
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

      // Récupérer le type depuis les query params
      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type') as 'weekly' | 'monthly' | 'custom' | null;

      // Utiliser AvailabilityRuleRepository (Repository Pattern)
      const availabilityRuleRepository = getAvailabilityRuleRepository();
      
      const filters: any = { userId };
      if (type) {
        filters.type = type;
      }

      const pagination: PaginationOptions = {
        limit: 100,
        page: 1,
        offset: 0,
      };

      const result = await availabilityRuleRepository.findRulesWithFilters(filters, pagination);

      logger.info(
        { userId, count: result.data.length, type },
        'Availability rules retrieved',
      );

      return {
        success: true,
        data: result.data,
        total: result.total,
      };
    },
    'api/availabilities',
  );
}

/**
 * POST /api/availabilities - Créer une nouvelle règle de disponibilité
 */
export async function POST(request: NextRequest) {
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
      const data = validateBody(body, CreateAvailabilityRuleSchema);

      // Utiliser AvailabilityRuleRepository (Repository Pattern)
      const availabilityRuleRepository = getAvailabilityRuleRepository();
      
      const rule = await availabilityRuleRepository.create({
        userId,
        name: data.name,
        type: data.type,
        isActive: data.isActive ?? true,
        startDate: data.startDate,
        endDate: data.endDate,
        timeSlots: data.timeSlots,
        timezone: data.timezone || 'UTC',
      });

      logger.info(
        { userId, ruleId: rule.id, name: rule.name, type: rule.type },
        'Availability rule created',
      );

      return {
        success: true,
        data: rule,
        message: 'Règle de disponibilité créée avec succès',
      };
    },
    'api/availabilities',
  );
}

