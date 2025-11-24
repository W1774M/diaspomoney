/**
 * Tests unitaires pour useBookingPayment
 * 
 * Implémente les tests pour :
 * - Confirmation de paiement
 * - Gestion des erreurs Stripe
 * - Émission d'événements (EventObserver)
 * - Envoi d'email d'erreur
 * - Logging
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBookingPayment } from '@/hooks/bookings/useBookingPayment';

// Mock de fetch global
global.fetch = vi.fn();

// Mock de logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock de paymentEvents et bookingEvents
vi.mock('@/lib/events', () => ({
  paymentEvents: {
    emitPaymentSucceeded: vi.fn().mockResolvedValue(undefined),
    emitPaymentFailed: vi.fn().mockResolvedValue(undefined),
  },
  bookingEvents: {
    emitBookingConfirmed: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('useBookingPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAppointment = {
    id: 'appointment123',
    _id: 'appointment123',
    providerId: 'provider123',
    serviceId: 'service123',
    date: new Date('2025-02-01'),
    time: '10:00',
    duration: 60,
    status: 'CONFIRMED',
    serviceType: 'HEALTH',
  };

  const mockPaymentData = {
    amount: 1000,
    currency: 'EUR',
    paymentMethodId: 'pm_123',
  };

  describe('confirmPayment', () => {
    it('devrait confirmer un paiement avec succès', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          reservationNumber: 'RES-001',
        }),
      } as Response);

      const { result } = renderHook(() => useBookingPayment());

      const paymentResult = await result.current.confirmPayment(mockAppointment, mockPaymentData);

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.reservationNumber).toBe('RES-001');
      expect(result.current.error).toBeNull();
    });

    it('devrait retourner reservationNumber après confirmation', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          reservationNumber: 'RES-002',
        }),
      } as Response);

      const { result } = renderHook(() => useBookingPayment());

      const paymentResult = await result.current.confirmPayment(mockAppointment, mockPaymentData);

      expect(paymentResult.reservationNumber).toBe('RES-002');
    });

    it('devrait émettre un événement paymentSucceeded (EventObserver)', async () => {
      const { paymentEvents } = await import('@/lib/events');

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          reservationNumber: 'RES-001',
        }),
      } as Response);

      const { result } = renderHook(() => useBookingPayment());

      await result.current.confirmPayment(mockAppointment, mockPaymentData);

      await waitFor(() => {
        expect(paymentEvents.emitPaymentSucceeded).toHaveBeenCalledWith(
          expect.objectContaining({
            transactionId: 'RES-001',
            amount: mockPaymentData.amount,
            currency: mockPaymentData.currency,
          }),
        );
      });
    });

    it('devrait émettre un événement bookingConfirmed (EventObserver)', async () => {
      const { bookingEvents } = await import('@/lib/events');

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          reservationNumber: 'RES-001',
        }),
      } as Response);

      const { result } = renderHook(() => useBookingPayment());

      await result.current.confirmPayment(mockAppointment, mockPaymentData);

      await waitFor(() => {
        expect(bookingEvents.emitBookingConfirmed).toHaveBeenCalledWith('appointment123');
      });
    });

    it('devrait gérer les erreurs lors de la confirmation (response.ok = false)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Erreur de paiement',
        }),
      } as Response);

      const { result } = renderHook(() => useBookingPayment());

      const paymentResult = await result.current.confirmPayment(mockAppointment, mockPaymentData);

      expect(paymentResult.success).toBe(false);
      expect(paymentResult.error).toBeDefined();
    });

    it('devrait gérer les erreurs avec message d\'erreur personnalisé', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Carte refusée',
        }),
      } as Response);

      const { result } = renderHook(() => useBookingPayment());

      const paymentResult = await result.current.confirmPayment(mockAppointment, mockPaymentData);

      expect(paymentResult.success).toBe(false);
      expect(paymentResult.error).toBe('Carte refusée');
    });

    it('devrait émettre un événement paymentFailed en cas d\'erreur', async () => {
      const { paymentEvents } = await import('@/lib/events');

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Erreur de paiement',
        }),
      } as Response);

      const { result } = renderHook(() => useBookingPayment());

      await result.current.confirmPayment(mockAppointment, mockPaymentData);

      await waitFor(() => {
        expect(paymentEvents.emitPaymentFailed).toHaveBeenCalledWith(
          'appointment123',
          expect.stringContaining('Erreur'),
        );
      });
    });

    it('devrait avoir un état de chargement pendant la confirmation', async () => {
      let resolveFetch: () => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = () => resolve({
          ok: true,
          json: async () => ({
            success: true,
            reservationNumber: 'RES-001',
          }),
        } as Response);
      });

      vi.mocked(fetch).mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useBookingPayment());

      const confirmPromise = result.current.confirmPayment(mockAppointment, mockPaymentData);

      // Vérifier que confirming est true pendant la confirmation
      await waitFor(() => {
        expect(result.current.confirming).toBe(true);
      });

      resolveFetch!();
      await confirmPromise;

      await waitFor(() => {
        expect(result.current.confirming).toBe(false);
      });
    });

    it('devrait avoir un état de chargement false après confirmation', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          reservationNumber: 'RES-001',
        }),
      } as Response);

      const { result } = renderHook(() => useBookingPayment());

      await result.current.confirmPayment(mockAppointment, mockPaymentData);

      await waitFor(() => {
        expect(result.current.confirming).toBe(false);
      });

      expect(result.current.confirming).toBe(false);
    });

    it('devrait gérer l\'erreur dans l\'état (error state)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Erreur de test',
        }),
      } as Response);

      const { result } = renderHook(() => useBookingPayment());

      await result.current.confirmPayment(mockAppointment, mockPaymentData);

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      expect(result.current.error).toBe('Erreur de test');
    });

    it('devrait logger les informations de paiement (logger.info)', async () => {
      const { logger } = await import('@/lib/logger');

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          reservationNumber: 'RES-001',
        }),
      } as Response);

      const { result } = renderHook(() => useBookingPayment());

      await result.current.confirmPayment(mockAppointment, mockPaymentData);

      await waitFor(() => {
        expect(logger.info).toHaveBeenCalledWith(
          expect.objectContaining({
            appointmentId: 'appointment123',
            reservationNumber: 'RES-001',
            amount: mockPaymentData.amount,
          }),
          expect.stringContaining('Payment confirmed'),
        );
      });
    });

    it('devrait logger les erreurs (logger.error)', async () => {
      const { logger } = await import('@/lib/logger');

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Erreur de paiement',
        }),
      } as Response);

      const { result } = renderHook(() => useBookingPayment());

      await result.current.confirmPayment(mockAppointment, mockPaymentData);

      await waitFor(() => {
        expect(logger.error).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.any(Error),
            appointmentId: 'appointment123',
          }),
          expect.stringContaining('Error confirming payment'),
        );
      });
    });

    it('devrait avoir les headers Content-Type corrects', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          reservationNumber: 'RES-001',
        }),
      } as Response);

      const { result } = renderHook(() => useBookingPayment());

      await result.current.confirmPayment(mockAppointment, mockPaymentData);

      expect(fetch).toHaveBeenCalledWith(
        '/api/bookings/confirm-payment',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
    });

    it('devrait avoir le body JSON correctement formaté', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          reservationNumber: 'RES-001',
        }),
      } as Response);

      const { result } = renderHook(() => useBookingPayment());

      await result.current.confirmPayment(mockAppointment, mockPaymentData);

      expect(fetch).toHaveBeenCalledWith(
        '/api/bookings/confirm-payment',
        expect.objectContaining({
          body: JSON.stringify({
            appointment: mockAppointment,
            paymentData: mockPaymentData,
          }),
        }),
      );
    });
  });

  describe('sendPaymentError', () => {
    it('devrait envoyer un email d\'erreur de paiement avec succès', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      } as Response);

      const { result } = renderHook(() => useBookingPayment());

      const sendResult = await result.current.sendPaymentError(
        mockAppointment,
        mockPaymentData,
        'Erreur de paiement',
      );

      expect(sendResult).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        '/api/bookings/payment-error',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointment: mockAppointment,
            paymentData: mockPaymentData,
            errorMessage: 'Erreur de paiement',
          }),
        }),
      );
    });

    it('devrait gérer les erreurs lors de l\'envoi d\'email d\'erreur', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Erreur d\'envoi d\'email',
        }),
      } as Response);

      const { result } = renderHook(() => useBookingPayment());

      const sendResult = await result.current.sendPaymentError(
        mockAppointment,
        mockPaymentData,
        'Erreur de paiement',
      );

      expect(sendResult).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });
});

