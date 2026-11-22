/**
 * API Route pour récupérer les statistiques admin
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
import {
  getBookingRepository,
  getTransactionRepository,
  getUserRepository,
  getComplaintRepository,
} from '@/repositories';
import {
  collectPlatformPayments,
  countPayments,
  sumRevenue,
} from '@/services/statistics/platform-revenue';

export async function GET(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/statistics/admin',
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
    log.debug({ userId }, 'Fetching admin statistics');

    // Récupérer les repositories
    const userRepository = getUserRepository();
    const transactionRepository = getTransactionRepository();
    const complaintRepository = getComplaintRepository();

    // Récupérer toutes les données nécessaires
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Récupérer les utilisateurs
    const allUsers = await userRepository.findAll({});
    
    // Récupérer les transactions
    const transactionsResult = await transactionRepository.findTransactionsWithFilters(
      {},
      { limit: 10000, page: 1, offset: 0 },
    );
    const allTransactions = transactionsResult.data || [];

    // Calculer les statistiques des utilisateurs
    const totalUsers = allUsers.length;
    const totalCustomers = allUsers.filter((u: any) => 
      Array.isArray(u.roles) ? u.roles.includes(ROLES.CUSTOMER) : u.roles === ROLES.CUSTOMER,
    ).length;
    const totalProviders = allUsers.filter((u: any) => 
      Array.isArray(u.roles) ? u.roles.includes(ROLES.PROVIDER) : u.roles === ROLES.PROVIDER,
    ).length;
    const totalCSM = allUsers.filter((u: any) => 
      Array.isArray(u.roles) ? u.roles.includes(ROLES.CSM) : u.roles === ROLES.CSM,
    ).length;

    // Nouveaux utilisateurs ce mois
    const newUsersThisMonth = allUsers.filter((u: any) => {
      const createdAt = new Date(u.createdAt || u.createdat || Date.now());
      return createdAt >= startOfMonth;
    }).length;

    // Paiements encaissés : transactions COMPLETED + réservations au paiement
    // Stripe confirmé (le chemin canonique ne crée pas de transaction), dédoublonnés.
    const bookingsResult = await getBookingRepository().findBookingsWithFilters(
      {},
      { limit: 10000, page: 1, offset: 0 },
    );
    const payments = collectPlatformPayments(allTransactions, bookingsResult.data || []);

    // Paiements d'aujourd'hui et du mois
    const todayTransactions = countPayments(payments, { from: today });
    const monthlyTransactions = countPayments(payments, { from: startOfMonth });

    // Revenus de la plateforme
    const platformRevenue = sumRevenue(payments);

    // Récupérer les réclamations/tickets de support ouverts
    let openSupportTickets = 0;
    try {
      // Récupérer toutes les réclamations et filtrer celles qui sont ouvertes
      const complaintsResult = await complaintRepository.findComplaintsWithFilters(
        {},
        { limit: 10000, page: 1, offset: 0 },
      );
      const openComplaints = complaintsResult.data?.filter(
        (c: any) => c.status === 'OPEN' || c.status === 'IN_PROGRESS',
      ).length || 0;
      openSupportTickets = openComplaints;
    } catch (error) {
      log.warn({ error }, 'Failed to fetch support tickets, using 0');
    }

    const statistics = {
      totalUsers: {
        all: totalUsers,
        customers: totalCustomers,
        providers: totalProviders,
        csm: totalCSM,
      },
      todayTransactions,
      monthlyTransactions,
      platformRevenue,
      newRegistrations: newUsersThisMonth,
      openSupportTickets,
    };

    log.info(
      {
        userId,
        totalUsers,
        todayTransactions,
        monthlyTransactions,
        platformRevenue,
      },
      'Admin statistics fetched successfully',
    );

    return NextResponse.json({
      success: true,
      statistics,
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error fetching admin statistics' },
      'Error fetching admin statistics',
    );
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques admin' },
      { status: 500 },
    );
  }
}
