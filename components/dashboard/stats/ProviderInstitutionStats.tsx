'use client';

import React from 'react';
import { Users, Briefcase, DollarSign, Award } from 'lucide-react';
import DashboardStatCard from '../DashboardStatCard';
import type { ProviderInstitutionStats } from '@/hooks/statistics';

interface ProviderInstitutionStatsProps {
  stats: ProviderInstitutionStats;
}

const ProviderInstitutionStatsComponent = React.memo<ProviderInstitutionStatsProps>(
  function ProviderInstitutionStatsComponent({ stats }) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
        <DashboardStatCard
          title='Prestataires actifs'
          value={stats.activeProviders}
          icon={Users}
          color='blue'
        />
        <DashboardStatCard
          title='Missions en cours'
          value={stats.totalActiveMissions}
          icon={Briefcase}
          color='green'
        />
        <DashboardStatCard
          title='CA du mois'
          value={`${stats.monthlyRevenue.toFixed(2)} €`}
          icon={DollarSign}
          color='orange'
        />
        <DashboardStatCard
          title='Taux de satisfaction'
          value={`${stats.satisfactionRate.toFixed(1)}%`}
          icon={Award}
          color='yellow'
        />
        <DashboardStatCard
          title='Nouveaux ce mois'
          value={stats.newProvidersThisMonth}
          icon={Users}
          color='purple'
        />
      </div>
    );
  },
);

ProviderInstitutionStatsComponent.displayName = 'ProviderInstitutionStats';

export default ProviderInstitutionStatsComponent;

