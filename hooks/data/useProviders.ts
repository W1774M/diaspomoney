import { ProviderType } from "@/lib/definitions";
import { useEffect, useState } from "react";

interface UseProvidersOptions {
  type?: string;
  group?: string; // Nouveau paramètre pour le groupe
  specialty?: string;
  service?: string;
  country?: string;
  city?: string;
  priceMax?: number;
  recommended?: boolean;
  sortBy?: string;
}

interface UseProvidersReturn {
  providers: ProviderType[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProviders(
  options: UseProvidersOptions = {}
): UseProvidersReturn {
  const [providers, setProviders] = useState<ProviderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const response = await fetch(`/api/providers?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des prestataires");
      }

      const data = await response.json();

      if (data.success) {
        setProviders(data.data);
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

  useEffect(() => {
    fetchProviders();
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

  return {
    providers,
    loading,
    error,
    refetch: fetchProviders,
  };
}
