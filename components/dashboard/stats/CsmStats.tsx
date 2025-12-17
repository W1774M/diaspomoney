'use client';

import React from 'react';
import { ShoppingCart, Users, Briefcase, Award, CheckCircle } from 'lucide-react';
import DashboardStatCard from '../DashboardStatCard';
import type { CsmStats } from '@/hooks/statistics';

interface CsmStatsProps {
  stats: CsmStats;
}

const CsmStatsComponent = React.memo<CsmStatsProps>(function CsmStatsComponent({ stats }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
      <DashboardStatCard
        title='Commandes gérées'
        value={stats.managedOrders}
        icon={ShoppingCart}
        color='blue'
      />
      <DashboardStatCard
        title='Clients assignés'
        value={stats.assignedClients}
        icon={Users}
        color='green'
      />
      <DashboardStatCard
        title='Prestataires coordonnés'
        value={stats.coordinatedProviders}
        icon={Briefcase}
        color='orange'
      />
      <DashboardStatCard
        title='Taux de satisfaction'
        value={`${stats.satisfactionRate.toFixed(1)}%`}
        icon={Award}
        color='yellow'
      />
      <DashboardStatCard
        title='Tickets résolus'
        value={stats.resolvedTickets}
        icon={CheckCircle}
        color='purple'
      />
    </div>
  );
});

CsmStatsComponent.displayName = 'CsmStats';

export default CsmStatsComponent;

