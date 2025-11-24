import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { ROLES } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';
import {
  getBookingRepository,
  getTransactionRepository,
  getUserRepository,
  getInvoiceRepository,
} from '@/repositories';
import { TRANSACTION_STATUSES, BOOKING_STATUSES } from '@/lib/constants';

/**
 * API Route pour récupérer les statistiques de la plateforme (Super Admin uniquement)
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Repository Pattern
 * - Authorization Pattern
 * - Logger Pattern
 */

export async function GET(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/statistics/platform',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est super admin (ADMIN + au moins un autre rôle)
    const userRoles = session.user.roles || [];
    const hasAdmin = userRoles.includes(ROLES.ADMIN);
    const hasMultipleRoles = userRoles.length > 1;
    
    if (!hasAdmin || !hasMultipleRoles) {
      log.warn({ userId: session.user.id, roles: userRoles }, 'Access denied: not super admin');
      return NextResponse.json({ error: 'Accès refusé: Super Admin requis' }, { status: 403 });
    }

    const userId = session.user.id;
    log.debug({ userId }, 'Fetching platform statistics');

    // Récupérer les repositories
    const userRepository = getUserRepository();
    const bookingRepository = getBookingRepository();
    const transactionRepository = getTransactionRepository();
    const invoiceRepository = getInvoiceRepository();

    // Récupérer toutes les données nécessaires
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last12Months = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    // Récupérer les utilisateurs
    const usersResult = await userRepository.findAll({}, { limit: 10000, page: 1, offset: 0 });
    const allUsers = usersResult.data || [];
    
    // Récupérer les bookings
    const bookingsResult = await bookingRepository.findBookingsWithFilters(
      {},
      { limit: 10000, page: 1, offset: 0 }
    );
    const allBookings = bookingsResult.data || [];
    
    // Récupérer les transactions
    const transactionsResult = await transactionRepository.findTransactionsWithFilters(
      {},
      { limit: 10000, page: 1, offset: 0 }
    );
    const allTransactions = transactionsResult.data || [];
    
    // Récupérer les factures
    const invoicesResult = await invoiceRepository.findInvoicesWithFilters(
      {},
      { limit: 10000, page: 1, offset: 0 }
    );
    const allInvoices = invoicesResult.data || [];

    // Calculer les statistiques globales
    const totalUsers = allUsers.length;
    const totalCustomers = allUsers.filter(u => 
      Array.isArray(u.roles) ? u.roles.includes(ROLES.CUSTOMER) : u.roles === ROLES.CUSTOMER
    ).length;
    const totalProviders = allUsers.filter(u => 
      Array.isArray(u.roles) ? u.roles.includes(ROLES.PROVIDER) : u.roles === ROLES.PROVIDER
    ).length;
    const totalAdmins = allUsers.filter(u => 
      Array.isArray(u.roles) ? u.roles.includes(ROLES.ADMIN) : u.roles === ROLES.ADMIN
    ).length;

    // Nouveaux utilisateurs ce mois
    const newUsersThisMonth = allUsers.filter(u => {
      const createdAt = new Date(u.createdAt || u.createdat || Date.now());
      return createdAt >= startOfMonth;
    }).length;

    // Statistiques des bookings
    const totalBookings = allBookings.length;
    const completedBookings = allBookings.filter(b => b.status === BOOKING_STATUSES.COMPLETED).length;
    const pendingBookings = allBookings.filter(b => b.status === BOOKING_STATUSES.PENDING).length;
    const cancelledBookings = allBookings.filter(b => b.status === BOOKING_STATUSES.CANCELLED).length;

    // Statistiques des transactions
    const totalTransactions = allTransactions.length;
    const completedTransactions = allTransactions.filter(t => 
      t.status === TRANSACTION_STATUSES.COMPLETED
    ).length;
    const totalRevenue = allTransactions
      .filter(t => t.status === TRANSACTION_STATUSES.COMPLETED)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const revenueThisMonth = allTransactions
      .filter(t => {
        const createdAt = new Date(t.createdAt);
        return createdAt >= startOfMonth && t.status === TRANSACTION_STATUSES.COMPLETED;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Statistiques des factures
    const totalInvoices = allInvoices.length;
    const paidInvoices = allInvoices.filter(i => i.status === 'PAID').length;
    const pendingInvoices = allInvoices.filter(i => i.status === 'SENT' || i.status === 'PENDING').length;

    // Données pour les graphiques (12 derniers mois)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthTransactions = allTransactions.filter(t => {
        const createdAt = new Date(t.createdAt);
        return createdAt >= monthDate && createdAt < nextMonthDate && 
               t.status === TRANSACTION_STATUSES.COMPLETED;
      });
      
      const monthBookings = allBookings.filter(b => {
        const createdAt = new Date(b.createdAt || b.date || Date.now());
        return createdAt >= monthDate && createdAt < nextMonthDate;
      });
      
      const monthUsers = allUsers.filter(u => {
        const createdAt = new Date(u.createdAt || u.createdat || Date.now());
        return createdAt >= monthDate && createdAt < nextMonthDate;
      });

      monthlyData.push({
        month: monthDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        revenue: monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        transactions: monthTransactions.length,
        bookings: monthBookings.length,
        newUsers: monthUsers.length,
      });
    }

    // Répartition par rôle
    const usersByRole = {
      customers: totalCustomers,
      providers: totalProviders,
      admins: totalAdmins,
      others: totalUsers - totalCustomers - totalProviders - totalAdmins,
    };

    // Répartition des statuts de bookings
    const bookingsByStatus = {
      completed: completedBookings,
      pending: pendingBookings,
      cancelled: cancelledBookings,
      others: totalBookings - completedBookings - pendingBookings - cancelledBookings,
    };

    // Top 5 services les plus utilisés
    const serviceCounts: Record<string, number> = {};
    allBookings.forEach(booking => {
      const serviceName = (booking.selectedService as any)?.name || 'Service inconnu';
      serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
    });
    const topServices = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const statistics = {
      overview: {
        totalUsers,
        totalCustomers,
        totalProviders,
        totalAdmins,
        newUsersThisMonth,
        totalBookings,
        completedBookings,
        totalTransactions,
        completedTransactions,
        totalRevenue,
        revenueThisMonth,
        totalInvoices,
        paidInvoices,
        pendingInvoices,
      },
      charts: {
        monthlyData,
        usersByRole,
        bookingsByStatus,
        topServices,
      },
    };

    log.info(
      {
        userId,
        totalUsers,
        totalRevenue,
        revenueThisMonth,
      },
      'Platform statistics fetched successfully',
    );

    return NextResponse.json({
      success: true,
      statistics,
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error fetching platform statistics' },
      'Error fetching platform statistics',
    );
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques de la plateforme' },
      { status: 500 },
    );
  }
}

