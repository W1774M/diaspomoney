/**
 * API Route pour la gestion des services
 * GET /api/services - Liste tous les services
 * POST /api/services - Crée un nouveau service
 */

import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { createListResponse, createResourceResponse } from '@/lib/api/response';
import { ROLES, SPECIALITY_TYPES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { CreateServiceSchema } from '@/lib/validations/service.schema';
import { serviceService } from '@/services/service/service.service';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';
/**
 * GET /api/services - Liste tous les services
 */
export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    
    // Les services sont accessibles à tous, mais seuls les admins voient les inactifs
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
      // Les non-admins ne voient que les services actifs
      filters.isActive = true;
    }

    const services = await serviceService.getAllServices(filters);
    
    logger.info({ count: services.length, filters }, 'Services retrieved');

    return createListResponse(
      services,
      {
        metadata: {
          count: services.length,
        },
      },
    );
  }, 'api/services');
}

/**
 * POST /api/services - Crée un nouveau service
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    // Seuls les admins peuvent créer des services
    if (!session.user.roles?.includes(ROLES.ADMIN)) {
      logger.warn({
        userId: session.user.id,
        userRoles: session.user.roles,
        requiredRole: ROLES.ADMIN,
      }, '[POST /api/services] Accès refusé - Rôle ADMIN requis');
      throw ApiErrors.FORBIDDEN;
    }

    const body = await request.json();
    const data = validateBody(body, CreateServiceSchema);

    const service = await serviceService.createService(data);
    
    logger.info({ serviceId: service.id, userId: session.user.id }, 'Service created');

    return createResourceResponse(
      service,
      {
        message: 'Service créé avec succès',
      },
    );
  }, 'api/services');
}

