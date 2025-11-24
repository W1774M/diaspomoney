/**
 * Tests unitaires pour useInvoices
 * 
 * Implémente les tests pour :
 * - Récupération des factures
 * - Gestion de la pagination
 * - Gestion des filtres
 * - Gestion des erreurs
 * - États de chargement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInvoices } from '@/hooks/invoices/useInvoices';

// Mock de fetch global
global.fetch = vi.fn();

describe('useInvoices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les factures avec succès', async () => {
    const mockInvoices = [
      {
        _id: '1',
        invoiceNumber: 'INV-001',
        status: 'PENDING',
        amount: 1000,
        createdAt: new Date(),
      },
      {
        _id: '2',
        invoiceNumber: 'INV-002',
        status: 'PAID',
        amount: 2000,
        createdAt: new Date(),
      },
    ];

    const mockResponse = {
      success: true,
      data: mockInvoices,
      pagination: {
        total: 2,
        page: 1,
        limit: 50,
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useInvoices({ limit: 50 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.invoices).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it('devrait gérer la pagination avec page', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { total: 50, page: 2, limit: 20 },
      }),
    } as Response);

    const { result } = renderHook(() => useInvoices({ page: 2, limit: 20 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('limit=20'));
    expect(result.current.total).toBe(50);
  });

  it('devrait convertir automatiquement offset en page', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { total: 50, page: 3, limit: 20 },
      }),
    } as Response);

    const { result } = renderHook(() => useInvoices({ offset: 40, limit: 20 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // offset 40 avec limit 20 = page 3 (40/20 + 1)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('page=3'));
  });

  it('devrait filtrer par status (excluant ALL)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 50 },
      }),
    } as Response);

    renderHook(() => useInvoices({ status: 'PENDING' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('status=PENDING'));
  });

  it('ne devrait pas ajouter le paramètre status si ALL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 50 },
      }),
    } as Response);

    renderHook(() => useInvoices({ status: 'ALL' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('status=ALL'));
  });

  it('devrait gérer les erreurs de récupération', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'Erreur serveur' }),
    } as Response);

    const { result } = renderHook(() => useInvoices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.invoices).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('devrait avoir un état de chargement initial', async () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {})); // Ne jamais résoudre

    const { result } = renderHook(() => useInvoices());

    // Le loading devrait être true initialement
    expect(result.current.loading).toBe(true);
  });

  it('devrait avoir un état de chargement false après récupération', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 50 },
      }),
    } as Response);

    const { result } = renderHook(() => useInvoices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loading).toBe(false);
  });

  it('devrait permettre de recharger les données avec refetch', async () => {
    const mockResponse = {
      success: true,
      data: [],
      pagination: { total: 0, page: 1, limit: 50 },
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useInvoices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = vi.mocked(fetch).mock.calls.length;

    // Appeler refetch
    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Vérifier que fetch a été appelé une fois de plus
    expect(vi.mocked(fetch).mock.calls.length).toBe(initialCallCount + 1);
  });

  it('devrait gérer les réponses API avec format standardisé', async () => {
    const mockInvoices = [{ _id: '1', invoiceNumber: 'INV-001' }];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockInvoices,
        pagination: { total: 1, page: 1, limit: 50 },
      }),
    } as Response);

    const { result } = renderHook(() => useInvoices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.invoices).toEqual(mockInvoices);
    expect(result.current.total).toBe(1);
  });

  it('devrait gérer les réponses API avec data non-array (tableau vide)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: null, // data n'est pas un tableau
        pagination: { total: 0, page: 1, limit: 50 },
      }),
    } as Response);

    const { result } = renderHook(() => useInvoices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.invoices).toEqual([]);
  });
});

