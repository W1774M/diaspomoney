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
import { validateBody } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { ROLES } from '@/lib/constants';
import { UpdateUserSchema } from '@/lib/validations/user.schema';
import { userService } from '@/services/user/user.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/users/[id] - Récupérer un utilisateur par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
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

    // Gérer params qui peut être une Promise dans Next.js 15+
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams?.id;

    // Validation de l'ID
    if (!userId || userId === 'null' || userId === 'undefined' || userId === 'undefined' || typeof userId !== 'string' || userId.trim() === '') {
      log.warn({ userId: userId || 'undefined', params: resolvedParams }, 'Invalid user ID provided');
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 },
      );
    }

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
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams?.id || 'undefined';
    log.error(
      { error, userId, msg: 'Error fetching user' },
      'Error fetching user',
    );

    if (error.message === 'Utilisateur non trouvé') {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'utilisateur" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/users/[id] - Mettre à jour un utilisateur
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
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

    // Gérer params qui peut être une Promise dans Next.js 15+
    const resolvedParams = await Promise.resolve(params);
    const targetUserId = resolvedParams?.id;

    // Validation de l'ID
    if (!targetUserId || targetUserId === 'null' || targetUserId === 'undefined' || typeof targetUserId !== 'string' || targetUserId.trim() === '') {
      log.warn({ targetUserId: targetUserId || 'undefined', params: resolvedParams }, 'Invalid user ID provided');
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 },
      );
    }

    // Décoder l'ID si nécessaire (en cas d'encodage URL)
    const decodedUserId = decodeURIComponent(targetUserId);
    log.debug({ targetUserId, decodedUserId }, 'Processing user update');

    // Vérifier les permissions (seuls ADMIN et SUPERADMIN peuvent modifier d'autres utilisateurs)
    const currentUserId = session.user.id;

    if (currentUserId !== targetUserId) {
      // Vérifier si l'utilisateur actuel est ADMIN ou SUPERADMIN
      const currentUser = await userService.getUserProfile(currentUserId);
        const isAdmin =
          currentUser.roles?.includes(ROLES.ADMIN) ||
          currentUser.roles?.includes(ROLES.SUPERADMIN);

      if (!isAdmin) {
        log.warn(
          { currentUserId, targetUserId, msg: 'Insufficient permissions' },
          'User attempted to update another user without admin rights',
        );
        return NextResponse.json(
          { error: 'Permissions insuffisantes' },
          { status: 403 },
        );
      }
    }

    const body = await request.json();
    
    // Validation avec Zod
    const data = validateBody(body, UpdateUserSchema);
    
    const userId = decodedUserId;

    log.debug({ userId, fields: Object.keys(data) }, 'Updating user');

    // Construire les données de mise à jour
    const updateData: any = {};

    if (data.name) {
      const nameParts = data.name.split(' ');
      updateData.firstName = nameParts[0] || data.firstName;
      updateData.lastName = nameParts.slice(1).join(' ') || data.lastName;
    }
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.roles) updateData.roles = data.roles;
    if (data.status) updateData.status = data.status;
    if (data.specialty !== undefined) updateData.specialty = data.specialty;
    if (data.recommended !== undefined)
      updateData.recommended = data.recommended;
    if (data.clientNotes !== undefined)
      updateData.clientNotes = data.clientNotes;
    if (data.preferences) updateData.preferences = data.preferences;
    if (data.providerInfo) updateData.providerInfo = data.providerInfo;

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
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams?.id || 'undefined';
    log.error(
      { error, userId, msg: 'Error updating user' },
      'Error updating user',
    );

    if (error.message === 'Utilisateur non trouvé') {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/users/[id] - Supprimer un utilisateur (anonymisation GDPR)
 * Implémente les design patterns :
 * - Service Layer Pattern (via userService.deleteUserAccount)
 * - Repository Pattern (via userService qui utilise les repositories)
 * - Decorator Pattern (@Log, @Audit, @Transaction dans userService)
 * - Middleware Pattern (authentification)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
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

    // Gérer params qui peut être une Promise dans Next.js 15+
    const resolvedParams = await Promise.resolve(params);
    const targetUserId = resolvedParams?.id;

    // Validation de l'ID
    if (!targetUserId || targetUserId === 'null' || targetUserId === 'undefined' || typeof targetUserId !== 'string' || targetUserId.trim() === '') {
      log.warn({ targetUserId: targetUserId || 'undefined', params: resolvedParams }, 'Invalid user ID provided');
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 },
      );
    }

    // Vérifier les permissions (seuls ADMIN et SUPERADMIN peuvent supprimer des utilisateurs)
    const currentUserId = session.user.id;
    const currentUser = await userService.getUserProfile(currentUserId);
    const isAdmin =
      currentUser.roles?.includes(ROLES.ADMIN) ||
      currentUser.roles?.includes(ROLES.SUPERADMIN);

    if (!isAdmin) {
      log.warn(
        { currentUserId, targetUserId, msg: 'Insufficient permissions' },
        'User attempted to delete another user without admin rights',
      );
      return NextResponse.json(
        { error: 'Permissions insuffisantes. Seuls les administrateurs peuvent supprimer des utilisateurs.' },
        { status: 403 },
      );
    }

    log.info({ targetUserId, deletedBy: currentUserId }, 'Deleting user account');

    // Utiliser le service avec décorateurs (@Log, @Audit, @Transaction, @InvalidateCache)
    // Le service anonymise l'utilisateur (GDPR compliance) au lieu de le supprimer complètement
    await userService.deleteUserAccount(targetUserId);

    log.info({ targetUserId, deletedBy: currentUserId }, 'User account deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès (anonymisé conformément au RGPD)',
    });
  } catch (error: any) {
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams?.id || 'undefined';
    log.error(
      { error, userId, msg: 'Error deleting user' },
      'Error deleting user',
    );

    if (error.message === 'Utilisateur non trouvé') {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 },
    );
  }
}
