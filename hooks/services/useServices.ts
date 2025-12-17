'use client';

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

export interface Service {
  id: string;
  category: string;
  label: string;
  description: string;
  price: number;
  optional: boolean;
  associatedOptions?: string[];
}

export interface UseServicesOptions {
  category?: string | undefined;
  isActive?: boolean | undefined;
}

export interface UseServicesReturn {
  services: Service[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom Hook pour récupérer la liste des services
 * Implémente le Custom Hooks Pattern avec gestion d'erreurs standardisée
 */
export function useServices(options: UseServicesOptions = {}): UseServicesReturn {
  const [services, setServices] = useState<Service[]>([]);
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

  const fetchServices = useCallback(async () => {
    const keyToUse = optionsKey;
    
    // Éviter les appels multiples simultanés
    if (fetchingRef.current) {
      logger.debug({}, '[useServices] Déjà en cours de fetch, ignoré');
      return;
    }
    
    // Si les options n'ont pas changé depuis le dernier fetch réussi, ne rien faire
    if (keyToUse === lastFetchedKeyRef.current && lastFetchedKeyRef.current !== '') {
      logger.debug({}, '[useServices] Options identiques au dernier fetch, ignoré');
      return;
    }
    
    logger.debug({ keyToUse }, '[useServices] Nouveau fetch démarré');
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

      const response = await fetch(`/api/services?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Erreur lors du chargement des services';

        setError(errorMessage);
        setServices([]);

        // Capturer les erreurs critiques avec Sentry
        if (response.status >= 500) {
          Sentry.captureException(new Error(errorMessage), {
            tags: {
              component: 'useServices',
              action: 'fetchServices',
              status: response.status,
            },
            extra: { options: memoizedOptions, errorData },
          });
        }

        return;
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const mappedServices: Service[] = data.data.map((s: any) => ({
          id: s.id || s._id,
          category: s.category,
          label: s.label,
          description: s.description,
          price: s.price,
          optional: s.optional ?? false,
          associatedOptions: s.associatedOptions || [],
        }));
        setServices(mappedServices);
        lastFetchedKeyRef.current = keyToUse;
        logger.info({ count: mappedServices.length, keyToUse }, '[useServices] Fetch terminé avec succès');
      } else {
        setError('Format de réponse invalide');
        setServices([]);
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      setServices([]);

      Sentry.captureException(err, {
        tags: {
          component: 'useServices',
          action: 'fetchServices',
        },
        extra: { options: memoizedOptions },
      });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
      logger.debug({}, '[useServices] Fetch terminé, fetchingRef réinitialisé');
    }
  }, [optionsKey, memoizedOptions]);

  useEffect(() => {
    const currentKey = optionsKey;
    
    // Si les options n'ont pas changé depuis le dernier fetch réussi, ne rien faire
    if (currentKey === lastFetchedKeyRef.current && lastFetchedKeyRef.current !== '') {
      logger.debug({}, '[useServices] Options identiques au dernier fetch, useEffect ignoré');
      return;
    }
    
    // Si déjà en cours de fetch, ne rien faire
    if (fetchingRef.current) {
      logger.debug({}, '[useServices] Déjà en cours de fetch, useEffect ignoré');
      return;
    }
    
    fetchServices();
     
  }, [optionsKey, fetchServices]);

  return {
    services,
    loading,
    error,
    refetch: fetchServices,
  };
}

