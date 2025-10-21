'use client';

import { IUser } from '@/types';
import { ServiceStats } from '@/types/services';
import { useMemo } from 'react';

export function useServiceStats(providers: IUser[]): ServiceStats {
  return useMemo(() => {
    // Sécurité : s'assurer que providers est un tableau
    const safeProviders = providers || [];
    const activeProviders = safeProviders.filter(p => p.status === 'ACTIVE');

    const specialties = [
      ...new Set(
        safeProviders
          .map(p => p.specialty)
          .filter((specialty): specialty is string => Boolean(specialty))
      ),
    ].sort();

    const services = safeProviders
      .flatMap(p =>
        p.selectedServices ? p.selectedServices.map(s => s.trim()) : []
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
