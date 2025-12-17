'use client';

import React from 'react';
import { Users, CreditCard, DollarSign, AlertCircle, ShoppingCart, CheckCircle } from 'lucide-react';
import DashboardStatCard from '../DashboardStatCard';
import type { AdminStats } from '@/hooks/statistics';

interface AdminStatsProps {
  stats: AdminStats;
}

const AdminStatsComponent = React.memo<AdminStatsProps>(function AdminStatsComponent({ stats }) {
  return (
    <div className='space-y-6'>
      {/* Statistiques de commandes */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
        <DashboardStatCard
          title='Commandes en cours'
          value={stats.activeOrders}
          icon={ShoppingCart}
          color='blue'
        />
        <DashboardStatCard
          title='Commandes terminées'
          value={stats.completedOrders}
          icon={CheckCircle}
          color='green'
        />
        <DashboardStatCard
          title='Montant total dépensé'
          value={`${stats.totalAmountSpent.toFixed(2)} €`}
          icon={DollarSign}
          color='orange'
        />
      </div>
      
      {/* Autres statistiques */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
        <DashboardStatCard
          title='Utilisateurs totaux'
          value={stats.totalUsers.all}
          icon={Users}
          color='blue'
          description={`${stats.totalUsers.customers} clients, ${stats.totalUsers.providers} prestataires`}
        />
        <DashboardStatCard
          title='Transactions (mois)'
          value={stats.monthlyTransactions}
          icon={CreditCard}
          color='green'
          description={`${stats.todayTransactions} aujourd'hui`}
        />
        <DashboardStatCard
          title='Revenus plateforme'
          value={`${stats.platformRevenue.toFixed(2)} €`}
          icon={DollarSign}
          color='orange'
        />
        <DashboardStatCard
          title='Nouveaux inscrits'
          value={stats.newRegistrations}
          icon={Users}
          color='purple'
        />
        <DashboardStatCard
          title='Tickets ouverts'
          value={stats.openSupportTickets}
          icon={AlertCircle}
          color='red'
        />
      </div>
    </div>
  );
});

AdminStatsComponent.displayName = 'AdminStats';

export default AdminStatsComponent;

