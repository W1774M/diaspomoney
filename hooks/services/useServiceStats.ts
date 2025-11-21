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
      .flatMap(p => {
        if (!p.selectedServices) return [];
        // Gérer le cas où selectedServices est une chaîne ou un tableau
        if (Array.isArray(p.selectedServices)) {
          return p.selectedServices.map(s => String(s).trim());
        }
        // Type assertion pour gérer les cas où selectedServices pourrait être une chaîne
        const servicesValue = p.selectedServices as unknown;
        if (typeof servicesValue === 'string' && servicesValue.length > 0) {
          return servicesValue.split(',').map(s => s.trim());
        }
        return [];
      })
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
