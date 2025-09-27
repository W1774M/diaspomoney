import { useState, useEffect } from "react";

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
      const searchParams = new URLSearchParams();
      
      if (options.role) searchParams.append("role", options.role);
      if (options.status) searchParams.append("status", options.status);
      if (options.limit) searchParams.append("limit", options.limit.toString());
      if (options.offset) searchParams.append("offset", options.offset.toString());

      const response = await fetch(`/api/users?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des utilisateurs");
      }

      const data = await response.json();
      setUsers(data.data);
      setTotal(data.total);
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
    refetch: fetchUsers
  };
};
