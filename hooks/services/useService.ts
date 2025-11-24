/**
 * Hook pour récupérer les détails d'un service
 * Utilise les types et constantes centralisés
 */

import { useState, useEffect, useCallback } from 'react';
import type { ServiceOption } from '@/lib/types/service-options.types';
import * as Sentry from '@sentry/nextjs';

export interface UseServiceReturn {
  service: ServiceOption | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useService(serviceId: string | undefined): UseServiceReturn {
  const [service, setService] = useState<ServiceOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchService = useCallback(async () => {
    if (!serviceId) {
      setService(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          (response.status === 404
            ? 'Service non trouvé'
            : 'Erreur lors de la récupération du service');

        setError(errorMessage);
        setService(null);

        if (response.status >= 500) {
          Sentry.captureException(new Error(errorMessage), {
            tags: {
              component: 'useService',
              action: 'fetchService',
              status: response.status,
            },
            extra: { serviceId, errorData },
          });
        }

        return;
      }

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Données invalides reçues du serveur');
        setService(null);
        return;
      }

      // Le nouveau format standardisé utilise data directement pour les ressources
      const serviceData = data.data || data.service;
      if (!serviceData) {
        setError('Service non trouvé dans la réponse');
        setService(null);
        return;
      }

      setService(serviceData);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la récupération du service';
      setError(errorMessage);
      setService(null);

      Sentry.captureException(err, {
        tags: {
          component: 'useService',
          action: 'fetchService',
        },
        extra: { serviceId },
      });
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  return {
    service,
    loading,
    error,
    refetch: fetchService,
  };
}

