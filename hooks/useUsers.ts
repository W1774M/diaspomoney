import { QueryOptimizer } from "@/lib/database/query-optimizer";
import { useEffect, useState } from "react";

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
  limit?: number | undefined;
  offset?: number | undefined;
}

export const useUsers = (options: UseUsersOptions = {}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Utiliser QueryOptimizer avec cache
      const filters = {
        ...(options.role && { roles: { $in: [options.role] } }),
        ...(options.status && { status: options.status }),
      };

      const result = await QueryOptimizer.getUsersList(filters);
      setUsers(result || []);
      setTotal(result?.length || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [options.role, options.status, options.limit, options.offset]);

  return {
    users,
    loading,
    error,
    total,
    refetch: fetchUsers,
  };
};
