'use client';

import React from 'react';
import {
  Activity,
  Server,
  DollarSign,
  CreditCard,
  Users,
  ShoppingCart,
} from 'lucide-react';
import DashboardStatCard from '../DashboardStatCard';
import RevenueChart from '../charts/RevenueChart';
import UsersChart from '../charts/UsersChart';
import TransactionsChart from '../charts/TransactionsChart';
import UsersByRoleChart from '../charts/UsersByRoleChart';
import BookingsByStatusChart from '../charts/BookingsByStatusChart';
import TopServicesChart from '../charts/TopServicesChart';
import type { SuperAdminStats } from '@/hooks/statistics';

interface SuperAdminStatsProps {
  stats: SuperAdminStats;
  loading: boolean;
  error: string | null;
}

const SuperAdminStatsComponent = React.memo<SuperAdminStatsProps>(
  function SuperAdminStatsComponent({ stats, loading, error }) {
    const { overview, charts } = stats;

    return (
      <div className='space-y-6'>
        {/* Cartes de statistiques principales */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6'>
          <DashboardStatCard
            title='Santé plateforme'
            value={loading ? '...' : `${stats.platformHealth}%`}
            icon={Activity}
            color='green'
          />
          <DashboardStatCard
            title='Uptime système'
            value={loading ? '...' : `${stats.systemUptime}%`}
            icon={Server}
            color='blue'
          />
          <DashboardStatCard
            title='Performance serveurs'
            value={loading ? '...' : `${stats.serverPerformance}%`}
            icon={Activity}
            color='orange'
          />
          <DashboardStatCard
            title='Revenus totaux'
            value={loading ? '...' : `${stats.totalRevenue.toFixed(2)} €`}
            icon={DollarSign}
            color='green'
          />
          <DashboardStatCard
            title="Coûts d'exploitation"
            value={loading ? '...' : `${stats.operatingCosts.toFixed(2)} €`}
            icon={CreditCard}
            color='red'
          />
        </div>

        {/* Statistiques détaillées */}
        {!loading && overview && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <DashboardStatCard
              title='Utilisateurs totaux'
              value={overview.totalUsers}
              icon={Users}
              color='blue'
              description={`${overview.totalCustomers} clients, ${overview.totalProviders} prestataires`}
            />
            <DashboardStatCard
              title='Réservations'
              value={overview.totalBookings}
              icon={ShoppingCart}
              color='green'
              description={`${overview.completedBookings} terminées`}
            />
            <DashboardStatCard
              title='Transactions'
              value={overview.totalTransactions}
              icon={CreditCard}
              color='orange'
              description={`${overview.completedTransactions} complétées`}
            />
            <DashboardStatCard
              title='Revenus ce mois'
              value={`${overview.revenueThisMonth.toFixed(2)} €`}
              icon={DollarSign}
              color='purple'
              description={`${overview.newUsersThisMonth} nouveaux utilisateurs`}
            />
          </div>
        )}

        {/* Graphiques */}
        {!loading && charts && (
          <div className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <RevenueChart data={charts.monthlyData} />
              <UsersChart data={charts.monthlyData} />
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <TransactionsChart data={charts.monthlyData} />
              <UsersByRoleChart data={charts.usersByRole} />
            </div>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <BookingsByStatusChart data={charts.bookingsByStatus} />
              <TopServicesChart data={charts.topServices} />
            </div>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <p className='text-red-800 text-sm'>
              Erreur lors du chargement des statistiques: {error}
            </p>
          </div>
        )}

        {/* Message de chargement */}
        {loading && (
          <div className='bg-gray-50 border border-gray-200 rounded-lg p-8 text-center'>
            <p className='text-gray-600'>Chargement des statistiques de la plateforme...</p>
          </div>
        )}
      </div>
    );
  },
);

SuperAdminStatsComponent.displayName = 'SuperAdminStats';

export default SuperAdminStatsComponent;

