'use client';

import { IUser } from '@/lib/types';
import type { ServiceStats } from '@/lib/types';
import { USER_STATUSES } from '@/lib/constants';
import { useMemo } from 'react';

export function useServiceStats(providers: IUser[]): ServiceStats {
  return useMemo(() => {
    // Sécurité : s'assurer que providers est un tableau
    const safeProviders = providers || [];
    const activeProviders = safeProviders.filter(p => p.status === USER_STATUSES.ACTIVE);

    const specialties = [
      ...new Set(
        safeProviders
          .map(p => p.specialty)
          .filter((specialty): specialty is string => Boolean(specialty)),
      ),
    ].sort();

    const services = safeProviders
      .flatMap(p =>
        p.selectedServices ? p.selectedServices.map(s => s.trim()) : [],
      )
      .filter((service, idx, arr) => arr.indexOf(service) === idx)
      .sort();

    return {
      totalProviders: safeProviders.length,
      activeProviders: activeProviders.length,
      specialties,
      services,
    };
  }, [providers]);
}
