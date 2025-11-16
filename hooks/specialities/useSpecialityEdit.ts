'use client';

/**
 * Custom Hook pour mettre à jour une spécialité
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services
 */

import { ISpeciality } from '@/types';
import { useCallback, useState } from 'react';

export interface UseSpecialityEditReturn {
  updateSpeciality: (
    id: string,
    data: Partial<ISpeciality>
  ) => Promise<ISpeciality>;
  loading: boolean;
  error: string | null;
}

/**
 * Custom Hook pour gérer la mise à jour d'une spécialité
 * Implémente le Custom Hooks Pattern
 */
export function useSpecialityEdit(): UseSpecialityEditReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSpeciality = useCallback(
    async (id: string, data: Partial<ISpeciality>): Promise<ISpeciality> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/specialities/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Spécialité non trouvée');
          }
          if (response.status === 403) {
            throw new Error('Permissions insuffisantes');
          }
          if (response.status === 409) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || 'Conflit lors de la mise à jour'
            );
          }
          throw new Error('Erreur lors de la mise à jour de la spécialité');
        }

        const result = await response.json();

        if (result.success && result.speciality) {
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
          return specialityData;
        } else {
          throw new Error(result.error || 'Erreur inconnue');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        // Le logging est fait côté serveur via SpecialityService avec @Log decorator
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    updateSpeciality,
    loading,
    error,
  };
}
