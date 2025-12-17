'use client';

import React from 'react';
import { Briefcase, CheckCircle, DollarSign, Star, TrendingUp } from 'lucide-react';
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
          title='Missions en cours'
          value={stats.activeMissions}
          icon={Briefcase}
          color='blue'
        />
        <DashboardStatCard
          title='Complétées ce mois'
          value={stats.completedThisMonth}
          icon={CheckCircle}
          color='green'
        />
        <DashboardStatCard
          title='Revenu ce mois'
          value={`${stats.revenueThisMonth.toFixed(2)} €`}
          icon={DollarSign}
          color='orange'
        />
        <DashboardStatCard
          title='Note moyenne'
          value={`${stats.averageRating.toFixed(1)}/5`}
          icon={Star}
          color='yellow'
          description={`${stats.reviewCount} avis`}
        />
        <DashboardStatCard
          title="Taux d'acceptation"
          value={`${stats.acceptanceRate.toFixed(1)}%`}
          icon={TrendingUp}
          color='purple'
        />
      </div>
    );
  },
);

ProviderIndividualStatsComponent.displayName = 'ProviderIndividualStats';

export default ProviderIndividualStatsComponent;

