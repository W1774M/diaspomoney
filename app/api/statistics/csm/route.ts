/**
 * API Route pour récupérer les statistiques CSM
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Repository Pattern
 * - Authorization Pattern
 * - Logger Pattern
 */

import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { ROLES, BOOKING_STATUSES } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';
import {
  getComplaintRepository,
} from '@/repositories';
import { getMongoClient } from '@/lib/database/mongodb';
import { ObjectId } from 'mongodb';
import { DATABASE } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/statistics/csm',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est CSM
    const userRoles = session.user.roles || [];
    const isCSM = userRoles.includes(ROLES.CSM);
    
    if (!isCSM) {
      log.warn({ userId: session.user.id, roles: userRoles }, 'Access denied: CSM required');
      return NextResponse.json({ error: 'Accès refusé: CSM requis' }, { status: 403 });
    }

    const userId = session.user.id;
    log.debug({ userId }, 'Fetching CSM statistics');

    // Récupérer le portefeuille de providers du CSM
    const client = await getMongoClient();
    const db = client.db();
    const users = db.collection(DATABASE.COLLECTIONS.USERS);
    const csm = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { csmPortfolioProviderIds: 1 } },
    );
    const portfolioProviderIds = (csm?.['csmPortfolioProviderIds'] as string[] | undefined) || [];

    if (portfolioProviderIds.length === 0) {
      // Si le CSM n'a pas de portefeuille, retourner des statistiques vides
      return NextResponse.json({
        success: true,
        statistics: {
          managedOrders: 0,
          assignedClients: 0,
          coordinatedProviders: 0,
          satisfactionRate: 0,
          resolvedTickets: 0,
        },
      });
    }

    // Récupérer les repositories
    const complaintRepository = getComplaintRepository();

    // Récupérer les bookings où le providerId est dans le portefeuille
    // Le repository ne supporte pas directement providerIds, donc on utilise MongoDB directement
    const bookingsCollection = db.collection(DATABASE.COLLECTIONS.APPOINTMENTS || 'bookings');
    
    const managedBookings = await bookingsCollection
      .find({
        providerId: { $in: portfolioProviderIds },
      })
      .toArray();

    // Calculer les statistiques
    const managedOrders = managedBookings.length;

    // Récupérer les clients uniques (requesterId) des bookings gérés
    const uniqueClientIds = new Set<string>();
    managedBookings.forEach((booking: any) => {
      if (booking.requesterId) {
        uniqueClientIds.add(booking.requesterId);
      }
    });
    const assignedClients = uniqueClientIds.size;

    // Providers coordonnés = nombre de providers uniques dans le portefeuille
    const coordinatedProviders = portfolioProviderIds.length;

    // Calculer le taux de satisfaction
    // Pour l'instant, on peut utiliser une estimation basée sur les bookings terminés
    // TODO: Intégrer les vraies reviews/ratings si disponibles
    const completedBookings = managedBookings.filter(
      (b: any) => b.status === BOOKING_STATUSES.FINISHED,
    ).length;
    const satisfactionRate = managedOrders > 0 
      ? Math.round((completedBookings / managedOrders) * 100)
      : 0;

    // Récupérer les réclamations/tickets résolus
    let resolvedTickets = 0;
    try {
      // Récupérer toutes les réclamations liées aux bookings gérés
      const allComplaintIds = new Set<string>();
      managedBookings.forEach((booking: any) => {
        if (booking.id) {
          allComplaintIds.add(booking.id);
        }
      });

      // Récupérer les réclamations résolues ou fermées
      const complaintsResult = await complaintRepository.findComplaintsWithFilters(
        {},
        { limit: 10000, page: 1, offset: 0 },
      );
      const resolvedComplaints = complaintsResult.data?.filter(
        (c: any) => (c.status === 'RESOLVED' || c.status === 'CLOSED') && 
                    c.appointmentId && 
                    allComplaintIds.has(c.appointmentId),
      ).length || 0;
      resolvedTickets = resolvedComplaints;
    } catch (error) {
      log.warn({ error }, 'Failed to fetch resolved tickets, using 0');
    }

    const statistics = {
      managedOrders,
      assignedClients,
      coordinatedProviders,
      satisfactionRate,
      resolvedTickets,
    };

    log.info(
      {
        userId,
        managedOrders,
        assignedClients,
        coordinatedProviders,
        satisfactionRate,
        resolvedTickets,
      },
      'CSM statistics fetched successfully',
    );

    return NextResponse.json({
      success: true,
      statistics,
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error fetching CSM statistics' },
      'Error fetching CSM statistics',
    );
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques CSM' },
      { status: 500 },
    );
  }
}
