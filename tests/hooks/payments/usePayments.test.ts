/**
 * Tests unitaires pour usePayments
 * 
 * Implémente les tests pour :
 * - Gestion des paiements
 * - Méthodes de paiement, adresses, solde
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePayments } from '@/hooks/payments/usePayments';

// Mock de fetch global
global.fetch = vi.fn();

describe('usePayments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les méthodes de paiement', async () => {
    const mockMethods = [
      { id: 'm1', type: 'card', last4: '1234', isDefault: true },
      { id: 'm2', type: 'paypal', email: 'test@paypal.com', isDefault: false },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        methods: mockMethods,
      }),
    } as Response);

    const { result } = renderHook(() => usePayments());

    await act(async () => {
      await result.current.fetchPaymentMethods();
    });

    expect(result.current.paymentMethods).toHaveLength(2);
    expect(result.current.paymentMethods?.[0]?.id).toBe('m1');
    expect(result.current.loading).toBe(false);
  });

  it('devrait récupérer les adresses de facturation', async () => {
    const mockAddresses = [
      { id: 'a1', street: '123 Main St', isDefault: true },
      { id: 'a2', street: '456 Oak Ave', isDefault: false },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        addresses: mockAddresses,
      }),
    } as Response);

    const { result } = renderHook(() => usePayments());

    await act(async () => {
      await result.current.fetchBillingAddresses();
    });

    expect(result.current.billingAddresses).toHaveLength(2);
    expect(result.current.billingAddresses?.[0]?.id).toBe('a1');
  });

  it('devrait récupérer le solde', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        balance: {
          available: 1000,
          currency: 'EUR',
          lastUpdated: Date.now(),
        },
      }),
    } as Response);

    const { result } = renderHook(() => usePayments());

    await act(async () => {
      await result.current.fetchBalance();
    });

    expect(result.current.balance).toBeDefined();
    expect(result.current.balance?.available).toBe(1000);
    expect(result.current.balance?.currency).toBe('EUR');
  });

  it('devrait définir une méthode de paiement par défaut', async () => {
    const mockMethods = [
      { id: 'm1', type: 'card' as const, isDefault: false },
      { id: 'm2', type: 'card' as const, isDefault: false },
    ];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          methods: mockMethods,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response);

    const { result } = renderHook(() => usePayments());

    await act(async () => {
      await result.current.fetchPaymentMethods();
    });

    await act(async () => {
      await result.current.setDefaultPaymentMethod('card', 'm1');
    });

    expect(result.current.paymentMethods?.[0]?.isDefault).toBe(true);
  });

  it('devrait définir une adresse par défaut', async () => {
    const mockAddresses = [
      { id: 'a1', street: '123 Main St', isDefault: false },
      { id: 'a2', street: '456 Oak Ave', isDefault: false },
    ];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          addresses: mockAddresses,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response);

    const { result } = renderHook(() => usePayments());

    await act(async () => {
      await result.current.fetchBillingAddresses();
    });

    await act(async () => {
      await result.current.setDefaultAddress('a1');
    });

    expect(result.current.billingAddresses?.[0]?.isDefault).toBe(true);
  });

  it('devrait supprimer une méthode de paiement', async () => {
    const mockMethods = [
      { id: 'm1', type: 'card' as const },
      { id: 'm2', type: 'paypal' as const },
    ];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          methods: mockMethods,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response);

    const { result } = renderHook(() => usePayments());

    await act(async () => {
      await result.current.fetchPaymentMethods();
    });

    await act(async () => {
      await result.current.deletePaymentMethod('card', 'm1');
    });

    expect(result.current.paymentMethods).toHaveLength(1);
    expect(result.current.paymentMethods?.[0]?.id).toBe('m2');
  });

  it('devrait supprimer une adresse', async () => {
    const mockAddresses = [
      { id: 'a1', street: '123 Main St' },
      { id: 'a2', street: '456 Oak Ave' },
    ];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          addresses: mockAddresses,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response);

    const { result } = renderHook(() => usePayments());

    await act(async () => {
      await result.current.fetchBillingAddresses();
    });

    await act(async () => {
      await result.current.deleteAddress('a1');
    });

    expect(result.current.billingAddresses).toHaveLength(1);
    expect(result.current.billingAddresses?.[0]?.id).toBe('a2');
  });

  it('devrait gérer les erreurs API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Erreur serveur',
      }),
    } as Response);

    const { result } = renderHook(() => usePayments());

    await act(async () => {
      await result.current.fetchPaymentMethods();
    });

    expect(result.current.error).toBe('Erreur lors de la récupération des méthodes de paiement');
  });

  it('devrait gérer les états de chargement', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(fetch).mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => usePayments());

    act(() => {
      result.current.fetchPaymentMethods();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => ({
          success: true,
          methods: [],
        }),
      });
      await promise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('devrait gérer les erreurs', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePayments());

    await act(async () => {
      await result.current.fetchPaymentMethods();
    });

    expect(result.current.error).toBe('Network error');
  });
});

