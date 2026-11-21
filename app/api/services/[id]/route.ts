/**
 * API Route pour la gestion d'un service spécifique
 * GET /api/services/[id] - Récupère un service
 * PUT /api/services/[id] - Met à jour un service
 * DELETE /api/services/[id] - Supprime un service
 */

import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { createResourceResponse } from '@/lib/api/response';
import { ROLES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { UpdateServiceSchema } from '@/lib/validations/service.schema';
import { serviceService } from '@/services/service/service.service';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';
/**
 * GET /api/services/[id] - Récupère un service
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  return handleApiRoute(request, async () => {
    const resolvedParams = await Promise.resolve(params);
    const serviceId = resolvedParams.id;

    const service = await serviceService.getService(serviceId);
    
    if (!service) {
      throw ApiErrors.NOT_FOUND;
    }

    logger.info({ serviceId }, 'Service retrieved');

    return createResourceResponse(service);
  }, 'api/services/[id]');
}

/**
 * PUT /api/services/[id] - Met à jour un service
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    // Seuls les admins peuvent modifier des services
    if (!session.user.roles?.includes(ROLES.ADMIN)) {
      throw ApiErrors.FORBIDDEN;
    }

    const resolvedParams = await Promise.resolve(params);
    const serviceId = resolvedParams.id;

    const body = await request.json();
    const data = validateBody(body, UpdateServiceSchema);

    const service = await serviceService.updateService(serviceId, data);
    
    logger.info({ serviceId, userId: session.user.id }, 'Service updated');

    return createResourceResponse(
      service,
      {
        message: 'Service mis à jour avec succès',
      },
    );
  }, 'api/services/[id]');
}

/**
 * DELETE /api/services/[id] - Supprime un service
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    // Seuls les admins peuvent supprimer des services
    if (!session.user.roles?.includes(ROLES.ADMIN)) {
      throw ApiErrors.FORBIDDEN;
    }

    const resolvedParams = await Promise.resolve(params);
    const serviceId = resolvedParams.id;

    const deleted = await serviceService.deleteService(serviceId);
    
    if (!deleted) {
      throw ApiErrors.NOT_FOUND;
    }

    logger.info({ serviceId, userId: session.user.id }, 'Service deleted');

    return createResourceResponse(
      null,
      {
        message: 'Service supprimé avec succès',
      },
    );
  }, 'api/services/[id]');
}
