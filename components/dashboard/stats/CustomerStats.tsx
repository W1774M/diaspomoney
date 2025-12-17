'use client';

import React from 'react';
import { ShoppingCart, CheckCircle, DollarSign, Heart } from 'lucide-react';
import DashboardStatCard from '../DashboardStatCard';
import type { CustomerStats } from '@/hooks/statistics';

interface CustomerStatsProps {
  stats: CustomerStats;
}

const CustomerStatsComponent = React.memo<CustomerStatsProps>(function CustomerStatsComponent({
  stats,
}) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
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
      <DashboardStatCard
        title='Prestataires favoris'
        value={stats.favoriteProviders.length}
        icon={Heart}
        color='red'
      />
    </div>
  );
});

CustomerStatsComponent.displayName = 'CustomerStats';

export default CustomerStatsComponent;

