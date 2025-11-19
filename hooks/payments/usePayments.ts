'use client';

/**
 * Custom Hook pour les paiements
 * Implémente le Custom Hooks Pattern
 * Utilise les API routes au lieu d'importer directement les services
 */

import { UsePaymentsReturn } from '@/lib/types';
import {
  UIAccountBalance,
  UIBillingAddress,
  UIPaymentMethod,
} from '@/lib/types';
import { CURRENCIES } from '@/lib/constants';
import { useCallback, useState } from 'react';

/**
 * Custom Hook pour gérer les paiements
 * Implémente le Custom Hooks Pattern
 */
export function usePayments(): UsePaymentsReturn {
  const [paymentMethods, setPaymentMethods] = useState<UIPaymentMethod[]>([]);
  const [billingAddresses, setBillingAddresses] = useState<UIBillingAddress[]>(
    [],
  );
  const [balance, setBalance] = useState<UIAccountBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/methods');

      if (!response.ok) {
        throw new Error(
          'Erreur lors de la récupération des méthodes de paiement',
        );
      }

      const data = await response.json();

      if (data.success) {
        setPaymentMethods(data.methods || []);
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      // Le logging est fait côté serveur via PaymentService avec @Log decorator
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBillingAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/addresses');

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des adresses');
      }

      const data = await response.json();

      if (data.success) {
        setBillingAddresses(data.addresses || []);
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      // Le logging est fait côté serveur via PaymentService avec @Log decorator
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/balance');

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du solde');
      }

      const data = await response.json();

      if (data.success) {
        setBalance({
          available: data.balance?.available || 0,
          currency: data.balance?.currency || CURRENCIES.EUR.code,
          lastUpdated: new Date(data.balance?.lastUpdated || Date.now()),
        });
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      // Le logging est fait côté serveur via PaymentService avec @Log decorator
    } finally {
      setLoading(false);
    }
  }, []);

  const setDefaultPaymentMethod = useCallback(
    async (type: 'card' | 'paypal', id: string) => {
      try {
        const response = await fetch('/api/payments/methods/default', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, id }),
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la mise à jour');
        }

        // Mettre à jour l'état local
        setPaymentMethods(prev =>
          prev.map(method => ({
            ...method,
            isDefault: method.id === id && method.type === type,
          })),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        // Le logging est fait côté serveur via PaymentService avec @Log decorator
      }
    },
    [],
  );

  const setDefaultAddress = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/payments/addresses/default', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      // Mettre à jour l'état local
      setBillingAddresses(prev =>
        prev.map(address => ({
          ...address,
          isDefault: address.id === id,
        })),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      // Le logging est fait côté serveur via PaymentService avec @Log decorator
    }
  }, []);

  const deletePaymentMethod = useCallback(
    async (type: 'card' | 'paypal', id: string) => {
      try {
        const response = await fetch(`/api/payments/methods/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la suppression');
        }

        // Mettre à jour l'état local
        setPaymentMethods(prev =>
          prev.filter(method => !(method.id === id && method.type === type)),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        // Le logging est fait côté serveur via PaymentService avec @Log decorator
        throw err;
      }
    },
    [],
  );

  const deleteAddress = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/payments/addresses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // Mettre à jour l'état local
      setBillingAddresses(prev => prev.filter(address => address.id !== id));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      // Le logging est fait côté serveur via PaymentService avec @Log decorator
      throw error;
    }
  }, []);

  return {
    paymentMethods,
    billingAddresses,
    balance,
    loading,
    error,
    fetchPaymentMethods,
    fetchBillingAddresses,
    fetchBalance,
    setDefaultPaymentMethod,
    setDefaultAddress,
    deletePaymentMethod,
    deleteAddress,
  };
}
