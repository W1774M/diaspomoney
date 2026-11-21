'use client';

import React from 'react';
import { Briefcase, CheckCircle, DollarSign, Star } from 'lucide-react';
import DashboardStatCard from '../DashboardStatCard';
import type { ProviderIndividualStats } from '@/hooks/statistics';

interface ProviderIndividualStatsProps {
  stats: ProviderIndividualStats;
}

const ProviderIndividualStatsComponent = React.memo<ProviderIndividualStatsProps>(
  function ProviderIndividualStatsComponent({ stats }) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
        <DashboardStatCard
          title='Commandes en cours'
          value={stats.activeOrders}
          icon={Briefcase}
          color='blue'
        />
        <DashboardStatCard
          title='Commandes terminées'
          value={stats.completedOrders}
          icon={CheckCircle}
          color='green'
        />
        <DashboardStatCard
          title='Montant perçu (mois)'
          value={`${stats.revenueThisMonth.toFixed(2)} €`}
          icon={DollarSign}
          color='orange'
        />
        <DashboardStatCard
          title='Montant total perçu'
          value={`${stats.totalRevenue.toFixed(2)} €`}
          icon={DollarSign}
          color='green'
        />
        <DashboardStatCard
          title='Note moyenne'
          value={`${stats.averageRating.toFixed(1)}/5`}
          icon={Star}
          color='yellow'
          description={`${stats.reviewCount} avis`}
        />
      </div>
    );
  },
);

ProviderIndividualStatsComponent.displayName = 'ProviderIndividualStats';

export default ProviderIndividualStatsComponent;

