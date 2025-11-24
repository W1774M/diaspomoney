/**
 * Tests unitaires pour /api/payments/transactions
 * 
 * Implémente les tests pour :
 * - GET /api/payments/transactions
 * - Transformation en PaymentTransaction
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/payments/transactions/route';
import { NextRequest } from 'next/server';

// Mock de auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock de getTransactionRepository - créer une instance unique mockée
const mockTransactionRepository = {
  findTransactionsWithFilters: vi.fn(),
};

vi.mock('@/repositories', () => ({
  getTransactionRepository: vi.fn(() => mockTransactionRepository),
}));

describe('GET /api/payments/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les transactions avec succès', async () => {
    const mockTransactions = [
      {
        _id: 'txn1',
        id: 'txn1',
        amount: 1000,
        currency: 'EUR',
        status: 'COMPLETED',
        paymentMethod: 'CARD',
        paymentIntentId: 'pi_123',
        metadata: { orderId: 'order123', bookingId: 'booking123' },
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123' },
    } as any);

    vi.mocked(mockTransactionRepository.findTransactionsWithFilters).mockResolvedValue({
      data: mockTransactions as any,
      total: 1,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        pages: 1,
        total: 1,
        hasNext: false,
        hasPrev: false,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/payments/transactions');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.transactions).toHaveLength(1);
    expect(data.transactions[0].transactionId).toBe('txn1');
  });

  it('devrait exiger une authentification (401)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/payments/transactions');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non autorisé');
  });

  it('devrait filtrer par payerId (userId)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123' },
    } as any);

    vi.mocked(mockTransactionRepository.findTransactionsWithFilters).mockResolvedValue({
      data: [],
      total: 0,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        pages: 0,
        total: 0,
        hasNext: false,
        hasPrev: false,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/payments/transactions');
    await GET(request);

    expect(mockTransactionRepository.findTransactionsWithFilters).toHaveBeenCalledWith(
      { payerId: 'user123' },
      expect.objectContaining({
        limit: 100,
        page: 1,
        offset: 0,
        sort: { createdAt: -1 },
      }),
    );
  });

  it('devrait transformer en PaymentTransaction', async () => {
    const mockTransaction = {
      _id: 'txn1',
      id: 'txn1',
      amount: 1000,
      currency: 'EUR',
      status: 'COMPLETED',
      paymentMethod: 'CARD',
      paymentIntentId: 'pi_123',
      metadata: { orderId: 'order123', bookingId: 'booking123', invoiceId: 'inv_123' },
      completedAt: new Date('2024-01-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123' },
    } as any);

    vi.mocked(mockTransactionRepository.findTransactionsWithFilters).mockResolvedValue({
      data: [mockTransaction] as any,
      total: 1,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        pages: 1,
        total: 1,
        hasNext: false,
        hasPrev: false,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/payments/transactions');
    const response = await GET(request);
    const data = await response.json();

    expect(data.transactions[0]).toMatchObject({
      _id: 'txn1',
      transactionId: 'txn1',
      orderId: 'order123',
      bookingId: 'booking123',
      invoiceId: 'inv_123',
      amount: 1000,
      currency: 'EUR',
      paymentMethod: 'card', // lowercase
      paymentMethodId: 'pi_123',
      status: 'completed', // lowercase
    });
  });

  it('devrait gérer refundedAt et refundAmount pour les transactions remboursées', async () => {
    const mockTransaction = {
      _id: 'txn1',
      id: 'txn1',
      amount: 1000,
      currency: 'EUR',
      status: 'REFUNDED',
      paymentMethod: 'CARD',
      paymentIntentId: 'pi_123',
      metadata: {},
      completedAt: new Date('2024-01-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123' },
    } as any);

    vi.mocked(mockTransactionRepository.findTransactionsWithFilters).mockResolvedValue({
      data: [mockTransaction] as any,
      total: 1,
      pagination: {
        page: 1,
        limit: 20,
        offset: 0,
        pages: 1,
        total: 1,
        hasNext: false,
        hasPrev: false,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/payments/transactions');
    const response = await GET(request);
    const data = await response.json();

    expect(data.transactions[0].refundedAt).toBeDefined();
    expect(data.transactions[0].refundAmount).toBe(1000);
  });

  it('devrait gérer les erreurs (500)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123' },
    } as any);

    const { getTransactionRepository } = await import('@/repositories');
    const mockRepository = getTransactionRepository();
    vi.mocked(mockTransactionRepository.findTransactionsWithFilters).mockRejectedValue(
      new Error('Database error'),
    );

    const request = new NextRequest('http://localhost:3000/api/payments/transactions');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erreur lors de la récupération des transactions');
  });
});

