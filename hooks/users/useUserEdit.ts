'use client';

/**
 * Custom Hook pour modifier un utilisateur
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services (évite les imports MongoDB côté client)
 */

import { UserEditFormData } from '@/types/user';
import { useCallback, useState } from 'react';

/**
 * Custom Hook pour gérer la modification d'un utilisateur
 * Implémente le Custom Hooks Pattern
 */
export function useUserEdit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = useCallback(
    async (userId: string, data: Partial<UserEditFormData>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || "Erreur lors de la mise à jour de l'utilisateur"
          );
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Erreur inconnue');
        }

        return result.user;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        // Le logging est fait côté serveur via les services avec @Log decorator
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    updateUser,
    loading,
    error,
  };
}
