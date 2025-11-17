/**
 * Hook personnalisé pour créer une méthode de paiement (carte ou PayPal)
 * Implémente les design patterns :
 * - Custom Hooks Pattern
 * - Error Handling Pattern (Sentry côté client)
 * - Service Layer Pattern (abstraction de l'API)
 */

import { useNotificationManager } from '@/components/ui/Notification';
import type { UIPaymentMethod } from '@/types/payments';
import * as Sentry from '@sentry/nextjs';
import { useCallback, useState } from 'react';

export interface CardFormData {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  isDefault: boolean;
}

export interface PayPalFormData {
  email: string;
  password: string;
  isDefault: boolean;
}

export interface UsePaymentMethodCreateReturn {
  createCard: (data: CardFormData) => Promise<UIPaymentMethod | null>;
  createPayPal: (data: PayPalFormData) => Promise<UIPaymentMethod | null>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour créer une méthode de paiement
 */
export function usePaymentMethodCreate(): UsePaymentMethodCreateReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addSuccess, addError } = useNotificationManager();

  const createCard = useCallback(
    async (data: CardFormData): Promise<UIPaymentMethod | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/payments/methods', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'card',
            cardNumber: data.cardNumber.replace(/\s/g, ''),
            cardholderName: data.cardholderName,
            expiryMonth: parseInt(data.expiryMonth, 10),
            expiryYear: parseInt(data.expiryYear, 10),
            cvv: data.cvv,
            isDefault: data.isDefault,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error ||
            (response.status === 400
              ? 'Données de carte invalides'
              : response.status === 401
              ? 'Non autorisé'
              : "Erreur lors de l'ajout de la carte");

          setError(errorMessage);
          addError(errorMessage);

          // Capturer les erreurs critiques avec Sentry
          if (response.status >= 500) {
            Sentry.captureException(new Error(errorMessage), {
              tags: {
                component: 'usePaymentMethodCreate',
                action: 'createCard',
                status: response.status,
              },
              extra: { errorData },
            });
          }

          return null;
        }

        const result = await response.json();

        if (!result.success || !result.method) {
          const errorMessage =
            result.error || 'Données invalides reçues du serveur';
          setError(errorMessage);
          addError(errorMessage);
          return null;
        }

        addSuccess('Carte bancaire ajoutée avec succès !');
        return result.method as UIPaymentMethod;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        addError("Erreur lors de l'ajout de la carte");

        // Capturer l'erreur avec Sentry
        Sentry.captureException(
          err instanceof Error ? err : new Error(errorMessage),
          {
            tags: {
              component: 'usePaymentMethodCreate',
              action: 'createCard',
            },
          }
        );

        return null;
      } finally {
        setLoading(false);
      }
    },
    [addSuccess, addError]
  );

  const createPayPal = useCallback(
    async (data: PayPalFormData): Promise<UIPaymentMethod | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/payments/methods', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'paypal',
            email: data.email,
            password: data.password,
            isDefault: data.isDefault,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error ||
            (response.status === 400
              ? 'Données PayPal invalides'
              : response.status === 401
              ? 'Non autorisé'
              : "Erreur lors de l'ajout du compte PayPal");

          setError(errorMessage);
          addError(errorMessage);

          // Capturer les erreurs critiques avec Sentry
          if (response.status >= 500) {
            Sentry.captureException(new Error(errorMessage), {
              tags: {
                component: 'usePaymentMethodCreate',
                action: 'createPayPal',
                status: response.status,
              },
              extra: { errorData },
            });
          }

          return null;
        }

        const result = await response.json();

        if (!result.success || !result.method) {
          const errorMessage =
            result.error || 'Données invalides reçues du serveur';
          setError(errorMessage);
          addError(errorMessage);
          return null;
        }

        addSuccess('Compte PayPal ajouté avec succès !');
        return result.method as UIPaymentMethod;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        addError("Erreur lors de l'ajout du compte PayPal");

        // Capturer l'erreur avec Sentry
        Sentry.captureException(
          err instanceof Error ? err : new Error(errorMessage),
          {
            tags: {
              component: 'usePaymentMethodCreate',
              action: 'createPayPal',
            },
          }
        );

        return null;
      } finally {
        setLoading(false);
      }
    },
    [addSuccess, addError]
  );

  return {
    createCard,
    createPayPal,
    loading,
    error,
  };
}
