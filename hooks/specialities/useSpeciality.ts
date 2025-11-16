'use client';

/**
 * Custom Hook pour récupérer une spécialité par ID
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services
 */

import { ISpeciality } from '@/types';
import { UseSpecialityReturn } from '@/types/hooks';
import { useCallback, useState } from 'react';

/**
 * Custom Hook pour gérer une spécialité
 * Implémente le Custom Hooks Pattern
 */
export function useSpeciality(): UseSpecialityReturn {
  const [speciality, setSpeciality] = useState<ISpeciality | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpeciality = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/specialities/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Spécialité non trouvée');
        }
        throw new Error('Erreur lors de la récupération de la spécialité');
      }

      const data = await response.json();

      if (data.success && data.speciality) {
        // Transformer les dates string en objets Date
        const specialityData: ISpeciality = {
          ...data.speciality,
          createdAt: data.speciality.createdAt
            ? new Date(data.speciality.createdAt)
            : new Date(),
          updatedAt: data.speciality.updatedAt
            ? new Date(data.speciality.updatedAt)
            : new Date(),
        };
        setSpeciality(specialityData);
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      // Le logging est fait côté serveur via SpecialityService avec @Log decorator
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSpeciality = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/specialities/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Spécialité non trouvée');
        }
        throw new Error('Erreur lors de la suppression');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur inconnue');
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
  }, []);

  return {
    speciality,
    loading,
    error,
    fetchSpeciality,
    deleteSpeciality,
  };
}
