'use client';

import { useMemo } from 'react';

export interface ProviderInstitutionStats {
  activeProviders: number;
  totalActiveMissions: number;
  monthlyRevenue: number;
  satisfactionRate: number;
  newProvidersThisMonth: number;
}

interface UseProviderInstitutionStatsParams {
  userId?: string;
  enabled: boolean;
  providerInfo?: {
    type?: string;
  };
}

export function useProviderInstitutionStats({
  userId,
  enabled,
  providerInfo,
}: UseProviderInstitutionStatsParams) {
  const stats = useMemo<ProviderInstitutionStats | null>(() => {
    if (!enabled || providerInfo?.type !== 'INSTITUTION' || !userId) return null;

    // TODO: À remplacer par vraies données depuis l'API
    return {
      activeProviders: 0,
      totalActiveMissions: 0,
      monthlyRevenue: 0,
      satisfactionRate: 0,
      newProvidersThisMonth: 0,
    };
  }, [userId, enabled, providerInfo]);

  return stats;
}

