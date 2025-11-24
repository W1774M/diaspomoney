/**
 * Tests unitaires pour useBookingCancel
 * 
 * Implémente les tests pour :
 * - Annulation de réservation
 * - Gestion d'erreurs
 * - États de chargement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBookingCancel } from '@/hooks/bookings/useBookingCancel';

// Mock de fetch global
global.fetch = vi.fn();

describe('useBookingCancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait annuler une réservation avec succès', async () => {
    const mockBooking = {
      _id: 'booking123',
      id: 'booking123',
      reservationNumber: 'RES-001',
      status: 'CANCELLED',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        booking: mockBooking,
      }),
    } as Response);

    const { result } = renderHook(() => useBookingCancel());

    const cancelledBooking = await result.current.cancelBooking('booking123');

    expect(cancelledBooking).toEqual(mockBooking);
    expect(fetch).toHaveBeenCalledWith('/api/bookings/booking123', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('devrait retourner la réservation annulée', async () => {
    const mockBooking = {
      _id: 'booking123',
      reservationNumber: 'RES-001',
      status: 'CANCELLED',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        booking: mockBooking,
      }),
    } as Response);

    const { result } = renderHook(() => useBookingCancel());

    const cancelledBooking = await result.current.cancelBooking('booking123');

    expect(cancelledBooking).toEqual(mockBooking);
  });

  it('devrait gérer les erreurs lors de l\'annulation (response.ok = false)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Erreur lors de l\'annulation',
      }),
    } as Response);

    const { result } = renderHook(() => useBookingCancel());

    await expect(result.current.cancelBooking('booking123')).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.error).toContain('annulation');
  });

  it('devrait gérer les erreurs avec message d\'erreur personnalisé', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Réservation déjà annulée',
      }),
    } as Response);

    const { result } = renderHook(() => useBookingCancel());

    await expect(result.current.cancelBooking('booking123')).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.error).toBe('Réservation déjà annulée');
  });

  it('devrait gérer les erreurs avec result.success = false', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Erreur inconnue',
      }),
    } as Response);

    const { result } = renderHook(() => useBookingCancel());

    await expect(result.current.cancelBooking('booking123')).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });

  it('devrait avoir un état de chargement pendant l\'annulation', async () => {
    let resolveFetch: () => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = () => resolve({
        ok: true,
        json: async () => ({
          success: true,
          booking: { _id: 'booking123' },
        }),
      } as Response);
    });

    vi.mocked(fetch).mockReturnValue(fetchPromise);

    const { result } = renderHook(() => useBookingCancel());

    const cancelPromise = result.current.cancelBooking('booking123');

    // Vérifier que loading est true pendant l'annulation
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    resolveFetch!();
    await cancelPromise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('devrait avoir un état de chargement false après annulation', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        booking: { _id: 'booking123' },
      }),
    } as Response);

    const { result } = renderHook(() => useBookingCancel());

    await result.current.cancelBooking('booking123');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loading).toBe(false);
  });

  it('devrait gérer l\'erreur dans l\'état (error state)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Erreur de test',
      }),
    } as Response);

    const { result } = renderHook(() => useBookingCancel());

    try {
      await result.current.cancelBooking('booking123');
    } catch {
      // Ignorer l'erreur propagée
    }

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.error).toBe('Erreur de test');
  });

  it('devrait propager l\'erreur (throw)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Erreur de propagation',
      }),
    } as Response);

    const { result } = renderHook(() => useBookingCancel());

    await expect(result.current.cancelBooking('booking123')).rejects.toThrow('Erreur de propagation');
  });

  it('devrait avoir les headers Content-Type corrects', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        booking: { _id: 'booking123' },
      }),
    } as Response);

    const { result } = renderHook(() => useBookingCancel());

    await result.current.cancelBooking('booking123');

    expect(fetch).toHaveBeenCalledWith(
      '/api/bookings/booking123',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    );
  });
});

