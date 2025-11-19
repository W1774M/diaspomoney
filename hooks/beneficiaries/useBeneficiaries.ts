'use client';

/**
 * Custom Hook pour les bénéficiaires
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services
 */

import { logger } from '@/lib/logger';
import type { Beneficiary } from '@/lib/types';
import type {
  UseBeneficiariesReturn,
  CreateBeneficiaryData,
  UpdateBeneficiaryData,
} from '@/lib/types/hooks.types';
import { useCallback, useEffect, useState } from 'react';

/**
 * Custom Hook pour gérer les bénéficiaires
 * Implémente le Custom Hooks Pattern
 */
export function useBeneficiaries(): UseBeneficiariesReturn {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer tous les bénéficiaires
  const fetchBeneficiaries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/beneficiaries');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Erreur lors de la récupération des bénéficiaires',
        );
      }

      const data = await response.json();
      setBeneficiaries(data.beneficiaries || []);
    } catch (error) {
      logger.error({ error }, 'Erreur fetchBeneficiaries:');
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer un nouveau bénéficiaire
  const createBeneficiary = useCallback(
    async (
      beneficiaryData: CreateBeneficiaryData,
    ): Promise<Beneficiary | null> => {
      try {
        setError(null);

        const response = await fetch('/api/beneficiaries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(beneficiaryData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Erreur lors de la création du bénéficiaire',
          );
        }

        const result = await response.json();
        const newBeneficiary = result.beneficiary;

        // Ajouter à la liste locale
        setBeneficiaries(prev => [newBeneficiary, ...prev]);

        return newBeneficiary;
      } catch (error) {
        logger.error({ error }, 'Erreur createBeneficiary:');
        setError(
          error instanceof Error ? error.message : 'Erreur lors de la création',
        );
        return null;
      }
    },
    [],
  );

  // Mettre à jour un bénéficiaire
  const updateBeneficiary = useCallback(
    async (
      beneficiaryId: string,
      beneficiaryData: UpdateBeneficiaryData,
    ): Promise<Beneficiary | null> => {
      try {
        setError(null);

        const response = await fetch(`/api/beneficiaries/${beneficiaryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(beneficiaryData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Erreur lors de la mise à jour du bénéficiaire',
          );
        }

        const result = await response.json();
        const updatedBeneficiary = result.beneficiary;

        // Mettre à jour dans la liste locale
        setBeneficiaries(prev =>
          prev.map(beneficiary =>
            beneficiary._id === beneficiaryId ? updatedBeneficiary : beneficiary,
          ),
        );

        return updatedBeneficiary;
      } catch (error) {
        logger.error({ error }, 'Erreur updateBeneficiary:');
        setError(
          error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
        );
        return null;
      }
    },
    [],
  );

  // Supprimer un bénéficiaire
  const deleteBeneficiary = useCallback(
    async (beneficiaryId: string): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch(`/api/beneficiaries/${beneficiaryId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Erreur lors de la suppression du bénéficiaire',
          );
        }

        // Supprimer de la liste locale
        setBeneficiaries(prev =>
          prev.filter(beneficiary => beneficiary._id !== beneficiaryId),
        );

        return true;
      } catch (error) {
        logger.error({ error }, 'Erreur deleteBeneficiary:');
        setError(
          error instanceof Error ? error.message : 'Erreur lors de la suppression',
        );
        return false;
      }
    },
    [],
  );

  // Rafraîchir la liste
  const refreshBeneficiaries = useCallback(async () => {
    await fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  // Charger les bénéficiaires au montage du composant
  useEffect(() => {
    fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  return {
    beneficiaries,
    loading,
    error,
    createBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
    refreshBeneficiaries,
  };
}
