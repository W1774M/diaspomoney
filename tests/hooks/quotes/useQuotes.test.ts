/**
 * Tests unitaires pour useQuotes
 * 
 * Implémente les tests pour :
 * - Récupération des devis
 * - Gestion de la pagination
 * - Gestion des filtres
 * - Gestion des erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useQuotes } from '@/hooks/quotes/useQuotes';

// Mock de fetch global
global.fetch = vi.fn();

describe('useQuotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les devis avec succès', async () => {
    const mockQuotes = [
      {
        _id: '1',
        quoteNumber: 'QUO-001',
        status: 'PENDING',
        amount: 1000,
        createdAt: new Date(),
      },
      {
        _id: '2',
        quoteNumber: 'QUO-002',
        status: 'APPROVED',
        amount: 2000,
        createdAt: new Date(),
      },
    ];

    const mockResponse = {
      success: true,
      data: mockQuotes,
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

    const { result } = renderHook(() => useQuotes({ limit: 50 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.quotes).toHaveLength(2);
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

    const { result } = renderHook(() => useQuotes({ page: 2, limit: 20 }));

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

    const { result } = renderHook(() => useQuotes({ offset: 40, limit: 20 }));

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

    renderHook(() => useQuotes({ status: 'PENDING' }));

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

    renderHook(() => useQuotes({ status: 'ALL' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('status=ALL'));
  });

  it('devrait filtrer par userId si non admin', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 50 },
      }),
    } as Response);

    renderHook(() => useQuotes({ userId: 'user123', isAdmin: false }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('userId=user123'));
  });

  it('ne devrait pas filtrer par userId si isAdmin', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 50 },
      }),
    } as Response);

    renderHook(() => useQuotes({ userId: 'user123', isAdmin: true }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('userId=user123'));
  });

  it('devrait gérer les erreurs de récupération', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'Erreur serveur' }),
    } as Response);

    const { result } = renderHook(() => useQuotes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.quotes).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('devrait avoir un état de chargement initial et après récupération', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 50 },
      }),
    } as Response);

    const { result } = renderHook(() => useQuotes());

    // Initialement loading devrait être true
    // Puis false après récupération
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

    const { result } = renderHook(() => useQuotes());

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
    const mockQuotes = [{ _id: '1', quoteNumber: 'QUO-001' }];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockQuotes,
        pagination: { total: 1, page: 1, limit: 50 },
      }),
    } as Response);

    const { result } = renderHook(() => useQuotes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.quotes).toEqual(mockQuotes);
    expect(result.current.total).toBe(1);
  });
});

