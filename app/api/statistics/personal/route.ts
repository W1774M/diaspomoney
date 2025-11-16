import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { statisticsService } from '@/services/statistics/statistics.service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour récupérer les statistiques personnelles
 * Implémente les design patterns :
 * - Service Layer Pattern (via statisticsService)
 * - Repository Pattern (via statisticsService qui utilise les repositories)
 * - Dependency Injection (via statisticsService singleton)
 * - Logger Pattern (structured logging avec childLogger + @Log decorator dans le service)
 * - Middleware Pattern (authentification)
 * - Decorator Pattern (@Log, @Cacheable dans statisticsService)
 * - Singleton Pattern (statisticsService)
 */

export async function GET(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/statistics/personal',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;
    log.debug({ userId }, 'Fetching personal statistics');

    // Utiliser le service avec décorateurs (@Log, @Cacheable)
    // Le service gère toute la logique métier et le cache automatiquement
    const statistics = await statisticsService.getPersonalStatistics(userId);

    log.info(
      {
        userId,
        monthlyBudget: statistics.budget.monthly.budget,
        annualBudget: statistics.budget.annual.budget,
        monthlySpent: statistics.budget.monthly.spent,
        annualSpent: statistics.budget.annual.spent,
        servicesCount: statistics.services.mostUsed.length,
        providersCount: statistics.providers.favorites.length,
      },
      'Personal statistics fetched successfully'
    );

    return NextResponse.json({
      success: true,
      statistics,
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error fetching personal statistics' },
      'Error fetching personal statistics'
    );
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
