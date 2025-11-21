import { auth } from '@/auth';
import { validateBody } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { UpdateSpecialitySchema, type UpdateSpecialityInput } from '@/lib/validations/speciality.schema';
import { specialityService } from '@/services/speciality/speciality.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour gérer une spécialité par ID
 * Implémente les design patterns :
 * - Service Layer Pattern (via specialityService)
 * - Dependency Injection (via specialityService singleton)
 * - Logger Pattern (structured logging avec childLogger + @Log decorator dans le service)
 * - Middleware Pattern (authentification)
 * - Decorator Pattern (@Log, @Cacheable, @Validate, @InvalidateCache dans specialityService)
 * - Singleton Pattern (specialityService)
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const reqId = _request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/specialities/[id]',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      log.warn({ msg: 'Missing speciality ID' });
      return NextResponse.json(
        { error: 'ID de spécialité requis' },
        { status: 400 },
      );
    }

    log.debug({ specialityId: id }, 'Fetching speciality');

    // Utiliser le service avec décorateurs (@Log, @Cacheable, @Validate)
    const speciality = await specialityService.getSpecialityById(id);

    if (!speciality) {
      log.warn({ specialityId: id }, 'Speciality not found');
      return NextResponse.json(
        { error: 'Spécialité non trouvée' },
        { status: 404 },
      );
    }

    log.info({ specialityId: id }, 'Speciality fetched successfully');

    return NextResponse.json({
      success: true,
      speciality,
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error fetching speciality' },
      'Error fetching speciality',
    );
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la spécialité' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/specialities/[id]',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier les permissions (seuls les admins peuvent modifier)
    const userRoles = session.user.roles || [];
    if (!userRoles.includes('ADMIN') && !userRoles.includes('SUPERADMIN')) {
      log.warn(
        { userId: session.user.id, roles: userRoles },
        'Insufficient permissions',
      );
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 },
      );
    }

    const { id } = params;
    if (!id) {
      log.warn({ msg: 'Missing speciality ID' });
      return NextResponse.json(
        { error: 'ID de spécialité requis' },
        { status: 400 },
      );
    }

    const body = await request.json();
    
    // Validation avec Zod
    const data: UpdateSpecialityInput = validateBody(body, UpdateSpecialitySchema);

    log.debug(
      { specialityId: id, hasName: !!data.name, hasDescription: !!data.description },
      'Updating speciality',
    );

    // Utiliser le service avec décorateurs (@Log, @Validate, @InvalidateCache)
    // Mapper les champs du schéma vers l'interface du service
    const updateData: {
      name?: string;
      description?: string;
      group?: string;
      isActive?: boolean;
    } = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.group = data.category; // Le service utilise 'group' mais le schéma utilise 'category'
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    
    const speciality = await specialityService.updateSpeciality(id, updateData);

    log.info({ specialityId: id }, 'Speciality updated successfully');

    return NextResponse.json({
      success: true,
      speciality,
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error updating speciality' },
      'Error updating speciality',
    );

    // Gérer les erreurs spécifiques
    if (error instanceof Error) {
      if (error.message.includes('non trouvée')) {
        return NextResponse.json(
          { error: 'Spécialité non trouvée' },
          { status: 404 },
        );
      }
      if (error.message.includes('existe déjà')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la spécialité' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const reqId = _request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/specialities/[id]',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier les permissions (seuls les admins peuvent supprimer)
    const userRoles = session.user.roles || [];
    if (!userRoles.includes('ADMIN') && !userRoles.includes('SUPERADMIN')) {
      log.warn(
        { userId: session.user.id, roles: userRoles },
        'Insufficient permissions',
      );
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 },
      );
    }

    const { id } = params;
    if (!id) {
      log.warn({ msg: 'Missing speciality ID' });
      return NextResponse.json(
        { error: 'ID de spécialité requis' },
        { status: 400 },
      );
    }

    log.debug({ specialityId: id }, 'Deleting speciality');

    // Utiliser le service avec décorateurs (@Log, @Validate, @InvalidateCache)
    await specialityService.deleteSpeciality(id);

    log.info({ specialityId: id }, 'Speciality deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Spécialité supprimée avec succès',
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error deleting speciality' },
      'Error deleting speciality',
    );

    // Gérer les erreurs spécifiques
    if (error instanceof Error && error.message.includes('non trouvée')) {
      return NextResponse.json(
        { error: 'Spécialité non trouvée' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la spécialité' },
      { status: 500 },
    );
  }
}
