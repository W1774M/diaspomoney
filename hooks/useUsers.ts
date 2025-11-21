import { useEffect, useState, useMemo, useCallback } from "react";

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  status: string;
  createdAt: Date;
  [key: string]: any;
}

export interface UseUsersOptions {
  role?: string | undefined;
  status?: string | undefined;
  search?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
  page?: number | undefined;
}

export const useUsers = (options: UseUsersOptions = {}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Mémoriser les options pour éviter les re-renders inutiles
  const memoizedOptions = useMemo(() => options, [
    options.role,
    options.status,
    options.search,
    options.limit,
    options.offset,
    options.page,
  ]);

  // Fonction pour récupérer les utilisateurs
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (memoizedOptions.role) params.append('role', memoizedOptions.role);
      if (memoizedOptions.status) params.append('status', memoizedOptions.status);
      if (memoizedOptions.search) params.append('search', memoizedOptions.search);
      if (memoizedOptions.limit) params.append('limit', memoizedOptions.limit.toString());
      // L'API attend 'page' plutôt que 'offset'
      if (memoizedOptions.page) {
        params.append('page', memoizedOptions.page.toString());
      } else if (memoizedOptions.offset !== undefined && memoizedOptions.limit) {
        // Convertir offset en page si nécessaire
        const page = Math.floor(memoizedOptions.offset / memoizedOptions.limit) + 1;
        params.append('page', page.toString());
      }

      // Appeler l'API route au lieu d'importer directement QueryOptimizer
      const response = await fetch(`/api/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
        setTotal(data.total || 0);
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [memoizedOptions]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    total,
    refetch: fetchUsers,
  };
};
