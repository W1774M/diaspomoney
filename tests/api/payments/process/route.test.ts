/**
 * Tests unitaires pour /api/payments/process
 * 
 * Implémente les tests pour :
 * - POST /api/payments/process
 * - Intégration avec PaymentFacade et Command Pattern
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/payments/process/route';
import { NextRequest } from 'next/server';

// Mock de auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock de commandHandler et CreatePaymentCommand
vi.mock('@/commands', () => {
  const mockCreatePaymentCommand = vi.fn().mockImplementation(function (this: any, data: any) {
    this.data = data;
    return this;
  });
  return {
    commandHandler: {
      execute: vi.fn(),
    },
    CreatePaymentCommand: mockCreatePaymentCommand,
  };
});

// Mock de handleApiRoute
vi.mock('@/lib/api/error-handler', () => ({
  handleApiRoute: vi.fn(async (_request, handler) => {
    try {
      const result = await handler();
      // Si le résultat a déjà une méthode json(), le retourner tel quel
      if (result && typeof result === 'object' && 'json' in result) {
        return result;
      }
      // Sinon, envelopper dans un objet avec json()
      return {
        json: async () => result,
        status: 200,
      };
    } catch (error: any) {
      // Gérer les erreurs ApiError
      if (error.status || error.statusCode) {
        return {
          json: async () => ({ error: error.message || 'Erreur', success: false }),
          status: error.status || error.statusCode,
        };
      }
      // Si c'est UNAUTHORIZED ou autre erreur ApiErrors
      if (error.message === 'Unauthorized') {
        return {
          json: async () => ({ error: 'Non autorisé', success: false }),
          status: 401,
        };
      }
      if (error.message === 'Forbidden') {
        return {
          json: async () => ({ error: 'Accès non autorisé', success: false }),
          status: 403,
        };
      }
      // Autres erreurs
      return {
        json: async () => ({ error: error.message || 'Erreur interne du serveur', success: false }),
        status: 500,
      };
    }
  }),
  validateBody: vi.fn((body) => body),
  ApiErrors: {
    UNAUTHORIZED: new Error('Unauthorized'),
    FORBIDDEN: new Error('Forbidden'),
    INTERNAL_ERROR: new Error('Internal Error'),
  },
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
    }
  },
}));

// Mock de logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
  },
}));

// Mock de initializeDI
vi.mock('@/lib/di/initialize', () => ({
  initializeDI: vi.fn(),
}));

describe('POST /api/payments/process', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait traiter un paiement avec succès', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    const { commandHandler } = await import('@/commands');
    vi.mocked(commandHandler.execute).mockResolvedValue({
      success: true,
      data: {
        paymentIntentId: 'pi_123',
        transactionId: 'txn_123',
        invoiceId: 'inv_123',
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/process', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        currency: 'EUR',
        paymentMethodId: 'pm_123',
        serviceType: 'HEALTH',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.paymentIntentId).toBe('pi_123');
    expect(data.transactionId).toBe('txn_123');
    expect(data.invoiceId).toBe('inv_123');
  });

  it('devrait exiger une authentification (UNAUTHORIZED)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/payments/process', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        currency: 'EUR',
        paymentMethodId: 'pm_123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non autorisé');
  });

  it('devrait vérifier le rôle CUSTOMER (FORBIDDEN)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['ADMIN'] }, // Pas CUSTOMER
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/process', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        currency: 'EUR',
        paymentMethodId: 'pm_123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Accès non autorisé');
  });

  it('devrait valider avec CreatePaymentSchema', async () => {
    const { validateBody } = await import('@/lib/api/error-handler');
    vi.mocked(validateBody).mockImplementation((body) => {
      const bodyTyped = body as any;
      if (!bodyTyped.amount || bodyTyped.amount <= 0) {
        throw new Error('Amount is required and must be positive');
      }
      return body;
    });

    const request = new NextRequest('http://localhost:3000/api/payments/process', {
      method: 'POST',
      body: JSON.stringify({
        amount: -100, // Montant invalide
        currency: 'EUR',
      }),
    });

    await expect(POST(request)).rejects.toThrow();
  });

  it('devrait construire PaymentFacadeData', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    const { commandHandler } = await import('@/commands');
    vi.mocked(commandHandler.execute).mockResolvedValue({
      success: true,
      data: {
        paymentIntentId: 'pi_123',
        transactionId: 'txn_123',
        invoiceId: 'inv_123',
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/process', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        currency: 'EUR',
        paymentMethodId: 'pm_123',
        serviceType: 'HEALTH',
        serviceId: 'service123',
        description: 'Test payment',
        createInvoice: true,
        sendNotification: true,
      }),
    });

    await POST(request);

    const { CreatePaymentCommand } = await import('@/commands');
    expect(vi.mocked(CreatePaymentCommand)).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1000,
        currency: 'EUR',
        customerId: 'user123',
        paymentMethodId: 'pm_123',
        serviceType: 'HEALTH',
        serviceId: 'service123',
        description: 'Test payment',
        createInvoice: true,
        sendNotification: true,
      }),
    );
  });

  it('devrait utiliser CreatePaymentCommand', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    const { commandHandler } = await import('@/commands');
    vi.mocked(commandHandler.execute).mockResolvedValue({
      success: true,
      data: {
        paymentIntentId: 'pi_123',
        transactionId: 'txn_123',
        invoiceId: 'inv_123',
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/process', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        currency: 'EUR',
        paymentMethodId: 'pm_123',
        serviceType: 'HEALTH',
      }),
    });

    await POST(request);

    const { CreatePaymentCommand } = await import('@/commands');
    expect(vi.mocked(CreatePaymentCommand)).toHaveBeenCalled();
    expect(commandHandler.execute).toHaveBeenCalled();
  });

  it('devrait gérer les erreurs (commandResult.success = false)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    const { commandHandler } = await import('@/commands');
    vi.mocked(commandHandler.execute).mockResolvedValue({
      success: false,
      error: 'Erreur de paiement',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/process', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        currency: 'EUR',
        paymentMethodId: 'pm_123',
        serviceType: 'HEALTH',
      }),
    });

    await expect(POST(request)).rejects.toThrow();
  });

  it('devrait gérer requiresAction (3D Secure)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    const { commandHandler } = await import('@/commands');
    vi.mocked(commandHandler.execute).mockResolvedValue({
      success: true,
      data: {
        requiresAction: true,
        nextAction: {
          type: 'use_stripe_sdk',
          use_stripe_sdk: {
            client_secret: 'pi_123_secret',
          },
        },
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/process', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        currency: 'EUR',
        paymentMethodId: 'pm_123',
        serviceType: 'HEALTH',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.requiresAction).toBe(true);
    expect(data.nextAction).toBeDefined();
  });

  it('devrait logger avec logger.info', async () => {
    const { logger } = await import('@/lib/logger');
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    const { commandHandler } = await import('@/commands');
    vi.mocked(commandHandler.execute).mockResolvedValue({
      success: true,
      data: {
        paymentIntentId: 'pi_123',
        transactionId: 'txn_123',
        invoiceId: 'inv_123',
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/process', {
      method: 'POST',
      body: JSON.stringify({
        amount: 1000,
        currency: 'EUR',
        paymentMethodId: 'pm_123',
        serviceType: 'HEALTH',
      }),
    });

    await POST(request);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentIntentId: 'pi_123',
        transactionId: 'txn_123',
        invoiceId: 'inv_123',
        userId: 'user123',
      }),
      expect.stringContaining('Payment processed'),
    );
  });
});

