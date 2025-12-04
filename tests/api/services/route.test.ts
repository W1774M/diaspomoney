/**
 * Tests unitaires pour /api/services
 * 
 * Implémente les tests pour :
 * - GET /api/services avec filtres
 * - POST /api/services (admin seulement)
 * - Authentification et autorisation
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/services/route';
import { NextRequest } from 'next/server';

// Mock de auth - utiliser vi.hoisted() pour que les variables soient disponibles dans vi.mock
const { mockAuth } = vi.hoisted(() => {
  return {
    mockAuth: vi.fn(),
  };
});

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

// Mock de serviceService
vi.mock('@/services/service/service.service', () => ({
  serviceService: {
    getAllServices: vi.fn(),
    createService: vi.fn(),
  },
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
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        return {
          json: async () => ({ success: false, error: 'Unauthorized' }),
          status: 401,
        };
      }
      if (error instanceof Error && error.message === 'Forbidden') {
        return {
          json: async () => ({ success: false, error: 'Forbidden' }),
          status: 403,
        };
      }
      throw error;
    }
  }),
  validateBody: vi.fn((body) => body),
  ApiErrors: {
    UNAUTHORIZED: new Error('Unauthorized'),
    FORBIDDEN: new Error('Forbidden'),
  },
}));

// Mock de createListResponse et createResourceResponse
vi.mock('@/lib/api/response', () => ({
  createListResponse: vi.fn((data, metadata) => ({
    json: async () => ({
      success: true,
      data,
      ...metadata,
    }),
    status: 200,
  })),
  createResourceResponse: vi.fn((data, metadata) => ({
    json: async () => ({
      success: true,
      data,
      ...metadata,
    }),
    status: 200,
  })),
}));

// Mock de logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  childLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe('GET /api/services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les services avec succès', async () => {
    const mockServices = [
      {
        id: 'service1',
        _id: 'service1',
        category: 'HEALTH' as const,
        label: 'Service 1',
        description: 'Service description',
        price: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockAuth.mockResolvedValueOnce({
      user: { roles: ['CUSTOMER'] },
    });
    const { serviceService } = await import('@/services/service/service.service');
    vi.mocked(serviceService.getAllServices).mockResolvedValueOnce(mockServices);

    const request = new NextRequest('http://localhost:3000/api/services');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(vi.mocked(serviceService.getAllServices)).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
      }),
    );
  });

  it('devrait filtrer par catégorie', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { roles: ['CUSTOMER'] },
    });
    const { serviceService } = await import('@/services/service/service.service');
    vi.mocked(serviceService.getAllServices).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/services?category=HEALTH');
    await GET(request);

    expect(vi.mocked(serviceService.getAllServices)).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'HEALTH',
      }),
    );
  });

  it('devrait permettre aux admins de voir les services inactifs', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { roles: ['ADMIN'] },
    });
    const { serviceService } = await import('@/services/service/service.service');
    vi.mocked(serviceService.getAllServices).mockResolvedValueOnce([]);

    const request = new NextRequest('http://localhost:3000/api/services?isActive=false');
    await GET(request);

    expect(vi.mocked(serviceService.getAllServices)).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: false,
      }),
    );
  });
});

describe('POST /api/services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait créer un service avec succès (admin)', async () => {
    const mockService = {
      id: 'service1',
      _id: 'service1',
      category: 'HEALTH' as const,
      label: 'New Service',
      description: 'Service description',
      price: 100,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin123', roles: ['ADMIN'] },
    });
    const { serviceService } = await import('@/services/service/service.service');
    vi.mocked(serviceService.createService).mockResolvedValueOnce(mockService);

    const request = new NextRequest('http://localhost:3000/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Service',
        category: 'HEALTH',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(vi.mocked(serviceService.createService)).toHaveBeenCalled();
  });

  it('devrait retourner 401 si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Service',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('devrait retourner 403 si non admin', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user123', roles: ['CUSTOMER'] },
    });

    const request = new NextRequest('http://localhost:3000/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Service',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('devrait valider le body avec CreateServiceSchema', async () => {
    const { validateBody } = await import('@/lib/api/error-handler');
    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin123', roles: ['ADMIN'] },
    });
    const { serviceService } = await import('@/services/service/service.service');
    vi.mocked(serviceService.createService).mockResolvedValueOnce({
      id: 'service1',
      _id: 'service1',
      category: 'HEALTH' as const,
      label: 'Service 1',
      description: 'Service description',
      price: 100,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Service',
      }),
    });

    await POST(request);

    expect(validateBody).toHaveBeenCalled();
  });
});

