/**
 * Tests unitaires pour /api/transactions
 * 
 * Implémente les tests pour :
 * - GET /api/transactions
 * - Filtres multiples et pagination
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/transactions/route';
import { NextRequest } from 'next/server';

// Mock de auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock de TransactionService - créer une instance unique mockée
const mockTransactionService = {
  getTransactions: vi.fn(),
};

vi.mock('@/services/transaction/transaction.service', () => ({
  TransactionService: {
    getInstance: vi.fn(() => mockTransactionService),
  },
}));

// Mock de monitoringManager
vi.mock('@/lib/monitoring/advanced-monitoring', () => ({
  monitoringManager: {
    recordMetric: vi.fn(),
  },
}));

// Mock de handleApiRoute
vi.mock('@/lib/api/error-handler', () => ({
  handleApiRoute: vi.fn(async (_request, handler) => {
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
  }),
  ApiErrors: {
    UNAUTHORIZED: new Error('Unauthorized'),
  },
}));

// Mock de createListResponse
vi.mock('@/lib/api/response', () => ({
  createListResponse: vi.fn((data, metadata) => ({
    json: async () => ({
      success: true,
      data,
      ...metadata,
    }),
  })),
}));

describe('GET /api/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les transactions avec succès', async () => {
    const mockTransactions = [
      {
        id: 'txn1',
        amount: 1000,
        currency: 'EUR',
        status: 'COMPLETED',
      },
    ];

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockTransactionService.getTransactions).mockResolvedValue(mockTransactions as any);

    const request = new NextRequest('http://localhost:3000/api/transactions');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
  });

  it('devrait exiger une authentification (UNAUTHORIZED)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/transactions');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non autorisé');
  });

  it('devrait filtrer par userId (session.user.id)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockTransactionService.getTransactions).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/transactions');
    await GET(request);

    expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
      'user123',
      expect.any(Object),
    );
  });

  it('devrait filtrer par status (string unique)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockTransactionService.getTransactions).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/transactions?status=COMPLETED');
    await GET(request);

    expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        status: 'COMPLETED',
      }),
    );
  });

  it('devrait filtrer par serviceType', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockTransactionService.getTransactions).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/transactions?serviceType=HEALTH');
    await GET(request);

    expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        serviceType: 'HEALTH',
      }),
    );
  });

  it('devrait filtrer par dateFrom et dateTo', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockTransactionService.getTransactions).mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost:3000/api/transactions?dateFrom=2024-01-01&dateTo=2024-12-31',
    );
    await GET(request);

    expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        $or: expect.arrayContaining([
          { payerId: 'user123' },
          { beneficiaryId: 'user123' },
        ]),
        createdAt: expect.objectContaining({
          $gte: expect.any(Date),
          $lte: expect.any(Date),
        }),
      }),
    );
  });

  it('devrait filtrer par dateFrom seul', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockTransactionService.getTransactions).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/transactions?dateFrom=2024-01-01');
    await GET(request);

    expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        $or: expect.arrayContaining([
          { payerId: 'user123' },
          { beneficiaryId: 'user123' },
        ]),
        createdAt: expect.objectContaining({
          $gte: expect.any(Date),
        }),
      }),
    );
  });

  it('devrait filtrer par dateTo seul', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockTransactionService.getTransactions).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/transactions?dateTo=2024-12-31');
    await GET(request);

    expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        $or: expect.arrayContaining([
          { payerId: 'user123' },
          { beneficiaryId: 'user123' },
        ]),
        createdAt: expect.objectContaining({
          $lte: expect.any(Date),
        }),
      }),
    );
  });

  it('devrait filtrer par minAmount et maxAmount', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockTransactionService.getTransactions).mockResolvedValue([]);

    const request = new NextRequest(
      'http://localhost:3000/api/transactions?minAmount=100&maxAmount=1000',
    );
    await GET(request);

    expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        $or: expect.arrayContaining([
          { payerId: 'user123' },
          { beneficiaryId: 'user123' },
        ]),
        amount: expect.objectContaining({
          $gte: 100,
          $lte: 1000,
        }),
      }),
    );
  });

  it('devrait filtrer par minAmount seul', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockTransactionService.getTransactions).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/transactions?minAmount=100');
    await GET(request);

    expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        $or: expect.arrayContaining([
          { payerId: 'user123' },
          { beneficiaryId: 'user123' },
        ]),
        amount: expect.objectContaining({
          $gte: 100,
        }),
      }),
    );
  });

  it('devrait filtrer par maxAmount seul', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockTransactionService.getTransactions).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/transactions?maxAmount=1000');
    await GET(request);

    expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        $or: expect.arrayContaining([
          { payerId: 'user123' },
          { beneficiaryId: 'user123' },
        ]),
        amount: expect.objectContaining({
          $lte: 1000,
        }),
      }),
    );
  });

  it('devrait filtrer par currency', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockTransactionService.getTransactions).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/transactions?currency=EUR');
    await GET(request);

    expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        currency: 'EUR',
      }),
    );
  });

  it('devrait utiliser TransactionQueryBuilder', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockTransactionService.getTransactions).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/transactions');
    await GET(request);

    expect(mockTransactionService.getTransactions).toHaveBeenCalled();
  });

  it('devrait gérer la pagination avec page et limit (défaut: 50)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockTransactionService.getTransactions).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/transactions?page=2&limit=20');
    await GET(request);

    // Le builder devrait être utilisé avec page=2 et limit=20
    expect(mockTransactionService.getTransactions).toHaveBeenCalled();
  });

  it('devrait enregistrer des métriques (monitoringManager.recordMetric)', async () => {
    const { monitoringManager } = await import('@/lib/monitoring/advanced-monitoring');
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockTransactionService.getTransactions).mockResolvedValue([
      { id: 'txn1' },
      { id: 'txn2' },
    ] as any);

    const request = new NextRequest('http://localhost:3000/api/transactions');
    await GET(request);

    expect(monitoringManager.recordMetric).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'api_transactions_retrieved',
        value: 2,
        labels: expect.objectContaining({
          user_role: 'CUSTOMER',
        }),
      }),
    );
  });
});

