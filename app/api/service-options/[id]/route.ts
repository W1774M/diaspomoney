/**
 * API Route pour la gestion d'une option de service spécifique
 * GET /api/service-options/[id] - Récupère une option
 * PUT /api/service-options/[id] - Met à jour une option
 * DELETE /api/service-options/[id] - Supprime une option
 */

import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api';
import { ROLES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { UpdateServiceOptionSchema } from '@/lib/validations/service-options.schema';
import { serviceService } from '@/services/service/service.service';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

/**
 * GET /api/service-options/[id] - Récupère une option
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  return handleApiRoute(request, async () => {
    const resolvedParams = await Promise.resolve(params);
    const optionId = resolvedParams.id;

    const options = await serviceService.getAllOptions();
    const option = options.find(o => o.id === optionId || o._id === optionId);
    
    if (!option) {
      throw ApiErrors.NOT_FOUND;
    }

    logger.info({ optionId }, 'Service option retrieved');

    return {
      success: true,
      data: option,
    };
  }, 'api/service-options/[id]');
}

/**
 * PUT /api/service-options/[id] - Met à jour une option
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

    if (!session.user.roles?.includes(ROLES.ADMIN)) {
      throw ApiErrors.FORBIDDEN;
    }

    const resolvedParams = await Promise.resolve(params);
    const optionId = resolvedParams.id;

    const body = await request.json();
    const data = validateBody(body, UpdateServiceOptionSchema);

    const option = await serviceService.updateServiceOption(optionId, data);
    
    logger.info({ optionId, userId: session.user.id }, 'Service option updated');

    return {
      success: true,
      data: option,
      message: 'Option mise à jour avec succès',
    };
  }, 'api/service-options/[id]');
}

/**
 * DELETE /api/service-options/[id] - Supprime une option
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

    if (!session.user.roles?.includes(ROLES.ADMIN)) {
      throw ApiErrors.FORBIDDEN;
    }

    const resolvedParams = await Promise.resolve(params);
    const optionId = resolvedParams.id;

    const deleted = await serviceService.deleteServiceOption(optionId);
    
    if (!deleted) {
      throw ApiErrors.NOT_FOUND;
    }

    logger.info({ optionId, userId: session.user.id }, 'Service option deleted');

    return {
      success: true,
      message: 'Option supprimée avec succès',
    };
  }, 'api/service-options/[id]');
}

