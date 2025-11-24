/**
 * Tests unitaires pour useBeneficiaries
 * 
 * Implémente les tests pour :
 * - Gestion des bénéficiaires (CRUD)
 * - Format de réponse standardisé
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useBeneficiaries } from '@/hooks/beneficiaries/useBeneficiaries';

// Mock de fetch global
global.fetch = vi.fn();

// Mock de logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('useBeneficiaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les bénéficiaires (fetchBeneficiaries)', async () => {
    const mockBeneficiaries = [
      { _id: 'b1', name: 'Beneficiary 1', relationship: 'FAMILY' },
      { _id: 'b2', name: 'Beneficiary 2', relationship: 'FRIEND' },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockBeneficiaries,
      }),
    } as Response);

    const { result } = renderHook(() => useBeneficiaries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.beneficiaries).toHaveLength(2);
    expect(result.current.beneficiaries?.[0]?._id).toBe('b1');
  });

  it('devrait créer un bénéficiaire (createBeneficiary)', async () => {
    const mockNewBeneficiary = {
      _id: 'b3',
      name: 'New Beneficiary',
      relationship: 'FAMILY',
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockNewBeneficiary,
        }),
      } as Response);

    const { result } = renderHook(() => useBeneficiaries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const created = await result.current.createBeneficiary({
        name: 'New Beneficiary',
        relationship: 'FAMILY',
      });

      expect(created).toEqual(mockNewBeneficiary);
    });

    expect(result.current.beneficiaries).toContainEqual(mockNewBeneficiary);
  });

  it('devrait mettre à jour un bénéficiaire (updateBeneficiary)', async () => {
    const mockBeneficiaries = [
      { _id: 'b1', name: 'Beneficiary 1', relationship: 'FAMILY' },
    ];
    const mockUpdated = {
      _id: 'b1',
      name: 'Updated Beneficiary',
      relationship: 'FRIEND',
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockBeneficiaries,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockUpdated,
        }),
      } as Response);

    const { result } = renderHook(() => useBeneficiaries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const updated = await result.current.updateBeneficiary('b1', {
        name: 'Updated Beneficiary',
        relationship: 'FRIEND',
      });

      expect(updated).toEqual(mockUpdated);
    });

    expect(result.current.beneficiaries?.[0]?.name).toBe('Updated Beneficiary');
  });

  it('devrait supprimer un bénéficiaire (deleteBeneficiary)', async () => {
    const mockBeneficiaries = [
      { _id: 'b1', name: 'Beneficiary 1' },
      { _id: 'b2', name: 'Beneficiary 2' },
    ];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockBeneficiaries,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response);

    const { result } = renderHook(() => useBeneficiaries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      const deleted = await result.current.deleteBeneficiary('b1');

      expect(deleted).toBe(true);
    });

    expect(result.current.beneficiaries).toHaveLength(1);
    expect(result.current.beneficiaries?.[0]?._id).toBe('b2');
  });

  it('devrait gérer les erreurs API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Erreur serveur',
      }),
    } as Response);

    const { result } = renderHook(() => useBeneficiaries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Erreur serveur');
  });

  it('devrait gérer les états de chargement (loading)', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(fetch).mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useBeneficiaries());

    // Au début, loading devrait être true
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });
      await promise;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('devrait utiliser le format de réponse standardisé (data.success, data.data)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [{ _id: 'b1', name: 'Beneficiary 1' }],
      }),
    } as Response);

    const { result } = renderHook(() => useBeneficiaries());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.beneficiaries).toHaveLength(1);
  });
});

