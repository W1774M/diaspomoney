'use client';

/**
 * Custom Hook pour les paiements — thin API client via fetchJson.
 */

import { fetchJson } from '@/lib/api/fetchJson';
import { CURRENCIES } from '@/lib/constants';
import type { UsePaymentsReturn } from '@/lib/types';
import type {
  UIAccountBalance,
  UIBillingAddress,
  UIPaymentMethod,
} from '@/lib/types';
import { useCallback, useState } from 'react';

export function usePayments(): UsePaymentsReturn & { isLoading: boolean } {
  const [paymentMethods, setPaymentMethods] = useState<UIPaymentMethod[]>([]);
  const [billingAddresses, setBillingAddresses] = useState<UIBillingAddress[]>(
    [],
  );
  const [balance, setBalance] = useState<UIAccountBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchJson<{
        success?: boolean;
        methods?: UIPaymentMethod[];
        error?: string;
      }>('/api/payments/methods');

      if (!data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }
      setPaymentMethods(data.methods || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBillingAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchJson<{
        success?: boolean;
        addresses?: UIBillingAddress[];
        error?: string;
      }>('/api/payments/addresses');

      if (!data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }
      setBillingAddresses(data.addresses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchJson<{
        success?: boolean;
        balance?: {
          available?: number;
          currency?: string;
          lastUpdated?: number | string | Date;
        };
        error?: string;
      }>('/api/payments/balance');

      if (!data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }
      setBalance({
        available: data.balance?.available || 0,
        currency: data.balance?.currency || CURRENCIES.EUR.code,
        lastUpdated: new Date(data.balance?.lastUpdated || Date.now()),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setDefaultPaymentMethod = useCallback(
    async (type: 'card' | 'paypal', id: string) => {
      try {
        await fetchJson('/api/payments/methods/default', {
          method: 'PUT',
          body: JSON.stringify({ type, id }),
        });

        setPaymentMethods(prev =>
          prev.map(method => ({
            ...method,
            isDefault: method.id === id && method.type === type,
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
    },
    [],
  );

  const setDefaultAddress = useCallback(async (id: string) => {
    try {
      await fetchJson('/api/payments/addresses/default', {
        method: 'PUT',
        body: JSON.stringify({ id }),
      });

      setBillingAddresses(prev =>
        prev.map(address => ({
          ...address,
          isDefault: address.id === id,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }, []);

  const deletePaymentMethod = useCallback(
    async (type: 'card' | 'paypal', id: string) => {
      try {
        await fetchJson(`/api/payments/methods/${id}`, {
          method: 'DELETE',
        });

        setPaymentMethods(prev =>
          prev.filter(method => !(method.id === id && method.type === type)),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        throw err;
      }
    },
    [],
  );

  const deleteAddress = useCallback(async (id: string) => {
    try {
      await fetchJson(`/api/payments/addresses/${id}`, {
        method: 'DELETE',
      });

      setBillingAddresses(prev => prev.filter(address => address.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    }
  }, []);

  return {
    paymentMethods,
    billingAddresses,
    balance,
    isLoading,
    loading: isLoading,
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
