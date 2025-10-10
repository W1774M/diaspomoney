import { useCallback, useEffect, useState } from "react";

export interface Provider {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  status: string;
  specialties: string[];
  phone: string;
  address: string;
  city: string;
  country: string;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  [key: string]: any;
}

export interface ProviderFilters {
  category?: string;
  city?: string;
  specialty?: string;
  service?: string;
  minRating?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export const useProviders = (filters: ProviderFilters = {}) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchProviders = useCallback(
    async (customFilters?: ProviderFilters) => {
      setLoading(true);
      setError(null);

      try {
        const activeFilters = { ...filters, ...customFilters };
        const searchParams = new URLSearchParams();

        // Ajouter les paramètres de filtrage à l'URL
        Object.entries(activeFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, value.toString());
          }
        });

        const response = await fetch(
          `/api/providers?${searchParams.toString()}`
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des prestataires");
        }

        const data = await response.json();
        setProviders(data.providers);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return {
    providers,
    loading,
    error,
    total,
    refetch: fetchProviders,
  };
};
