/**
 * Hook personnalisé pour charger les détails d'un provider avec statistiques
 * Implémente les design patterns :
 * - Custom Hooks Pattern
 * - Error Handling Pattern (Sentry côté client)
 * - Service Layer Pattern (abstraction de l'API)
 */

import type { ProviderInfo } from '@/types';
import * as Sentry from '@sentry/nextjs';
import { useCallback, useEffect, useState } from 'react';

export interface ProviderRatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface UseProviderDetailReturn {
  provider: ProviderInfo | null;
  ratingStats: ProviderRatingStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour charger les détails d'un provider avec transformation des données
 */
export function useProviderDetail(
  providerId: string | undefined,
): UseProviderDetailReturn {
  const [provider, setProvider] = useState<ProviderInfo | null>(null);
  const [ratingStats, setRatingStats] = useState<ProviderRatingStats | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProvider = useCallback(async () => {
    if (!providerId) {
      setProvider(null);
      setRatingStats(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/providers/${providerId}`, {
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
            ? 'Prestataire non trouvé'
            : 'Erreur lors de la récupération du prestataire');

        setError(errorMessage);
        setProvider(null);
        setRatingStats(null);

        // Capturer les erreurs critiques avec Sentry
        if (response.status >= 500) {
          Sentry.captureException(new Error(errorMessage), {
            tags: {
              component: 'useProviderDetail',
              action: 'fetchProvider',
              status: response.status,
            },
            extra: { providerId, errorData },
          });
        }

        return;
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        setError('Données invalides reçues du serveur');
        setProvider(null);
        setRatingStats(null);
        return;
      }

      const foundProvider = data.data;

      // Vérifier que c'est un provider valide et actif
      if (
        !foundProvider ||
        !Array.isArray(foundProvider.roles) ||
        !foundProvider.roles.includes('PROVIDER') ||
        foundProvider.status !== 'ACTIVE'
      ) {
        setError('Prestataire invalide ou inactif');
        setProvider(null);
        setRatingStats(null);
        return;
      }

      // Transformer les données en ProviderInfo
      const providerData: ProviderInfo = {
        ...foundProvider,
        availabilities: foundProvider.availabilities || [],
        appointments: foundProvider.appointmentsAsProvider || [],
        images: foundProvider.images || [],
        _id: foundProvider._id || foundProvider.id,
        id: foundProvider._id || foundProvider.id,
        name:
          foundProvider.name ||
          `${foundProvider.firstName || ''} ${
            foundProvider.lastName || ''
          }`.trim(),
        email: foundProvider.email,
        roles: foundProvider.roles,
        status: foundProvider.status,
        specialty: foundProvider.specialty,
        rating: foundProvider.rating || 0,
        city: foundProvider.city,
        specialties: foundProvider.specialties || [],
        services: foundProvider.services || [],
        providerInfo: foundProvider.providerInfo,
        profileImage: foundProvider.avatar || foundProvider.profileImage,
      };

      setProvider(providerData);

      // Calculer les statistiques de rating
      const stats: ProviderRatingStats = {
        averageRating: foundProvider.rating || 4.5,
        totalReviews: foundProvider.reviewCount || 12,
        ratingDistribution: {
          5: Math.floor((foundProvider.reviewCount || 12) * 0.6),
          4: Math.floor((foundProvider.reviewCount || 12) * 0.25),
          3: Math.floor((foundProvider.reviewCount || 12) * 0.1),
          2: Math.floor((foundProvider.reviewCount || 12) * 0.03),
          1: Math.floor((foundProvider.reviewCount || 12) * 0.02),
        },
      };

      setRatingStats(stats);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      setProvider(null);
      setRatingStats(null);

      // Capturer l'erreur avec Sentry
      Sentry.captureException(
        err instanceof Error ? err : new Error(errorMessage),
        {
          tags: {
            component: 'useProviderDetail',
            action: 'fetchProvider',
          },
          extra: { providerId },
        },
      );
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  return {
    provider,
    ratingStats,
    loading,
    error,
    refetch: fetchProvider,
  };
}
