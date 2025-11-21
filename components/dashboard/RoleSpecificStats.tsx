'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { useBookings } from '@/hooks/useBookings';
import { BOOKING_STATUSES, ROLES } from '@/lib/constants';
import { 
  ShoppingCart, 
  CheckCircle, 
  DollarSign, 
  Star, 
  TrendingUp,
  Users,
  Heart,
  Briefcase,
  Award,
  Activity,
  Server,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { useMemo } from 'react';

interface RoleSpecificStatsProps {
  userId?: string | undefined;
}

export default function RoleSpecificStats({ userId }: RoleSpecificStatsProps) {
  const { user, isProvider, isCustomer, isCSM, isAdmin } = useAuth();
  
        // Récupérer les bookings pour le customer
        const { bookings: customerBookings = [] } = useBookings({
          userId: isCustomer() ? userId : undefined,
          limit: 100, // Maximum autorisé par l'API
        });

        // Récupérer les bookings pour le provider
        const { bookings: providerBookings = [] } = useBookings({
          providerId: isProvider() ? userId : undefined,
          limit: 100, // Maximum autorisé par l'API
        });

  // Statistiques pour CUSTOMER
  const customerStats = useMemo(() => {
    if (!isCustomer() || !userId) return null;

    const activeBookings = customerBookings.filter(
      (b: any) => b.status === BOOKING_STATUSES.PENDING || b.status === BOOKING_STATUSES.CONFIRMED,
    );
    const completedBookings = customerBookings.filter(
      (b: any) => b.status === BOOKING_STATUSES.COMPLETED,
    );
    const totalSpent = customerBookings
      .filter((b: any) => b.status === BOOKING_STATUSES.COMPLETED)
      .reduce((sum: number, b: any) => sum + (b.price || b.totalAmount || 0), 0);

    // Prestataires favoris (par nombre de commandes)
    const providerCounts = new Map<string, { count: number; name: string; rating: number }>();
    customerBookings.forEach((b: any) => {
      if (b.provider?.id) {
        const existing = providerCounts.get(b.provider.id) || { count: 0, name: `${b.provider.firstName  } ${  b.provider.lastName}`, rating: b.provider.rating || 0 };
        providerCounts.set(b.provider.id, {
          count: existing.count + 1,
          name: existing.name,
          rating: existing.rating,
        });
      }
    });
    const favoriteProviders = Array.from(providerCounts.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      activeOrders: activeBookings.length,
      completedOrders: completedBookings.length,
      totalSpent,
      favoriteProviders,
    };
  }, [customerBookings, userId, isCustomer]);

  // Statistiques pour PROVIDER INDIVIDUAL
  const providerIndividualStats = useMemo(() => {
    const providerInfo = (user as any)?.providerInfo;
    if (!isProvider() || providerInfo?.type !== 'INDIVIDUAL' || !userId) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const activeMissions = providerBookings.filter(
      (b: any) => b.status === BOOKING_STATUSES.PENDING || b.status === BOOKING_STATUSES.CONFIRMED,
    );
    const completedThisMonth = providerBookings.filter((b: any) => {
      if (b.status !== BOOKING_STATUSES.COMPLETED) return false;
      const bookingDate = new Date(b.date || b.appointmentDate || b.createdAt);
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
    });
    const revenueThisMonth = completedThisMonth.reduce(
      (sum: number, b: any) => sum + (b.price || b.totalAmount || 0),
      0,
    );
    const totalRevenue = providerBookings
      .filter((b: any) => b.status === BOOKING_STATUSES.COMPLETED)
      .reduce((sum: number, b: any) => sum + (b.price || b.totalAmount || 0), 0);

    // Note moyenne et avis
    const averageRating = providerInfo?.rating || 0;
    const reviewCount = providerInfo?.reviewCount || 0;

    // Taux d'acceptation
    const totalRequests = providerBookings.length;
    const acceptedRequests = providerBookings.filter(
      (b: any) => b.status !== BOOKING_STATUSES.CANCELLED,
    ).length;
    const acceptanceRate = totalRequests > 0 ? (acceptedRequests / totalRequests) * 100 : 0;

    return {
      activeMissions: activeMissions.length,
      completedThisMonth: completedThisMonth.length,
      revenueThisMonth,
      totalRevenue,
      averageRating,
      reviewCount,
      acceptanceRate,
    };
  }, [user, userId, isProvider, providerBookings]);

  // Statistiques pour PROVIDER INSTITUTION
  const providerInstitutionStats = useMemo(() => {
    const providerInfo = (user as any)?.providerInfo;
    if (!isProvider() || providerInfo?.type !== 'INSTITUTION' || !userId) return null;

    // Simulé - à remplacer par vraies données
    return {
      activeProviders: 0, // À calculer depuis les prestataires de l'institution
      totalActiveMissions: 0, // À calculer
      monthlyRevenue: 0, // À calculer
      satisfactionRate: 0, // À calculer
      newProvidersThisMonth: 0, // À calculer
    };
  }, [user, userId, isProvider]);

  // Statistiques pour CSM
  const csmStats = useMemo(() => {
    if (!isCSM() || !userId) return null;

    // Simulé - à remplacer par vraies données
    return {
      managedOrders: 0,
      assignedClients: 0,
      coordinatedProviders: 0,
      satisfactionRate: 0,
      resolvedTickets: 0,
    };
  }, [userId, isCSM]);

  // Statistiques pour ADMIN
  const adminStats = useMemo(() => {
    if (!isAdmin()) return null;

    // Simulé - à remplacer par vraies données
    return {
      totalUsers: { all: 0, customers: 0, providers: 0, csm: 0 },
      todayTransactions: 0,
      monthlyTransactions: 0,
      platformRevenue: 0,
      newRegistrations: 0,
      openSupportTickets: 0,
    };
  }, [isAdmin]);

  // Statistiques pour SUPER ADMIN
  // Un utilisateur est super admin s'il a ADMIN ET au moins un autre rôle
  const superAdminStats = useMemo(() => {
    const userRoles = user?.roles || [];
    const hasAdmin = userRoles.includes(ROLES.ADMIN);
    const hasMultipleRoles = userRoles.length > 1;
    if (!isAdmin() || !hasAdmin || !hasMultipleRoles) return null;

    // Simulé - à remplacer par vraies données
    return {
      platformHealth: 0,
      systemUptime: 0,
      serverPerformance: 0,
      totalRevenue: 0,
      operatingCosts: 0,
    };
  }, [user, isAdmin]);

  // Rendu selon le rôle
  if (customerStats) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <ShoppingCart className='h-8 w-8 text-blue-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Commandes en cours</h3>
          <p className='text-2xl font-bold text-gray-900'>{customerStats.activeOrders}</p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <CheckCircle className='h-8 w-8 text-green-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Commandes terminées</h3>
          <p className='text-2xl font-bold text-gray-900'>{customerStats.completedOrders}</p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <DollarSign className='h-8 w-8 text-orange-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Montant total dépensé</h3>
          <p className='text-2xl font-bold text-gray-900'>
            {customerStats.totalSpent.toFixed(2)} €
          </p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Heart className='h-8 w-8 text-red-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Prestataires favoris</h3>
          <p className='text-2xl font-bold text-gray-900'>{customerStats.favoriteProviders.length}</p>
        </div>
      </div>
    );
  }

  if (providerIndividualStats) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Briefcase className='h-8 w-8 text-blue-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Missions en cours</h3>
          <p className='text-2xl font-bold text-gray-900'>{providerIndividualStats.activeMissions}</p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <CheckCircle className='h-8 w-8 text-green-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Complétées ce mois</h3>
          <p className='text-2xl font-bold text-gray-900'>{providerIndividualStats.completedThisMonth}</p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <DollarSign className='h-8 w-8 text-orange-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Revenu ce mois</h3>
          <p className='text-2xl font-bold text-gray-900'>
            {providerIndividualStats.revenueThisMonth.toFixed(2)} €
          </p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Star className='h-8 w-8 text-yellow-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Note moyenne</h3>
          <p className='text-2xl font-bold text-gray-900'>
            {providerIndividualStats.averageRating.toFixed(1)}/5
          </p>
          <p className='text-xs text-gray-500 mt-1'>
            {providerIndividualStats.reviewCount} avis
          </p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <TrendingUp className='h-8 w-8 text-purple-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Taux d'acceptation</h3>
          <p className='text-2xl font-bold text-gray-900'>
            {providerIndividualStats.acceptanceRate.toFixed(1)}%
          </p>
        </div>
      </div>
    );
  }

  if (providerInstitutionStats) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Users className='h-8 w-8 text-blue-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Prestataires actifs</h3>
          <p className='text-2xl font-bold text-gray-900'>{providerInstitutionStats.activeProviders}</p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Briefcase className='h-8 w-8 text-green-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Missions en cours</h3>
          <p className='text-2xl font-bold text-gray-900'>{providerInstitutionStats.totalActiveMissions}</p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <DollarSign className='h-8 w-8 text-orange-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>CA du mois</h3>
          <p className='text-2xl font-bold text-gray-900'>
            {providerInstitutionStats.monthlyRevenue.toFixed(2)} €
          </p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Award className='h-8 w-8 text-yellow-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Taux de satisfaction</h3>
          <p className='text-2xl font-bold text-gray-900'>
            {providerInstitutionStats.satisfactionRate.toFixed(1)}%
          </p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Users className='h-8 w-8 text-purple-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Nouveaux ce mois</h3>
          <p className='text-2xl font-bold text-gray-900'>{providerInstitutionStats.newProvidersThisMonth}</p>
        </div>
      </div>
    );
  }

  if (csmStats) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <ShoppingCart className='h-8 w-8 text-blue-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Commandes gérées</h3>
          <p className='text-2xl font-bold text-gray-900'>{csmStats.managedOrders}</p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Users className='h-8 w-8 text-green-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Clients assignés</h3>
          <p className='text-2xl font-bold text-gray-900'>{csmStats.assignedClients}</p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Briefcase className='h-8 w-8 text-orange-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Prestataires coordonnés</h3>
          <p className='text-2xl font-bold text-gray-900'>{csmStats.coordinatedProviders}</p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Award className='h-8 w-8 text-yellow-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Taux de satisfaction</h3>
          <p className='text-2xl font-bold text-gray-900'>{csmStats.satisfactionRate.toFixed(1)}%</p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <CheckCircle className='h-8 w-8 text-purple-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Tickets résolus</h3>
          <p className='text-2xl font-bold text-gray-900'>{csmStats.resolvedTickets}</p>
        </div>
      </div>
    );
  }

  if (adminStats) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Users className='h-8 w-8 text-blue-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Utilisateurs totaux</h3>
          <p className='text-2xl font-bold text-gray-900'>{adminStats.totalUsers.all}</p>
          <p className='text-xs text-gray-500 mt-1'>
            {adminStats.totalUsers.customers} clients, {adminStats.totalUsers.providers} prestataires
          </p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <CreditCard className='h-8 w-8 text-green-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Transactions (mois)</h3>
          <p className='text-2xl font-bold text-gray-900'>{adminStats.monthlyTransactions}</p>
          <p className='text-xs text-gray-500 mt-1'>{adminStats.todayTransactions} aujourd'hui</p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <DollarSign className='h-8 w-8 text-orange-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Revenus plateforme</h3>
          <p className='text-2xl font-bold text-gray-900'>
            {adminStats.platformRevenue.toFixed(2)} €
          </p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Users className='h-8 w-8 text-purple-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Nouveaux inscrits</h3>
          <p className='text-2xl font-bold text-gray-900'>{adminStats.newRegistrations}</p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <AlertCircle className='h-8 w-8 text-red-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Tickets ouverts</h3>
          <p className='text-2xl font-bold text-gray-900'>{adminStats.openSupportTickets}</p>
        </div>
      </div>
    );
  }

  if (superAdminStats) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Activity className='h-8 w-8 text-green-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Santé plateforme</h3>
          <p className='text-2xl font-bold text-gray-900'>{superAdminStats.platformHealth}%</p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Server className='h-8 w-8 text-blue-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Uptime système</h3>
          <p className='text-2xl font-bold text-gray-900'>{superAdminStats.systemUptime}%</p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <Activity className='h-8 w-8 text-orange-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Performance serveurs</h3>
          <p className='text-2xl font-bold text-gray-900'>{superAdminStats.serverPerformance}%</p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <DollarSign className='h-8 w-8 text-green-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Revenus totaux</h3>
          <p className='text-2xl font-bold text-gray-900'>
            {superAdminStats.totalRevenue.toFixed(2)} €
          </p>
        </div>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <CreditCard className='h-8 w-8 text-red-500' />
          </div>
          <h3 className='text-sm font-medium text-gray-600 mb-1'>Coûts d'exploitation</h3>
          <p className='text-2xl font-bold text-gray-900'>
            {superAdminStats.operatingCosts.toFixed(2)} €
          </p>
        </div>
      </div>
    );
  }

  return null;
}

