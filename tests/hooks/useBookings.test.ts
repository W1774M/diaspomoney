/**
 * Tests unitaires pour useBookings
 * 
 * Implémente les tests pour :
 * - Récupération des réservations
 * - Gestion de la pagination
 * - Gestion des filtres
 * - Gestion des erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBookings } from '@/hooks/useBookings';

// Mock de fetch global
global.fetch = vi.fn();

describe('useBookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les réservations avec succès', async () => {
    const mockBookings = [
      {
        _id: '1',
        reservationNumber: 'RES-001',
        status: 'PENDING',
        createdAt: new Date(),
      },
      {
        _id: '2',
        reservationNumber: 'RES-002',
        status: 'CONFIRMED',
        createdAt: new Date(),
      },
    ];

    const mockResponse = {
      success: true,
      data: mockBookings,
      pagination: {
        total: 2,
        page: 1,
        limit: 20,
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useBookings({ limit: 20 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bookings).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it('devrait gérer les erreurs de récupération', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'Erreur serveur' }),
    } as Response);

    const { result } = renderHook(() => useBookings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.bookings).toHaveLength(0);
  });

  it('devrait appliquer les filtres correctement', async () => {
    const mockBookings = [
      {
        _id: '1',
        status: 'PENDING',
      },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockBookings,
        pagination: { total: 1, page: 1, limit: 20 },
      }),
    } as Response);

    const { result } = renderHook(() =>
      useBookings({ status: 'PENDING', limit: 20 }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('status=PENDING'),
    );
    expect(result.current.bookings).toHaveLength(1);
  });

  it('devrait gérer la pagination', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { total: 50, page: 2, limit: 20 },
      }),
    } as Response);

    const { result } = renderHook(() =>
      useBookings({ limit: 20, offset: 20 }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('offset=20'),
    );
    expect(result.current.total).toBe(50);
  });

  it('devrait ne pas récupérer les réservations si enabled est false', async () => {
    const { result } = renderHook(() => useBookings({ enabled: false }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.bookings).toHaveLength(0);
    expect(result.current.error).toBeNull();
    expect(result.current.total).toBe(0);
  });

  it('devrait inclure providerId dans les paramètres de recherche', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 20 },
      }),
    } as Response);

    const { result } = renderHook(() =>
      useBookings({ providerId: 'provider123' }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('providerId=provider123'),
    );
  });

  it('devrait gérer les erreurs avec data.error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Erreur personnalisée',
      }),
    } as Response);

    const { result } = renderHook(() => useBookings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Erreur personnalisée');
    expect(result.current.bookings).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });
});

