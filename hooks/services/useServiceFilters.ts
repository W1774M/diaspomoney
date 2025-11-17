'use client';
/**
 * useServiceFilters Hook
 * Implémente les design patterns :
 * - Custom Hooks Pattern
 * - Filter Pattern
 */

import { getProviderRatingStats } from '@/mocks';
import { IUser } from '@/types';
import { ServiceFilters } from '@/types/services';
import { useCallback, useMemo, useState } from 'react';

export function useServiceFilters(providers: IUser[]) {
  const [filters, setFilters] = useState<ServiceFilters>({
    service: '',
    city: '',
    specialty: '',
    rating: 0,
    category: '',
  });

  // Sécurité : s'assurer que providers est un tableau
  const safeProviders = providers || [];

  // Extract unique data from providers
  const availableServices = useMemo(() => {
    return safeProviders
      .flatMap(p =>
        p.selectedServices
          ? p.selectedServices.map((s: string) => s.trim())
          : []
      )
      .filter((service): service is string => Boolean(service))
      .filter((service, idx, arr) => arr.indexOf(service) === idx)
      .sort();
  }, [safeProviders]);

  const availableSpecialties = useMemo(() => {
    return [
      ...new Set(
        safeProviders
          .map(p => p.specialty)
          .filter((specialty): specialty is string => Boolean(specialty))
      ),
    ].sort();
  }, [safeProviders]);

  const availableCities = useMemo(() => {
    return [
      ...new Set(
        safeProviders
          .map(p => p.address)
          .filter((address): address is string => Boolean(address))
      ),
    ].sort();
  }, [safeProviders]);

  // Filter providers based on current filters
  const filteredProviders = useMemo(() => {
    const result = safeProviders.filter(provider => {
      // Service filter
      if (
        filters.service &&
        !provider.selectedServices
          ?.join(',')
          .toLowerCase()
          .includes(filters.service.toLowerCase())
      ) {
        return false;
      }

      // City filter
      if (
        filters.city &&
        !provider.address?.toLowerCase().includes(filters.city.toLowerCase())
      ) {
        return false;
      }

      // Specialty filter
      if (filters.specialty && provider.specialty !== filters.specialty) {
        return false;
      }

      // Rating filter - utiliser les statistiques de rating dynamiques
      if (filters.rating > 0) {
        const ratingStats = getProviderRatingStats(provider._id);
        if ((ratingStats as any).averageRating < filters.rating) {
          return false;
        }
      }

      // Category filter
      if (filters.category && provider.category !== filters.category) {
        return false;
      }

      return true;
    });

    return result;
  }, [safeProviders, filters]);

  const updateFilter = useCallback(
    (key: keyof ServiceFilters, value: string | number) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({
      service: '',
      city: '',
      specialty: '',
      rating: 0,
      category: '',
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value =>
      typeof value === 'string' ? value.length > 0 : value > 0
    );
  }, [filters]);

  return {
    filters,
    filteredProviders,
    availableServices,
    availableSpecialties,
    availableCities,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
}
