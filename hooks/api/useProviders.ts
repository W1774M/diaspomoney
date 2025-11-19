import type { IUser as Provider } from '@/lib/types';
import { useCallback, useEffect, useRef, useState } from 'react';

// Simple in-memory cache (key = JSON.stringify(options))
const providersCache: Record<string, Provider[]> = {};

export function useProviders(
  options: any = {
    type: undefined,
    group: undefined,
    specialty: undefined,
    service: undefined,
    country: undefined,
    city: undefined,
    priceMax: undefined,
  },
): any {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create params key based on all possible options
  // const _getCacheKey = useCallback((): string => {
  //   // Only include defined fields to prevent cache pollution
  //   const entries = Object.entries(options).filter(
  //     ([, v]) => v !== undefined && v !== null && v !== ''
  //   );
  //   return new URLSearchParams(entries as [string, string][]).toString();
  // }, [options]);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (options.type) params.append('type', options.type);
    if (options.group) params.append('group', options.group);
    if (options.specialty) params.append('specialty', options.specialty);
    if (options.service) params.append('service', options.service);
    if (options.country) params.append('country', options.country);
    if (options.city) params.append('city', options.city);
    if (options.priceMax !== undefined && options.priceMax !== null)
      params.append('priceMax', String(options.priceMax));
    if (options.recommended) params.append('recommended', 'true');
    if (options.sortBy) params.append('sortBy', options.sortBy);

    const cacheKey = params.toString();
    if (providersCache[cacheKey]) {
      setProviders(providersCache[cacheKey]);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/providers?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des prestataires');
      }
      const data = await response.json();
      if (data?.success && Array.isArray(data.data)) {
        setProviders(data.data);
        providersCache[cacheKey] = data.data;
      } else {
        throw new Error(data?.error || 'Erreur inconnue');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur useProviders:', err);
      }
    } finally {
      setLoading(false);
    }
    // it's ok to not include providersCache or setProviders as dependencies
  }, [
    options.type,
    options.group,
    options.specialty,
    options.service,
    options.country,
    options.city,
    options.priceMax,
    options.recommended,
    options.sortBy,
  ]);

  // Debounce fetching providers on options change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProviders();
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchProviders]);

  // Prevent unneeded calls when there are no providers, loading is false, and there is no error.
  // This effect is now redundant with our debounce/fetch logic and can be safely omitted,
  // but kept here in case of business logic extension.
  useEffect(() => {
    // Intentionally left blank, reserved for future enhancements.
    // Could trigger a re-fetch if needed by business rules.
    // if (providers.length === 0 && !loading && !error) {
    //   return;
    // }
  }, [providers.length, loading, error]);

  return {
    providers,
    loading,
    error,
    refetch: fetchProviders,
  };
}
