import { handleApiRoute } from '@/lib/api/error-handler';
import { requireApiSession } from '@/lib/api/auth';
import { childLogger } from '@/lib/logger';
import { getActiveOrdersUseCase } from '@/services/orders/get-active-orders.use-case';
import { NextRequest } from 'next/server';

/**
 * API Route pour récupérer les commandes actives
 * Implémente les design patterns :
 * - Repository Pattern (via getBookingRepository, getUserRepository, getConversationRepository)
 * - Service Layer Pattern (via les repositories)
 * - Logger Pattern (structured logging avec childLogger)
 */

export async function GET(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({ requestId: reqId, route: 'api/orders/active' });

  return handleApiRoute(request, async () => {
    const session = await requireApiSession();
    const userId = session.user.id;
    log.debug({ userId, msg: 'Fetching active orders' });

    const orders = await getActiveOrdersUseCase(userId);

    log.info({
      userId,
      orderCount: orders.length,
      msg: 'Active orders retrieved successfully',
    });

    return {
      success: true,
      orders,
    };
  }, 'api/orders/active');
}
