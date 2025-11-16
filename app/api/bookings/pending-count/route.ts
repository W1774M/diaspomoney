/**
 * API Route pour récupérer le nombre de commandes en attente
 * Implémente les design patterns :
 * - Repository Pattern (via getBookingRepository)
 * - Service Layer Pattern (via les repositories)
 * - Logger Pattern (structured logging avec childLogger)
 * - Middleware Pattern (authentification)
 */

import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { getBookingRepository } from '@/repositories';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/bookings/pending-count',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'all'; // 'all', 'admin', 'csm', 'provider'

    log.debug({ userId, role }, 'Fetching pending bookings count');

    // Utiliser le repository (Repository Pattern)
    const bookingRepository = getBookingRepository();

    let filters: any = {};

    // Filtrer selon le rôle
    if (role === 'admin' || role === 'csm') {
      // Admin et CSM voient toutes les commandes en attente
      filters.status = 'PENDING';
    } else if (role === 'provider') {
      // Provider voit ses propres commandes en attente
      filters.providerId = userId;
      filters.status = 'PENDING';
    } else {
      // Par défaut, l'utilisateur voit ses propres commandes
      filters.requesterId = userId;
      filters.status = 'PENDING';
    }

    // Récupérer le nombre de commandes en attente
    const result = await bookingRepository.findBookingsWithFilters(filters, {
      limit: 1,
      offset: 0,
    });

    const pendingCount = result.total;

    log.info(
      {
        userId,
        role,
        pendingCount,
      },
      'Pending bookings count fetched successfully'
    );

    return NextResponse.json({
      success: true,
      pendingCount,
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error fetching pending bookings count' },
      'Error fetching pending bookings count'
    );
    return NextResponse.json(
      {
        error:
          'Erreur lors de la récupération du nombre de commandes en attente',
      },
      { status: 500 }
    );
  }
}
