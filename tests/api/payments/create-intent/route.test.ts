/**
 * Tests unitaires pour /api/payments/create-intent
 * 
 * Implémente les tests pour :
 * - POST /api/payments/create-intent
 * - Intégration avec Stripe
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/payments/create-intent/route';
import { NextRequest } from 'next/server';

// Mock de auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock de paymentService
vi.mock('@/services/payment/payment.service.strategy', () => ({
  paymentService: {
    createPaymentIntent: vi.fn(),
  },
}));

// Mock de handleApiRoute
vi.mock('@/lib/api/error-handler', () => ({
  handleApiRoute: vi.fn(async (_request, handler) => {
    const result = await handler();
    return {
      json: async () => result,
      status: 200,
    };
  }),
  validateBody: vi.fn((body) => body),
}));

// Mock de childLogger
vi.mock('@/lib/logger', () => ({
  childLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('POST /api/payments/create-intent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait créer un PaymentIntent avec succès', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123' },
    } as any);

    const { paymentService } = await import('@/services/payment/payment.service.strategy');
    vi.mocked(paymentService.createPaymentIntent).mockResolvedValue({
      id: 'pi_123',
      clientSecret: 'pi_123_secret_test',
      amount: 10.0,
      currency: 'EUR',
      status: 'requires_payment_method',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000, // centimes
        currency: 'EUR',
        email: 'test@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.clientSecret).toBe('pi_123_secret_test');
    expect(data.paymentIntentId).toBe('pi_123');
    expect(data.amount).toBe(1000); // Retourné en centimes
  });

  it('devrait permettre l\'authentification optionnelle (guest)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue(null); // Pas de session

    const { paymentService } = await import('@/services/payment/payment.service.strategy');
    vi.mocked(paymentService.createPaymentIntent).mockResolvedValue({
      id: 'pi_123',
      clientSecret: 'pi_123_secret_test',
      amount: 10.0,
      currency: 'EUR',
      status: 'requires_payment_method',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        currency: 'EUR',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.clientSecret).toBeDefined();
    expect(paymentService.createPaymentIntent).toHaveBeenCalledWith(
      10.0, // montant en euros
      'EUR',
      'guest', // customerId = 'guest' si pas de session
      expect.any(Object),
    );
  });

  it('devrait valider avec CreatePaymentIntentSchema', async () => {
    const { validateBody } = await import('@/lib/api/error-handler');
    vi.mocked(validateBody).mockImplementation((body) => {
      const bodyTyped = body as any;
      if (!bodyTyped.amount || bodyTyped.amount <= 0) {
        throw new Error('Amount is required and must be positive');
      }
      return body;
    });

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: -100, // Montant invalide
        currency: 'EUR',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect([400, 500]).toContain(response.status);
    expect(data.success).toBe(false);
  });

  it('devrait convertir le montant (centimes → euros)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123' },
    } as any);

    const { paymentService } = await import('@/services/payment/payment.service.strategy');
    vi.mocked(paymentService.createPaymentIntent).mockResolvedValue({
      id: 'pi_123',
      clientSecret: 'pi_123_secret_test',
      amount: 10.0,
      currency: 'EUR',
      status: 'requires_payment_method',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000, // 1000 centimes = 10 euros
        currency: 'EUR',
      }),
    });

    await POST(request);

    expect(paymentService.createPaymentIntent).toHaveBeenCalledWith(
      10.0, // 1000 centimes convertis en 10.0 euros
      'EUR',
      'user123',
      expect.any(Object),
    );
  });

  it('devrait ajouter metadata (customerEmail, userId)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123' },
    } as any);

    const { paymentService } = await import('@/services/payment/payment.service.strategy');
    vi.mocked(paymentService.createPaymentIntent).mockResolvedValue({
      id: 'pi_123',
      clientSecret: 'pi_123_secret_test',
      amount: 10.0,
      currency: 'EUR',
      status: 'requires_payment_method',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        currency: 'EUR',
        email: 'test@example.com',
        metadata: { orderId: 'order123' },
      }),
    });

    await POST(request);

    expect(paymentService.createPaymentIntent).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        customerEmail: 'test@example.com',
        userId: 'user123',
        orderId: 'order123',
      }),
    );
  });

  it('devrait vérifier que clientSecret est présent', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123' },
    } as any);

    const { paymentService } = await import('@/services/payment/payment.service.strategy');
    vi.mocked(paymentService.createPaymentIntent).mockResolvedValue({
      id: 'pi_123',
      clientSecret: null, // clientSecret manquant
      amount: 10.0,
      currency: 'EUR',
      status: 'requires_payment_method',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        currency: 'EUR',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });

  it('devrait convertir le montant retour (euros → centimes)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123' },
    } as any);

    const { paymentService } = await import('@/services/payment/payment.service.strategy');
    vi.mocked(paymentService.createPaymentIntent).mockResolvedValue({
      id: 'pi_123',
      clientSecret: 'pi_123_secret_test',
      amount: 10.0, // en euros
      currency: 'EUR',
      status: 'requires_payment_method',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        currency: 'EUR',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.amount).toBe(1000); // 10.0 euros * 100 = 1000 centimes
  });

  it('devrait retourner clientSecret, paymentIntentId, currency, amount, status', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123' },
    } as any);

    const { paymentService } = await import('@/services/payment/payment.service.strategy');
    vi.mocked(paymentService.createPaymentIntent).mockResolvedValue({
      id: 'pi_123',
      clientSecret: 'pi_123_secret_test',
      amount: 10.0,
      currency: 'EUR',
      status: 'requires_payment_method',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        currency: 'EUR',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data).toHaveProperty('clientSecret');
    expect(data).toHaveProperty('paymentIntentId');
    expect(data).toHaveProperty('currency');
    expect(data).toHaveProperty('amount');
    expect(data).toHaveProperty('status');
  });

  it('devrait logger avec childLogger', async () => {
    const { childLogger } = await import('@/lib/logger');
    const mockLog = {
      info: vi.fn(),
      error: vi.fn(),
    };
    vi.mocked(childLogger).mockReturnValue(mockLog as any);

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123' },
    } as any);

    const { paymentService } = await import('@/services/payment/payment.service.strategy');
    vi.mocked(paymentService.createPaymentIntent).mockResolvedValue({
      id: 'pi_123',
      clientSecret: 'pi_123_secret_test',
      amount: 10.0,
      currency: 'EUR',
      status: 'requires_payment_method',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'x-request-id': 'req123',
      },
      body: JSON.stringify({
        amount: 1000,
        currency: 'EUR',
      }),
    });

    await POST(request);

    expect(childLogger).toHaveBeenCalledWith({
      requestId: 'req123',
      route: 'payments/create-intent',
    });
    expect(mockLog.info).toHaveBeenCalled();
  });
});

