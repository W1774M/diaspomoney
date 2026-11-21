import { useCallback, useEffect, useRef, useState } from "react";

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

export interface UseProvidersReturn {
  providers: Provider[];
  loading: boolean;
  error: string | null;
  total: number;
  hasResults: boolean;
  refetch: () => void;
}

// Cache global pour éviter les appels répétés
const cache = new Map<string, { data: Provider[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useProvidersOptimized = (filters: ProviderFilters = {}): UseProvidersReturn => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasResults, setHasResults] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFiltersRef = useRef<string>("");

  const fetchProviders = useCallback(async () => {
    // Créer une clé de cache basée sur les filtres
    const filtersKey = JSON.stringify(filters);
    
    // Vérifier si on a déjà les mêmes filtres
    if (filtersKey === lastFiltersRef.current && hasInitialized) {
      return;
    }
    
    // Vérifier le cache
    const cached = cache.get(filtersKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setProviders(cached.data);
      setTotal(cached.data.length);
      setHasResults(cached.data.length > 0);
      setHasInitialized(true);
      setLoading(false);
      return;
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau AbortController
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    lastFiltersRef.current = filtersKey;

    try {
      const searchParams = new URLSearchParams();
      
      // Ajouter les paramètres de filtrage à l'URL
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(
        `/api/providers?${searchParams.toString()}`,
        { signal: abortControllerRef.current.signal },
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des prestataires");
      }

      const data = await response.json();
      
      if (data.success) {
        const providersData = data.providers || [];
        setProviders(providersData);
        setTotal(data.total || 0);
        setHasResults(data.hasResults || providersData.length > 0);
        
        // Mettre en cache
        cache.set(filtersKey, {
          data: providersData,
          timestamp: Date.now(),
        });
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Requête annulée, ne pas traiter comme une erreur
        return;
      }
      setError(error instanceof Error ? error.message : "Erreur inconnue");
      setProviders([]);
      setTotal(0);
      setHasResults(false);
    } finally {
      setLoading(false);
      setHasInitialized(true);
    }
  }, [filters, hasInitialized]);

  // Effet pour déclencher le fetch initial
  useEffect(() => {
    if (!hasInitialized) {
      fetchProviders();
    }
  }, [fetchProviders, hasInitialized]);

  // Nettoyage à la destruction du composant
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    providers,
    loading,
    error,
    total,
    hasResults,
    refetch: fetchProviders,
  };
};
