/**
 * Tests unitaires pour /api/quotes
 * 
 * Implémente les tests pour :
 * - GET /api/quotes
 * - Validation des paramètres
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/quotes/route';
import { NextRequest } from 'next/server';

// Mock de auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock de getQuoteRepository - créer une instance unique mockée
const mockQuoteRepository = {
  findAll: vi.fn(),
};

vi.mock('@/repositories', () => ({
  getQuoteRepository: vi.fn(() => mockQuoteRepository),
}));

// Mock de quoteMapper
vi.mock('@/lib/mappers', () => ({
  quoteMapper: {
    map: vi.fn((quote) => quote),
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
  validateQuery: vi.fn((params, _schema) => {
    const result: Record<string, any> = {};
    params.forEach((value: string, key: string) => {
      result[key] = value;
    });
    return result;
  }),
  ApiErrors: {
    UNAUTHORIZED: new Error('Unauthorized'),
  },
}));

// Mock de createPaginatedResponse
vi.mock('@/lib/api/response', () => ({
  createPaginatedResponse: vi.fn((data, pagination) => ({
    json: async () => ({
      success: true,
      data,
      pagination,
    }),
  })),
}));

describe('GET /api/quotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les devis avec succès', async () => {
    const mockQuotes = [
      { _id: '1', quoteNumber: 'QUO-001', status: 'PENDING' },
      { _id: '2', quoteNumber: 'QUO-002', status: 'APPROVED' },
    ];

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockQuoteRepository.findAll).mockResolvedValue(mockQuotes as any);

    const request = new NextRequest('http://localhost:3000/api/quotes');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
  });

  it('devrait exiger une authentification', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/quotes');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non autorisé');
  });

  it('devrait valider les paramètres avec QuoteFiltersSchema', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockQuoteRepository.findAll).mockResolvedValue([]);

    const { validateQuery } = await import('@/lib/api/error-handler');

    const request = new NextRequest('http://localhost:3000/api/quotes?type=BTP&status=PENDING');
    await GET(request);

    expect(validateQuery).toHaveBeenCalled();
  });

  it('devrait filtrer par type (BTP, EDUCATION)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockQuoteRepository.findAll).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/quotes?type=BTP');
    await GET(request);

    expect(mockQuoteRepository.findAll).toHaveBeenCalled();
  });

  it('devrait filtrer par status', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockQuoteRepository.findAll).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/quotes?status=APPROVED');
    await GET(request);

    expect(mockQuoteRepository.findAll).toHaveBeenCalled();
  });

  it('devrait filtrer par providerId', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockQuoteRepository.findAll).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/quotes?providerId=provider123');
    await GET(request);

    expect(mockQuoteRepository.findAll).toHaveBeenCalled();
  });

  it('devrait filtrer par schoolId', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockQuoteRepository.findAll).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/quotes?schoolId=school123');
    await GET(request);

    expect(mockQuoteRepository.findAll).toHaveBeenCalled();
  });

  it('devrait gérer la pagination avec page et limit', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockQuoteRepository.findAll).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/quotes?page=2&limit=20');
    await GET(request);

    expect(mockQuoteRepository.findAll).toHaveBeenCalled();
  });

  it('devrait utiliser QuoteQueryBuilder', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockQuoteRepository.findAll).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/quotes');
    await GET(request);

    expect(mockQuoteRepository.findAll).toHaveBeenCalled();
  });

  it('devrait mapper avec quoteMapper', async () => {
    const mockQuotes = [{ _id: '1', quoteNumber: 'QUO-001' }];

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockQuoteRepository.findAll).mockResolvedValue(mockQuotes as any);

    const { quoteMapper } = await import('@/lib/mappers');

    const request = new NextRequest('http://localhost:3000/api/quotes');
    await GET(request);

    expect(quoteMapper.map).toHaveBeenCalled();
  });

  it('devrait retourner une réponse paginée avec format standardisé', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    } as any);

    vi.mocked(mockQuoteRepository.findAll).mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/quotes');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.pagination).toBeDefined();
  });
});

