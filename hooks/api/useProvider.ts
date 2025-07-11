import { Provider, UseProviderReturn } from "@/lib/definitions";
import { useEffect, useState } from "react";

export function useProvider(id: string | number): UseProviderReturn {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProvider = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/providers/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Prestataire non trouvé");
        }
        throw new Error("Erreur lors de la récupération du prestataire");
      }

      const data = await response.json();

      if (data.success) {
        setProvider(data.data);
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      console.error("Erreur useProvider:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProvider();
    }
  }, [id]);

  return {
    provider,
    loading,
    error,
    refetch: fetchProvider,
  };
}
