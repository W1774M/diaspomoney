'use client';

import { useMemo } from 'react';

export interface CsmStats {
  managedOrders: number;
  assignedClients: number;
  coordinatedProviders: number;
  satisfactionRate: number;
  resolvedTickets: number;
}

interface UseCsmStatsParams {
  userId?: string;
  enabled: boolean;
}

export function useCsmStats({ userId, enabled }: UseCsmStatsParams) {
  const stats = useMemo<CsmStats | null>(() => {
    if (!enabled || !userId) return null;

    // TODO: À remplacer par vraies données depuis l'API
    return {
      managedOrders: 0,
      assignedClients: 0,
      coordinatedProviders: 0,
      satisfactionRate: 0,
      resolvedTickets: 0,
    };
  }, [userId, enabled]);

  return stats;
}

