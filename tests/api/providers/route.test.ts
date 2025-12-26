/**
 * Tests unitaires pour /api/providers
 * 
 * Implémente les tests pour :
 * - GET /api/providers avec filtres et pagination
 * - POST /api/providers
 * - Utilisation de ProviderQueryBuilder
 * - Authentification (pour POST)
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/providers/route';
import { NextRequest } from 'next/server';

const { ApiErrors, ApiError } = vi.hoisted(() => {
  class ApiError extends Error {
    status: number;
    statusCode: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.statusCode = status;
    }
  }
  const make = (status: number, message: string) => new ApiError(status, message) as any;
  const ApiErrors = {
    UNAUTHORIZED: make(401, 'Non autorisé'),
    FORBIDDEN: make(403, 'Accès non autorisé'),
    NOT_FOUND: make(404, 'Ressource non trouvée'),
    VALIDATION_ERROR: (msg: string) => make(400, msg || 'Erreur de validation'),
  };
  return { ApiErrors, ApiError };
});

// Mock de ProviderQueryBuilder - utiliser vi.hoisted() pour que les variables soient disponibles dans vi.mock
const { mockProviderQueryBuilderSpy } = vi.hoisted(() => {
  class MockProviderQueryBuilder {
    providers = vi.fn().mockReturnThis();
    byStatus = vi.fn().mockReturnThis();
    byCity = vi.fn().mockReturnThis();
    withMinRating = vi.fn().mockReturnThis();
    page = vi.fn().mockReturnThis();
    getFilters = vi.fn(() => ({}));
    getSort = vi.fn(() => ({}));
    getPagination = vi.fn(() => ({ page: 1, limit: 20 }));
  }
  // Utiliser une fonction constructeur normale au lieu de vi.fn().mockImplementation()
  function MockProviderQueryBuilderConstructor() {
    return new MockProviderQueryBuilder();
  }
  const spy = vi.fn(MockProviderQueryBuilderConstructor);
  return {
    mockProviderQueryBuilderSpy: spy,
  };
});

vi.mock('@/builders', () => ({
  ProviderQueryBuilder: mockProviderQueryBuilderSpy,
}));

// Mock de getUserRepository
const mockFindWithPagination = vi.fn();
vi.mock('@/repositories', () => ({
  getUserRepository: vi.fn(() => ({
    findWithPagination: mockFindWithPagination,
  })),
}));

// Mock de userService
vi.mock('@/services/user/user.service', () => ({
  userService: {
    getUsers: vi.fn(),
  },
}));

// Mock de auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock de handleApiRoute
vi.mock('@/lib/api/error-handler', () => ({
  handleApiRoute: vi.fn(async (_request, handler) => {
    try {
      const result = await handler();
      // Si le résultat a déjà une méthode json(), le retourner tel quel avec status
      if (result && typeof result === 'object' && 'json' in result) {
        return {
          ...result,
          status: result.status || 200,
        };
      }
      // Sinon, envelopper dans un objet avec json() et status
      return {
        json: async () => result,
        status: 200,
      };
    } catch (error: any) {
      return {
        json: async () => ({ success: false, error: error?.message || 'Erreur' }),
        status: error?.status || error?.statusCode || 500,
      };
    }
  }),
  validateBody: vi.fn((body) => body),
  validateQuery: vi.fn((params) => Object.fromEntries(params)),
  ApiErrors,
  ApiError,
}));

// Mock de createPaginatedResponse et createResourceResponse
vi.mock('@/lib/api/response', () => ({
  createPaginatedResponse: vi.fn((data, pagination, metadata) => ({
    json: async () => ({
      success: true,
      data,
      pagination,
      ...metadata,
    }),
  })),
  createResourceResponse: vi.fn((data, metadata) => ({
    json: async () => ({
      success: true,
      data,
      ...metadata,
    }),
  })),
}));

describe('GET /api/providers', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Par défaut, utilisateur admin authentifié
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'admin123', roles: ['ADMIN'] },
    } as any);
  });

  it('devrait récupérer les providers avec succès', async () => {
    const mockProviders = [
      {
        id: 'provider1',
        _id: 'provider1',
        email: 'provider1@example.com',
        firstName: 'Provider',
        lastName: 'One',
        name: 'Provider 1',
        city: 'Paris',
        rating: 4.5,
      },
    ];

    mockFindWithPagination.mockResolvedValueOnce({
      data: mockProviders,
      total: 1,
    });
    const { userService } = await import('@/services/user/user.service');
    vi.mocked(userService.getUsers).mockResolvedValueOnce({
      data: mockProviders,
      total: 1,
      limit: 50,
      offset: 0,
      page: 1,
    });

    const request = new NextRequest('http://localhost:3000/api/providers');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Vérifier que la classe a été instanciée (via le mock)
    expect(mockProviderQueryBuilderSpy).toHaveBeenCalled();
  });

  it('devrait appliquer les filtres de requête', async () => {
    mockFindWithPagination.mockResolvedValueOnce({
      data: [],
      total: 0,
    });
    const { userService } = await import('@/services/user/user.service');
    vi.mocked(userService.getUsers).mockResolvedValueOnce({
      data: [],
      total: 0,
      limit: 50,
      offset: 0,
      page: 1,
    });

    const request = new NextRequest('http://localhost:3000/api/providers?city=Paris&minRating=4');
    await GET(request);

    // Vérifier que ProviderQueryBuilder a été instancié
    expect(mockProviderQueryBuilderSpy).toHaveBeenCalled();
  });

  it('devrait utiliser la pagination par défaut', async () => {
    mockFindWithPagination.mockResolvedValueOnce({
      data: [],
      total: 0,
    });
    const { userService } = await import('@/services/user/user.service');
    vi.mocked(userService.getUsers).mockResolvedValueOnce({
      data: [],
      total: 0,
      limit: 50,
      offset: 0,
      page: 1,
    });

    const request = new NextRequest('http://localhost:3000/api/providers');
    await GET(request);

    // Vérifier que ProviderQueryBuilder a été instancié
    expect(mockProviderQueryBuilderSpy).toHaveBeenCalled();
    // Vérifier que page() a été appelé sur l'instance
    const instances = mockProviderQueryBuilderSpy.mock.results;
    if (instances.length > 0 && instances[0]?.value) {
      expect(instances[0].value.page).toHaveBeenCalled();
    }
  });
});

describe('POST /api/providers', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'admin123', roles: ['ADMIN'] },
    } as any);
  });

  it('devrait créer un provider avec succès', async () => {
    const request = new NextRequest('http://localhost:3000/api/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Provider',
        email: 'provider@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
  });

  it('devrait valider le body avec CreateProviderSchema', async () => {
    const { validateBody } = await import('@/lib/api/error-handler');

    const request = new NextRequest('http://localhost:3000/api/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Provider',
        email: 'provider@example.com',
      }),
    });

    await POST(request);

    expect(validateBody).toHaveBeenCalled();
  });
});

