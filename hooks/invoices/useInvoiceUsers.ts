'use client';

import { useCallback, useEffect, useState } from 'react';

interface UserOption {
  id: string;
  name: string;
  email?: string;
  label: string;
}

interface UseInvoiceUsersReturn {
  customers: UserOption[];
  providers: UserOption[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom Hook pour récupérer les clients et prestataires pour les factures
 * Implémente le Custom Hooks Pattern
 */
export function useInvoiceUsers(): UseInvoiceUsersReturn {
  const [customers, setCustomers] = useState<UserOption[]>([]);
  const [providers, setProviders] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer les clients
      const customersResponse = await fetch('/api/users?role=CUSTOMER&limit=100');
      if (!customersResponse.ok) {
        throw new Error('Erreur lors de la récupération des clients');
      }
      const customersData = await customersResponse.json();

      // Récupérer les prestataires
      const providersResponse = await fetch('/api/providers?limit=100');
      if (!providersResponse.ok) {
        throw new Error('Erreur lors de la récupération des prestataires');
      }
      const providersData = await providersResponse.json();

      // Transformer les clients
      const customersList: UserOption[] = (customersData.data || []).map(
        (user: any) => ({
          id: user._id || user.id,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client',
          email: user.email,
          label: `${user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Client'}${user.email ? ` - ${user.email}` : ''}`,
        }),
      );

      // Transformer les prestataires
      const providersList: UserOption[] = (providersData.data || []).map(
        (provider: any) => ({
          id: provider._id || provider.id,
          name: provider.name || `${provider.firstName || ''} ${provider.lastName || ''}`.trim() || 'Prestataire',
          email: provider.email,
          label: `${provider.name || `${provider.firstName || ''} ${provider.lastName || ''}`.trim() || 'Prestataire'}${provider.specialties?.length ? ` - ${provider.specialties[0]}` : ''}${provider.email ? ` (${provider.email})` : ''}`,
        }),
      );

      setCustomers(customersList);
      setProviders(providersList);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    customers,
    providers,
    loading,
    error,
    refetch: fetchUsers,
  };
}

