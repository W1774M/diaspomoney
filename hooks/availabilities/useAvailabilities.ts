'use client';

/**
 * Custom Hook pour les règles de disponibilité
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services
 */

import { logger } from '@/lib/logger';
import type { AvailabilityRule } from '@/lib/types/availability.types';
import { useCallback, useEffect, useState } from 'react';

interface UseAvailabilitiesReturn {
  availabilities: AvailabilityRule[];
  loading: boolean;
  error: string | null;
  createAvailabilityRule: (
    ruleData: CreateAvailabilityRuleData,
  ) => Promise<AvailabilityRule | null>;
  updateAvailabilityRule: (
    ruleId: string,
    ruleData: UpdateAvailabilityRuleData,
  ) => Promise<AvailabilityRule | null>;
  deleteAvailabilityRule: (ruleId: string) => Promise<boolean>;
  toggleAvailabilityRuleStatus: (ruleId: string) => Promise<boolean>;
  refreshAvailabilities: (type?: 'weekly' | 'monthly' | 'custom') => Promise<void>;
}

export interface CreateAvailabilityRuleData {
  name: string;
  type: 'weekly' | 'monthly' | 'custom';
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  timeSlots: Array<{
    id?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>;
  timezone?: string;
}

export interface UpdateAvailabilityRuleData {
  name?: string;
  type?: 'weekly' | 'monthly' | 'custom';
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  timeSlots?: Array<{
    id?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>;
  timezone?: string;
}

/**
 * Custom Hook pour gérer les règles de disponibilité
 * Implémente le Custom Hooks Pattern
 */
export function useAvailabilities(
  type?: 'weekly' | 'monthly' | 'custom',
): UseAvailabilitiesReturn {
  const [availabilities, setAvailabilities] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer toutes les règles de disponibilité
  const fetchAvailabilities = useCallback(
    async (filterType?: 'weekly' | 'monthly' | 'custom') => {
      try {
        setLoading(true);
        setError(null);

        const url = filterType
          ? `/api/availabilities?type=${filterType}`
          : '/api/availabilities';

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          logger.error(
            { error: errorData.error, status: response.status },
            'API Error during availabilities fetch',
          );
          throw new Error(
            errorData.error || 'Erreur lors de la récupération des disponibilités',
          );
        }

        const result = await response.json();

        if (result.success && result.data) {
          logger.info(
            { count: result.data.length, type: filterType },
            'Availabilities fetched successfully',
          );
          setAvailabilities(result.data);
        } else {
          throw new Error('Format de réponse invalide');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        logger.error({ error: err, type: filterType }, 'Error fetching availabilities');
        setAvailabilities([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Créer une nouvelle règle de disponibilité
  const createAvailabilityRule = useCallback(
    async (
      ruleData: CreateAvailabilityRuleData,
    ): Promise<AvailabilityRule | null> => {
      try {
        setError(null);

        const response = await fetch('/api/availabilities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ruleData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          logger.error(
            { error: errorData.error, status: response.status },
            'API Error during availability rule creation',
          );
          throw new Error(
            errorData.error || 'Erreur lors de la création de la règle',
          );
        }

        const result = await response.json();

        if (result.success && result.data) {
          logger.info(
            { ruleId: result.data.id, name: result.data.name },
            'Availability rule created successfully',
          );
          // Rafraîchir la liste
          await fetchAvailabilities(type);
          return result.data;
        } else {
          throw new Error('Format de réponse invalide');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        logger.error({ error: err, ruleData }, 'Error creating availability rule');
        return null;
      }
    },
    [fetchAvailabilities, type],
  );

  // Mettre à jour une règle de disponibilité
  const updateAvailabilityRule = useCallback(
    async (
      ruleId: string,
      ruleData: UpdateAvailabilityRuleData,
    ): Promise<AvailabilityRule | null> => {
      try {
        setError(null);

        const response = await fetch(`/api/availabilities/${ruleId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ruleData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          logger.error(
            { error: errorData.error, status: response.status },
            'API Error during availability rule update',
          );
          throw new Error(
            errorData.error || 'Erreur lors de la mise à jour de la règle',
          );
        }

        const result = await response.json();

        if (result.success && result.data) {
          logger.info(
            { ruleId, name: result.data.name },
            'Availability rule updated successfully',
          );
          // Rafraîchir la liste
          await fetchAvailabilities(type);
          return result.data;
        } else {
          throw new Error('Format de réponse invalide');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        logger.error(
          { error: err, ruleId, ruleData },
          'Error updating availability rule',
        );
        return null;
      }
    },
    [fetchAvailabilities, type],
  );

  // Supprimer une règle de disponibilité
  const deleteAvailabilityRule = useCallback(
    async (ruleId: string): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch(`/api/availabilities/${ruleId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          logger.error(
            { error: errorData.error, status: response.status },
            'API Error during availability rule deletion',
          );
          throw new Error(
            errorData.error || 'Erreur lors de la suppression de la règle',
          );
        }

        const result = await response.json();

        if (result.success) {
          logger.info({ ruleId }, 'Availability rule deleted successfully');
          // Rafraîchir la liste
          await fetchAvailabilities(type);
          return true;
        } else {
          throw new Error('Format de réponse invalide');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        logger.error({ error: err, ruleId }, 'Error deleting availability rule');
        return false;
      }
    },
    [fetchAvailabilities, type],
  );

  // Basculer le statut actif/inactif d'une règle
  const toggleAvailabilityRuleStatus = useCallback(
    async (ruleId: string): Promise<boolean> => {
      try {
        const rule = availabilities.find(r => r.id === ruleId);
        if (!rule) {
          throw new Error('Règle non trouvée');
        }

        const updated = await updateAvailabilityRule(ruleId, {
          isActive: !rule.isActive,
        });

        return updated !== null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        logger.error(
          { error: err, ruleId },
          'Error toggling availability rule status',
        );
        return false;
      }
    },
    [availabilities, updateAvailabilityRule],
  );

  // Rafraîchir la liste des règles
  const refreshAvailabilities = useCallback(
    async (filterType?: 'weekly' | 'monthly' | 'custom') => {
      await fetchAvailabilities(filterType || type);
    },
    [fetchAvailabilities, type],
  );

  // Charger les règles au montage et quand le type change
  useEffect(() => {
    fetchAvailabilities(type);
  }, [fetchAvailabilities, type]);

  return {
    availabilities,
    loading,
    error,
    createAvailabilityRule,
    updateAvailabilityRule,
    deleteAvailabilityRule,
    toggleAvailabilityRuleStatus,
    refreshAvailabilities,
  };
}

