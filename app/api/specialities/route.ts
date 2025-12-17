/**
 * API Route pour la gestion des spécialités
 * GET /api/specialities - Liste toutes les spécialités
 * POST /api/specialities - Crée une nouvelle spécialité
 */

import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { createListResponse, createResourceResponse } from '@/lib/api/response';
import { ROLES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { CreateSpecialitySchema } from '@/lib/validations/speciality.schema';
import { specialityService } from '@/services/speciality/speciality.service';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';
/**
 * GET /api/specialities - Liste toutes les spécialités
 */
export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    
    // Les spécialités sont accessibles à tous, mais seuls les admins voient les inactives
    const isAdmin = session?.user?.roles?.includes(ROLES.ADMIN);
    const searchParams = request.nextUrl.searchParams;
    const group = searchParams.get('group');
    const isActive = searchParams.get('isActive');
    
    const filters: { group?: string; isActive?: boolean } = {};
    if (group) {
      filters.group = group;
    }
    if (isActive !== null && isAdmin) {
      filters.isActive = isActive === 'true';
    } else if (!isAdmin) {
      // Les non-admins ne voient que les spécialités actives
      filters.isActive = true;
    }

    const specialities = await specialityService.getAllSpecialities(filters);
    
    logger.info({ count: specialities.length, filters }, 'Specialities retrieved');

    return createListResponse(
      specialities,
      {
        metadata: {
          count: specialities.length,
        },
      },
    );
  }, 'api/specialities');
}

/**
 * POST /api/specialities - Crée une nouvelle spécialité
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    // Seuls les admins peuvent créer des spécialités
    if (!session.user.roles?.includes(ROLES.ADMIN)) {
      throw ApiErrors.FORBIDDEN;
    }

    const body = await request.json();
    const data = validateBody(body, CreateSpecialitySchema);

    // Mapper le type du schéma vers le group attendu par le service
    // Le schéma utilise 'type' mais l'interface ISpeciality utilise 'group'
    const group = data.category || data.type || 'sante';

    const speciality = await specialityService.createSpeciality({
      name: data.name,
      description: data.description || '',
      group: group,
      isActive: data.isActive,
    });
    
    logger.info({ specialityId: speciality._id, userId: session.user.id }, 'Speciality created');

    return createResourceResponse(
      speciality,
      {
        message: 'Spécialité créée avec succès',
      },
    );
  }, 'api/specialities');
}

