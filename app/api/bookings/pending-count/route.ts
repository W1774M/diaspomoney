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
import { BOOKING_STATUSES, HTTP_STATUS_CODES } from '@/lib/constants';
import type { BookingServiceFilters } from '@/lib/types';
import type { BookingFilters } from '@/repositories/interfaces/IBookingRepository';
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
      return NextResponse.json({ error: 'Non autorisé' }, { status: HTTP_STATUS_CODES.UNAUTHORIZED });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'all'; // 'all', 'admin', 'csm', 'provider'

    log.debug({ userId, role }, 'Fetching pending bookings count');

    // Utiliser le repository (Repository Pattern)
    const bookingRepository = getBookingRepository();

    const filters: BookingServiceFilters = {};

    // Filtrer selon le rôle
    if (role === 'admin' || role === 'csm') {
      // Admin et CSM voient toutes les commandes en attente
      filters.status = BOOKING_STATUSES.PENDING;
    } else if (role === 'provider') {
      // Provider voit ses propres commandes en attente
      filters.providerId = userId;
      filters.status = BOOKING_STATUSES.PENDING;
    } else {
      // Par défaut, l'utilisateur voit ses propres commandes
      filters.userId = userId;
      filters.status = BOOKING_STATUSES.PENDING;
    }

    // Convertir BookingServiceFilters en BookingFilters pour le repository
    const bookingFilters: BookingFilters = {} as BookingFilters;
    if (filters.userId) {
      bookingFilters.requesterId = filters.userId;
    }
    if (filters.providerId) {
      bookingFilters.providerId = filters.providerId;
    }
    if (filters.status) {
      bookingFilters.status = filters.status as NonNullable<BookingFilters['status']>;
    }
    if (filters.dateFrom) {
      bookingFilters.dateFrom = filters.dateFrom;
    }
    if (filters.dateTo) {
      bookingFilters.dateTo = filters.dateTo;
    }

    // Récupérer le nombre de commandes en attente
    const result = await bookingRepository.findBookingsWithFilters(bookingFilters, {
      limit: 1,
      page: 1,
      offset: 0,
    });

    const pendingCount = result.total;

    log.info(
      {
        userId,
        role,
        pendingCount,
      },
      'Pending bookings count fetched successfully',
    );

    return NextResponse.json({
      success: true,
      pendingCount,
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error fetching pending bookings count' },
      'Error fetching pending bookings count',
    );
    return NextResponse.json(
      {
        error:
          'Erreur lors de la récupération du nombre de commandes en attente',
      },
      { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR },
    );
  }
}
