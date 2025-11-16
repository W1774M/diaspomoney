/**
 * API Route pour récupérer et mettre à jour un utilisateur par ID
 * Implémente les design patterns :
 * - Service Layer Pattern (via userService)
 * - Repository Pattern (via userService qui utilise les repositories)
 * - Dependency Injection (via userService singleton)
 * - Logger Pattern (structured logging avec childLogger + @Log decorator dans le service)
 * - Middleware Pattern (authentification)
 * - Decorator Pattern (@Log, @Cacheable dans userService)
 * - Singleton Pattern (userService)
 */

import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { userService } from '@/services/user/user.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/users/[id] - Récupérer un utilisateur par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/users/[id]',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = params.id;
    log.debug({ userId }, 'Fetching user');

    // Utiliser le service avec décorateurs (@Log, @Cacheable)
    const user = await userService.getUserProfile(userId);

    log.info({ userId, email: user.email }, 'User fetched successfully');

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
      },
    });
  } catch (error: any) {
    log.error(
      { error, userId: params.id, msg: 'Error fetching user' },
      'Error fetching user'
    );

    if (error.message === 'Utilisateur non trouvé') {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'utilisateur" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id] - Mettre à jour un utilisateur
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/users/[id]',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier les permissions (seuls ADMIN et SUPERADMIN peuvent modifier d'autres utilisateurs)
    const currentUserId = session.user.id;
    const targetUserId = params.id;

    if (currentUserId !== targetUserId) {
      // Vérifier si l'utilisateur actuel est ADMIN ou SUPERADMIN
      const currentUser = await userService.getUserProfile(currentUserId);
      const isAdmin =
        currentUser.roles?.includes('ADMIN') ||
        currentUser.roles?.includes('SUPERADMIN');

      if (!isAdmin) {
        log.warn(
          { currentUserId, targetUserId, msg: 'Insufficient permissions' },
          'User attempted to update another user without admin rights'
        );
        return NextResponse.json(
          { error: 'Permissions insuffisantes' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const userId = params.id;

    log.debug({ userId, fields: Object.keys(body) }, 'Updating user');

    // Construire les données de mise à jour
    const updateData: any = {};

    if (body.name) {
      const nameParts = body.name.split(' ');
      updateData.firstName = nameParts[0] || body.firstName;
      updateData.lastName = nameParts.slice(1).join(' ') || body.lastName;
    }
    if (body.firstName) updateData.firstName = body.firstName;
    if (body.lastName) updateData.lastName = body.lastName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.company !== undefined) updateData.company = body.company;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.roles) updateData.roles = body.roles;
    if (body.status) updateData.status = body.status;
    if (body.specialty !== undefined) updateData.specialty = body.specialty;
    if (body.recommended !== undefined)
      updateData.recommended = body.recommended;
    if (body.clientNotes !== undefined)
      updateData.clientNotes = body.clientNotes;
    if (body.preferences) updateData.preferences = body.preferences;

    // Utiliser le service avec décorateurs (@Log, @InvalidateCache)
    const updatedUser = await userService.updateUserProfile(userId, updateData);

    log.info({ userId, email: updatedUser.email }, 'User updated successfully');

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        createdAt:
          updatedUser.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt:
          updatedUser.updatedAt?.toISOString() || new Date().toISOString(),
      },
      message: 'Utilisateur mis à jour avec succès',
    });
  } catch (error: any) {
    log.error(
      { error, userId: params.id, msg: 'Error updating user' },
      'Error updating user'
    );

    if (error.message === 'Utilisateur non trouvé') {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}
