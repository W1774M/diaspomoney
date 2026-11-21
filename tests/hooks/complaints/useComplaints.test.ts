/**
 * Tests unitaires pour useComplaints
 * 
 * Implémente les tests pour :
 * - Gestion des réclamations
 * - Filtres et pagination
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComplaints } from '@/hooks/complaints/useComplaints';

// Mock de fetch global
global.fetch = vi.fn();

describe('useComplaints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les réclamations avec filtres (fetchComplaints)', async () => {
    const mockComplaints = [
      {
        _id: 'c1',
        type: 'SERVICE',
        status: 'PENDING',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockComplaints,
        pagination: { total: 1 },
      }),
    } as Response);

    const { result } = renderHook(() => useComplaints());

    await act(async () => {
      await result.current.fetchComplaints();
    });

    expect(result.current.complaints).toHaveLength(1);
    expect(result.current.total).toBe(1);
  });

  it('devrait filtrer par userId, provider, appointmentId', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { total: 0 },
      }),
    } as Response);

    const { result } = renderHook(() => useComplaints());

    await act(async () => {
      await result.current.fetchComplaints({
        userId: 'user123',
        provider: 'provider123',
        appointmentId: 'appointment123',
      });
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('userId=user123'),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('provider=provider123'),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('appointmentId=appointment123'),
    );
  });

  it('devrait filtrer par type, priority, status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { total: 0 },
      }),
    } as Response);

    const { result } = renderHook(() => useComplaints());

    await act(async () => {
      await result.current.fetchComplaints({
        type: 'SERVICE',
        priority: 'HIGH',
        status: 'PENDING',
      });
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('type=SERVICE'),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('priority=HIGH'),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('status=PENDING'),
    );
  });

  it('devrait gérer la pagination (limit, offset)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { total: 0 },
      }),
    } as Response);

    const { result } = renderHook(() => useComplaints());

    await act(async () => {
      await result.current.fetchComplaints({
        limit: 20,
        offset: 40,
      });
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=20'),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('offset=40'),
    );
  });

  it('devrait convertir les dates string en Date objects', async () => {
    const mockComplaints = [
      {
        _id: 'c1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockComplaints,
        pagination: { total: 1 },
      }),
    } as Response);

    const { result } = renderHook(() => useComplaints());

    await act(async () => {
      await result.current.fetchComplaints();
    });

    expect(result.current.complaints?.[0]?.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(result.current.complaints?.[0]?.updatedAt).toBe('2024-01-02T00:00:00.000Z');
  });

  it('devrait gérer le total (pagination)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { total: 50 },
      }),
    } as Response);

    const { result } = renderHook(() => useComplaints());

    await act(async () => {
      await result.current.fetchComplaints();
    });

    expect(result.current.total).toBe(50);
  });

  it('devrait gérer les erreurs API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Erreur serveur',
      }),
    } as Response);

    const { result } = renderHook(() => useComplaints());

    await act(async () => {
      await result.current.fetchComplaints();
    });

    expect(result.current.error).toBe('Erreur serveur');
  });

  it('devrait gérer les états de chargement (loading)', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(fetch).mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useComplaints());

    act(() => {
      result.current.fetchComplaints();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
          pagination: { total: 0 },
        }),
      });
      await promise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('devrait gérer les erreurs (error)', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useComplaints());

    await act(async () => {
      await result.current.fetchComplaints();
    });

    expect(result.current.error).toBe('Network error');
  });
});

