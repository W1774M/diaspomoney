'use client';

import React from 'react';
import { ShoppingCart, CheckCircle, DollarSign } from 'lucide-react';
import DashboardStatCard from '../DashboardStatCard';
import type { CustomerStats } from '@/hooks/statistics';

interface CustomerStatsProps {
  stats: CustomerStats;
}

const CustomerStatsComponent = React.memo<CustomerStatsProps>(function CustomerStatsComponent({
  stats,
}) {
  return (
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
        value={`${stats.totalSpent.toFixed(2)} €`}
        icon={DollarSign}
        color='orange'
      />
    </div>
  );
});

CustomerStatsComponent.displayName = 'CustomerStats';

export default CustomerStatsComponent;

