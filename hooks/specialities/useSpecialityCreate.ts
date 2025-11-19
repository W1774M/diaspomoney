/**
 * Hook personnalisé pour créer une spécialité
 * Implémente les design patterns :
 * - Custom Hooks Pattern
 * - Error Handling Pattern (Sentry côté client)
 * - Service Layer Pattern (abstraction de l'API)
 */

import { useNotificationManager } from '@/components/ui/Notification';
import type { ISpeciality } from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import { useCallback, useState } from 'react';

export interface UseSpecialityCreateReturn {
  createSpeciality: (data: Partial<ISpeciality>) => Promise<ISpeciality | null>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour créer une spécialité
 */
export function useSpecialityCreate(): UseSpecialityCreateReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addSuccess, addError } = useNotificationManager();

  const createSpeciality = useCallback(
    async (data: Partial<ISpeciality>): Promise<ISpeciality | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/specialities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error ||
            (response.status === 400
              ? 'Données invalides'
              : response.status === 401
              ? 'Non autorisé'
              : response.status === 403
              ? 'Permissions insuffisantes'
              : response.status === 409
              ? 'Une spécialité avec ce nom existe déjà'
              : "Erreur lors de la création de la spécialité");

          setError(errorMessage);
          addError(errorMessage);

          // Capturer les erreurs critiques avec Sentry
          if (response.status >= 500) {
            Sentry.captureException(new Error(errorMessage), {
              tags: {
                component: 'useSpecialityCreate',
                action: 'createSpeciality',
                status: response.status,
              },
              extra: { data, errorData },
            });
          }

          return null;
        }

        const result = await response.json();

        if (!result.success || !result.speciality) {
          const errorMessage = result.error || 'Données invalides reçues du serveur';
          setError(errorMessage);
          addError(errorMessage);
          return null;
        }

        // Transformer les dates string en objets Date
        const specialityData: ISpeciality = {
          ...result.speciality,
          createdAt: result.speciality.createdAt
            ? new Date(result.speciality.createdAt)
            : new Date(),
          updatedAt: result.speciality.updatedAt
            ? new Date(result.speciality.updatedAt)
            : new Date(),
        };

        addSuccess('Spécialité créée avec succès !');
        return specialityData;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur inconnue';
        setError(errorMessage);
        addError("Erreur lors de la création de la spécialité");

        // Capturer l'erreur avec Sentry
        Sentry.captureException(
          error instanceof Error ? error : new Error(errorMessage),
          {
            tags: {
              component: 'useSpecialityCreate',
              action: 'createSpeciality',
            },
            extra: { data },
          },
        );

        return null;
      } finally {
        setLoading(false);
      }
    },
    [addSuccess, addError],
  );

  return {
    createSpeciality,
    loading,
    error,
  };
}

