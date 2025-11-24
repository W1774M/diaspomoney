/**
 * API Route pour la gestion des options de service
 * GET /api/service-options - Liste toutes les options
 * POST /api/service-options - Crée une nouvelle option
 */

import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { ROLES, SPECIALITY_TYPES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { CreateServiceOptionSchema } from '@/lib/validations/service-options.schema';
import { serviceService } from '@/services/service/service.service';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

/**
 * GET /api/service-options - Liste toutes les options
 */
export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    const isAdmin = session?.user?.roles?.includes(ROLES.ADMIN);
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    
    const filters: { category?: typeof SPECIALITY_TYPES[keyof typeof SPECIALITY_TYPES]; isActive?: boolean } = {};
    if (category && (category === SPECIALITY_TYPES.HEALTH || category === SPECIALITY_TYPES.EDUCATION || category === SPECIALITY_TYPES.BTP)) {
      filters.category = category;
    }
    if (isActive !== null && isAdmin) {
      filters.isActive = isActive === 'true';
    } else if (!isAdmin) {
      filters.isActive = true;
    }

    const options = await serviceService.getAllOptions(filters);
    
    logger.info({ count: options.length, filters }, 'Service options retrieved');

    return {
      success: true,
      data: options,
      count: options.length,
    };
  }, 'api/service-options');
}

/**
 * POST /api/service-options - Crée une nouvelle option
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    if (!session.user.roles?.includes(ROLES.ADMIN)) {
      throw ApiErrors.FORBIDDEN;
    }

    const body = await request.json();
    const data = validateBody(body, CreateServiceOptionSchema);

    const option = await serviceService.createServiceOption(data);
    
    logger.info({ optionId: option.id, userId: session.user.id }, 'Service option created');

    return {
      success: true,
      data: option,
      message: 'Option créée avec succès',
    };
  }, 'api/service-options');
}

