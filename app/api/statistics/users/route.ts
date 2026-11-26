/**
 * API Route pour récupérer les statistiques des utilisateurs
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Repository Pattern
 * - Authorization Pattern
 * - Logger Pattern
 */

import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { ROLES } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';
import { getUserRepository } from '@/repositories';

export async function GET(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/statistics/users',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const userRoles = session.user.roles || [];
    const isAdmin = userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SUPERADMIN);

    if (!isAdmin) {
      log.warn({ userId: session.user.id, roles: userRoles }, 'Access denied: admin required');
      return NextResponse.json({ error: 'Accès refusé: Admin requis' }, { status: 403 });
    }

    const userId = session.user.id;
    log.debug({ userId }, 'Fetching user statistics');

    // Récupérer le repository
    const userRepository = getUserRepository();

    // Récupérer tous les utilisateurs
    const allUsers = await userRepository.findAll({});

    // Calculer les statistiques
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Utilisateurs créés aujourd'hui
    const usersToday = allUsers.filter((u: any) => {
      const createdAt = new Date(u.createdAt || u.createdat || Date.now());
      createdAt.setHours(0, 0, 0, 0);
      return createdAt.getTime() === today.getTime();
    }).length;

    // Utilisateurs du mois précédent
    const previousMonthUsers = allUsers.filter((u: any) => {
      const createdAt = new Date(u.createdAt || u.createdat || Date.now());
      return createdAt >= startOfPreviousMonth && createdAt < startOfMonth;
    }).length;

    // Total d'utilisateurs
    const totalUsers = allUsers.length;

    const statistics = {
      totalUsers,
      usersToday,
      previousMonthUsers,
    };

    log.info(
      {
        userId,
        totalUsers,
        usersToday,
        previousMonthUsers,
      },
      'User statistics fetched successfully',
    );

    return NextResponse.json({
      success: true,
      statistics,
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error fetching user statistics' },
      'Error fetching user statistics',
    );
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques des utilisateurs' },
      { status: 500 },
    );
  }
}
