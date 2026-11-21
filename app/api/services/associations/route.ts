/**
 * API Route pour la gestion des associations service-option
 * POST /api/services/associations - Associe une option à un service
 * DELETE /api/services/associations - Dissocie une option d'un service
 */

import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api';
import { ROLES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { AssociateServiceOptionSchema, DissociateServiceOptionSchema } from '@/lib/validations/service-options.schema';
import { serviceService } from '@/services/service/service.service';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

/**
 * POST /api/services/associations - Associe une option à un service
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
    const data = validateBody(body, AssociateServiceOptionSchema);

    await serviceService.associateOptionToService(data.serviceId, data.optionId);
    
    logger.info({ serviceId: data.serviceId, optionId: data.optionId, userId: session.user.id }, 'Option associated to service');

    return {
      success: true,
      message: 'Option associée au service avec succès',
    };
  }, 'api/services/associations');
}

/**
 * DELETE /api/services/associations - Dissocie une option d'un service
 */
export async function DELETE(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    if (!session.user.roles?.includes(ROLES.ADMIN)) {
      throw ApiErrors.FORBIDDEN;
    }

    const body = await request.json();
    const data = validateBody(body, DissociateServiceOptionSchema);

    await serviceService.dissociateOptionFromService(data.serviceId, data.optionId);
    
    logger.info({ serviceId: data.serviceId, optionId: data.optionId, userId: session.user.id }, 'Option dissociated from service');

    return {
      success: true,
      message: 'Option dissociée du service avec succès',
    };
  }, 'api/services/associations');
}

