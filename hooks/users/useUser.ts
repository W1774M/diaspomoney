'use client';

/**
 * Custom Hook pour récupérer un utilisateur par ID
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services (évite les imports MongoDB côté client)
 */

import { IUser } from '@/types';
import { useCallback, useState } from 'react';

/**
 * Custom Hook pour gérer la récupération d'un utilisateur
 * Implémente le Custom Hooks Pattern
 */
export function useUser() {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Utilisateur non trouvé');
        }
        throw new Error("Erreur lors de la récupération de l'utilisateur");
      }
      const data = await response.json();
      if (data.success && data.user) {
        // Convertir les dates string en Date objects
        const parsedUser: IUser = {
          ...data.user,
          createdAt: new Date(data.user.createdAt),
          updatedAt: new Date(data.user.updatedAt),
        };
        setUser(parsedUser);
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      // Le logging est fait côté serveur via les services avec @Log decorator
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    fetchUser,
  };
}
