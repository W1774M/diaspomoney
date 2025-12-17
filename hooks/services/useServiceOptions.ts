'use client';

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

export interface ServiceOption {
  id: string;
  category: string;
  label: string;
  description: string;
  price: number;
  optional: boolean;
  isActive: boolean;
  associatedServices?: string[];
}

export interface UseServiceOptionsOptions {
  category?: string | undefined;
  isActive?: boolean | undefined;
}

export interface UseServiceOptionsReturn {
  options: ServiceOption[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom Hook pour récupérer la liste des options de service
 * Implémente le Custom Hooks Pattern avec gestion d'erreurs standardisée
 */
export function useServiceOptions(
  options: UseServiceOptionsOptions = {},
): UseServiceOptionsReturn {
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const lastFetchedKeyRef = useRef<string>('');

  // Créer une clé stable basée sur les valeurs des options
  const optionsKey = useMemo(() => {
    return JSON.stringify({
      category: options.category || null,
      isActive: options.isActive ?? null,
    });
  }, [options.category, options.isActive]);
  
  // Mémoriser les options pour éviter les re-renders inutiles
  const memoizedOptions = useMemo(() => options, [optionsKey]);

  const fetchOptions = useCallback(async () => {
    const keyToUse = optionsKey;
    
    // Éviter les appels multiples simultanés
    if (fetchingRef.current) {
      logger.debug({}, '[useServiceOptions] Déjà en cours de fetch, ignoré');
      return;
    }
    
    // Si les options n'ont pas changé depuis le dernier fetch réussi, ne rien faire
    if (keyToUse === lastFetchedKeyRef.current && lastFetchedKeyRef.current !== '') {
      logger.debug({}, '[useServiceOptions] Options identiques au dernier fetch, ignoré');
      return;
    }
    
    logger.debug({ keyToUse }, '[useServiceOptions] Nouveau fetch démarré');
    fetchingRef.current = true;
    try {
      setLoading(true);
      setError(null);

      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (memoizedOptions.category) {
        params.append('category', memoizedOptions.category);
      }
      if (memoizedOptions.isActive !== undefined) {
        params.append('isActive', memoizedOptions.isActive.toString());
      }

      const response = await fetch(`/api/service-options?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Erreur lors du chargement des options';

        setError(errorMessage);
        setServiceOptions([]);

        // Capturer les erreurs critiques avec Sentry
        if (response.status >= 500) {
          Sentry.captureException(new Error(errorMessage), {
            tags: {
              component: 'useServiceOptions',
              action: 'fetchOptions',
              status: response.status,
            },
            extra: { options: memoizedOptions, errorData },
          });
        }

        return;
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const mappedOptions: ServiceOption[] = data.data.map((o: any) => ({
          id: o.id || o._id,
          category: o.category,
          label: o.label,
          description: o.description,
          price: o.price,
          optional: o.optional ?? true,
          isActive: o.isActive ?? true,
          associatedServices: o.associatedServices || [],
        }));
        setServiceOptions(mappedOptions);
        lastFetchedKeyRef.current = keyToUse;
        logger.info({ count: mappedOptions.length, keyToUse }, '[useServiceOptions] Fetch terminé avec succès');
      } else {
        setError('Format de réponse invalide');
        setServiceOptions([]);
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      setServiceOptions([]);

      Sentry.captureException(err, {
        tags: {
          component: 'useServiceOptions',
          action: 'fetchOptions',
        },
        extra: { options: memoizedOptions },
      });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
      logger.debug({}, '[useServiceOptions] Fetch terminé, fetchingRef réinitialisé');
    }
  }, [optionsKey, memoizedOptions]);

  useEffect(() => {
    const currentKey = optionsKey;
    
    // Si les options n'ont pas changé depuis le dernier fetch réussi, ne rien faire
    if (currentKey === lastFetchedKeyRef.current && lastFetchedKeyRef.current !== '') {
      logger.debug({}, '[useServiceOptions] Options identiques au dernier fetch, useEffect ignoré');
      return;
    }
    
    // Si déjà en cours de fetch, ne rien faire
    if (fetchingRef.current) {
      logger.debug({}, '[useServiceOptions] Déjà en cours de fetch, useEffect ignoré');
      return;
    }
    
    fetchOptions();
     
  }, [optionsKey, fetchOptions]);

  return {
    options: serviceOptions,
    loading,
    error,
    refetch: fetchOptions,
  };
}

