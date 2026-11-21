'use client';

import { useCallback, useState } from 'react';
import { useNotificationManager } from '@/components/ui/Notification';
import { logger } from '@/lib/logger';

export interface UseUserActionsReturn {
  deleteUser: (id: string) => Promise<boolean>;
  isDeleting: boolean;
}

/**
 * Hook pour les actions sur les utilisateurs (delete)
 * Implémente les design patterns :
 * - Custom Hooks Pattern
 * - Error Handling Pattern
 * - Notification Pattern
 */
export function useUserActions(
  onSuccess?: () => void | Promise<void>,
): UseUserActionsReturn {
  const { addSuccess, addError } = useNotificationManager();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteUser = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setIsDeleting(true);
        logger.info({ userId: id }, '[useUserActions] Suppression d\'utilisateur');

        // Appeler l'API pour supprimer l'utilisateur (anonymisation GDPR)
        const response = await fetch(`/api/users/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || "Erreur lors de la suppression de l'utilisateur";
          throw new Error(errorMessage);
        }

        const result = await response.json();

        // Afficher la notification de succès
        addSuccess(
          result.message || 'Utilisateur supprimé avec succès (anonymisé conformément au RGPD)',
          5000,
        );

        // Appeler le callback de succès
        await onSuccess?.();

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression de l'utilisateur";

        logger.error({ error, userId: id }, '[useUserActions] Erreur lors de la suppression');

        // Afficher la notification d'erreur
        addError(errorMessage, 5000);

        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [addSuccess, addError, onSuccess],
  );

  return {
    deleteUser,
    isDeleting,
  };
}

