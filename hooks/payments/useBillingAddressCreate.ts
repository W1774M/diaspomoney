/**
 * Hook personnalisé pour créer une adresse de facturation
 * Implémente les design patterns :
 * - Custom Hooks Pattern
 * - Error Handling Pattern (Sentry côté client)
 * - Service Layer Pattern (abstraction de l'API)
 */

import { useNotificationManager } from '@/components/ui/Notification';
import type { UIBillingAddress } from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import { useCallback, useState } from 'react';

export interface BillingAddressFormData {
  name: string;
  address: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  type: 'home' | 'work' | 'other';
}

export interface UseBillingAddressCreateReturn {
  createAddress: (
    data: BillingAddressFormData
  ) => Promise<UIBillingAddress | null>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour créer une adresse de facturation
 */
export function useBillingAddressCreate(): UseBillingAddressCreateReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addSuccess, addError } = useNotificationManager();

  const createAddress = useCallback(
    async (data: BillingAddressFormData): Promise<UIBillingAddress | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/payments/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            address: data.address,
            address2: data.address2 || '',
            city: data.city,
            state: data.state || '',
            postalCode: data.postalCode,
            country: data.country,
            phone: data.phone || '',
            isDefault: data.isDefault,
            type: data.type,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error ||
            (response.status === 400
              ? 'Données invalides'
              : response.status === 401
              ? 'Non autorisé'
              : "Erreur lors de l'ajout de l'adresse");

          setError(errorMessage);
          addError(errorMessage);

          // Capturer les erreurs critiques avec Sentry
          if (response.status >= 500) {
            Sentry.captureException(new Error(errorMessage), {
              tags: {
                component: 'useBillingAddressCreate',
                action: 'createAddress',
                status: response.status,
              },
              extra: { data, errorData },
            });
          }

          return null;
        }

        const result = await response.json();

        if (!result.success || !result.address) {
          const errorMessage =
            result.error || 'Données invalides reçues du serveur';
          setError(errorMessage);
          addError(errorMessage);
          return null;
        }

        addSuccess('Adresse de facturation ajoutée avec succès !');
        return result.address as UIBillingAddress;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur inconnue';
        setError(errorMessage);
        addError("Erreur lors de l'ajout de l'adresse");

        // Capturer l'erreur avec Sentry
        Sentry.captureException(
          error instanceof Error ? error : new Error(errorMessage),
          {
            tags: {
              component: 'useBillingAddressCreate',
              action: 'createAddress',
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
    createAddress,
    loading,
    error,
  };
}
