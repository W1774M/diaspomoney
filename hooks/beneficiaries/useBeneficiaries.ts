'use client';

/**
 * Custom Hook pour les bénéficiaires — thin API client via fetchJson.
 */

import { fetchJson } from '@/lib/api/fetchJson';
import { logger } from '@/lib/logger';
import type { Beneficiary } from '@/lib/types';
import type {
  CreateBeneficiaryData,
  UpdateBeneficiaryData,
  UseBeneficiariesReturn,
} from '@/lib/types/hooks.types';
import { useCallback, useEffect, useState } from 'react';

export function useBeneficiaries(): UseBeneficiariesReturn & {
  isLoading: boolean;
} {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBeneficiaries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchJson<{
        success?: boolean;
        data?: Beneficiary[];
        error?: string;
      }>('/api/beneficiaries');

      if (!data.success) {
        throw new Error(
          data.error || 'Erreur lors de la récupération des bénéficiaires',
        );
      }
      setBeneficiaries(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      logger.error({ error: err }, 'Erreur fetchBeneficiaries:');
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBeneficiary = useCallback(
    async (
      beneficiaryData: CreateBeneficiaryData,
    ): Promise<Beneficiary | null> => {
      try {
        setError(null);

        const result = await fetchJson<{
          data?: Beneficiary;
          beneficiary?: Beneficiary;
        }>('/api/beneficiaries', {
          method: 'POST',
          body: JSON.stringify(beneficiaryData),
        });

        const newBeneficiary = result.data || result.beneficiary;
        if (!newBeneficiary) {
          throw new Error('Erreur lors de la création du bénéficiaire');
        }

        setBeneficiaries(prev => [newBeneficiary, ...prev]);
        return newBeneficiary;
      } catch (err) {
        logger.error({ error: err }, 'Erreur createBeneficiary:');
        setError(
          err instanceof Error ? err.message : 'Erreur lors de la création',
        );
        return null;
      }
    },
    [],
  );

  const updateBeneficiary = useCallback(
    async (
      beneficiaryId: string,
      beneficiaryData: UpdateBeneficiaryData,
    ): Promise<Beneficiary | null> => {
      try {
        setError(null);

        const result = await fetchJson<{
          data?: Beneficiary;
          beneficiary?: Beneficiary;
        }>(`/api/beneficiaries/${beneficiaryId}`, {
          method: 'PUT',
          body: JSON.stringify(beneficiaryData),
        });

        const updatedBeneficiary = result.data || result.beneficiary;
        if (!updatedBeneficiary) {
          throw new Error('Erreur lors de la mise à jour du bénéficiaire');
        }

        setBeneficiaries(prev =>
          prev.map(beneficiary =>
            beneficiary._id === beneficiaryId ? updatedBeneficiary : beneficiary,
          ),
        );

        return updatedBeneficiary;
      } catch (err) {
        logger.error({ error: err }, 'Erreur updateBeneficiary:');
        setError(
          err instanceof Error ? err.message : 'Erreur lors de la mise à jour',
        );
        return null;
      }
    },
    [],
  );

  const deleteBeneficiary = useCallback(
    async (beneficiaryId: string): Promise<boolean> => {
      try {
        setError(null);

        await fetchJson(`/api/beneficiaries/${beneficiaryId}`, {
          method: 'DELETE',
        });

        setBeneficiaries(prev =>
          prev.filter(beneficiary => beneficiary._id !== beneficiaryId),
        );

        return true;
      } catch (err) {
        logger.error({ error: err }, 'Erreur deleteBeneficiary:');
        setError(
          err instanceof Error ? err.message : 'Erreur lors de la suppression',
        );
        return false;
      }
    },
    [],
  );

  const refreshBeneficiaries = useCallback(async () => {
    await fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  useEffect(() => {
    fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  return {
    beneficiaries,
    isLoading,
    loading: isLoading,
    error,
    createBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
    refreshBeneficiaries,
  };
}
