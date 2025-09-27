import { useState, useEffect } from "react";

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

export const useProviders = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchProviders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/providers");
      
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
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  return {
    providers,
    loading,
    error,
    total,
    refetch: fetchProviders
  };
};
