import {
  IUser as Provider,
  UseProvidersOptions,
  UseProvidersReturn,
} from "@/types";
import { useEffect, useRef, useState } from "react";

// Cache mémoire simple (clé = JSON.stringify des options)
const providersCache: Record<string, Provider[]> = {};

export function useProviders(
  options: UseProvidersOptions = {}
): UseProvidersReturn {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (options.type) params.append("type", options.type);
      if (options.group) params.append("group", options.group);
      if (options.specialty) params.append("specialty", options.specialty);
      if (options.service) params.append("service", options.service);
      if (options.country) params.append("country", options.country);
      if (options.city) params.append("city", options.city);
      if (options.priceMax)
        params.append("priceMax", options.priceMax.toString());
      if (options.recommended) params.append("recommended", "true");
      if (options.sortBy) params.append("sortBy", options.sortBy);
      const cacheKey = params.toString();
      if (providersCache[cacheKey]) {
        setProviders(providersCache[cacheKey]);
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/providers?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des prestataires");
      }
      const data = await response.json();
      if (data.success) {
        setProviders(data.data);
        providersCache[cacheKey] = data.data;
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      console.error("Erreur useProviders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce sur les changements d'options avec protection contre les boucles
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProviders();
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Éviter les appels répétés quand il n'y a pas de providers
  useEffect(() => {
    if (providers.length === 0 && !loading && !error) {
      // Ne pas refaire d'appel si on vient de recevoir un tableau vide
      return;
    }
  }, [providers.length, loading, error]);

  return {
    providers,
    loading,
    error,
    refetch: fetchProviders,
  };
}
