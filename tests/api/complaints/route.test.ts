/**
 * Tests unitaires pour /api/complaints
 * 
 * Implémente les tests pour :
 * - GET /api/complaints avec filtres et pagination
 * - POST /api/complaints
 * - Utilisation de ComplaintQueryBuilder
 * - Utilisation de complaintFacade
 * - Authentification
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/complaints/route';
import { NextRequest } from 'next/server';

// Mock de auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock de complaintFacade
vi.mock('@/facades', () => ({
  complaintFacade: {
    createComplaint: vi.fn(),
  },
}));

// Mock de complaintService
vi.mock('@/services/complaint/complaint.service', () => ({
  complaintService: {
    getComplaintById: vi.fn(),
  },
}));

// Mock de getComplaintRepository - créer une instance unique mockée
const mockComplaintRepository = {
  findComplaintsWithFilters: vi.fn(),
};

vi.mock('@/repositories', () => ({
  getComplaintRepository: vi.fn(() => mockComplaintRepository),
}));

// Mock de ComplaintQueryBuilder - utiliser vi.hoisted() pour que les variables soient disponibles dans vi.mock
const { mockComplaintQueryBuilderSpy } = vi.hoisted(() => {
  class MockComplaintQueryBuilder {
    byUser = vi.fn().mockReturnThis();
    byProvider = vi.fn().mockReturnThis();
    byAppointment = vi.fn().mockReturnThis();
    byType = vi.fn().mockReturnThis();
    byPriority = vi.fn().mockReturnThis();
    byStatus = vi.fn().mockReturnThis();
    page = vi.fn().mockReturnThis();
    orderByCreatedAt = vi.fn().mockReturnThis();
    build = vi.fn(() => ({
      filters: {},
      pagination: { page: 1, limit: 50 },
      sort: { createdAt: -1 },
    }));
  }
  // Utiliser une fonction constructeur normale au lieu de vi.fn()
  function MockComplaintQueryBuilderConstructor() {
    return new MockComplaintQueryBuilder();
  }
  const spy = vi.fn(MockComplaintQueryBuilderConstructor);
  return {
    mockComplaintQueryBuilderSpy: spy,
  };
});

vi.mock('@/builders', () => ({
  ComplaintQueryBuilder: mockComplaintQueryBuilderSpy,
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
      // Si c'est une erreur ApiError, retourner le status approprié
      if (error.statusCode || error.status) {
        return {
          json: async () => ({ 
            success: false,
            error: error.message || 'Erreur' 
          }),
          status: error.statusCode || error.status,
        };
      }
      // Si c'est UNAUTHORIZED ou autre erreur ApiErrors
      if (error.message === 'Unauthorized') {
        return {
          json: async () => ({ error: 'Non autorisé' }),
          status: 401,
        };
      }
      throw error;
    }
  }),
  validateBody: vi.fn((body) => body),
  ApiErrors: {
    UNAUTHORIZED: new Error('Unauthorized'),
    NOT_FOUND: new Error('Not Found'),
  },
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
      this.statusCode = status;
    }
    statusCode?: number;
  },
}));

// Mock de createPaginatedResponse et createResourceResponse
vi.mock('@/lib/api/response', () => ({
  createPaginatedResponse: vi.fn((data, pagination) => ({
    json: async () => ({
      success: true,
      data,
      pagination,
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

describe('GET /api/complaints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les réclamations avec succès', async () => {
    const mockComplaints = [
      {
        id: 'complaint1',
        type: 'SERVICE_QUALITY',
        status: 'PENDING',
      },
    ];

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });
    vi.mocked(mockComplaintRepository.findComplaintsWithFilters).mockResolvedValueOnce({
      data: mockComplaints,
      total: 1,
    });

    const request = new NextRequest('http://localhost:3000/api/complaints');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockComplaintQueryBuilderSpy).toHaveBeenCalled();
    const instance = mockComplaintQueryBuilderSpy.mock.results[0]?.value;
    expect(instance?.byUser).toHaveBeenCalledWith('user123');
  });

  it('devrait appliquer les filtres de requête', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });
    vi.mocked(mockComplaintRepository.findComplaintsWithFilters).mockResolvedValueOnce({
      data: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost:3000/api/complaints?provider=provider123&status=PENDING');
    await GET(request);

    const instance = mockComplaintQueryBuilderSpy.mock.results[0]?.value;
    expect(instance?.byProvider).toHaveBeenCalledWith('provider123');
    expect(instance?.byStatus).toHaveBeenCalledWith('PENDING');
  });

  it('devrait retourner 401 si non authentifié', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/complaints');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non autorisé');
  });

  it('devrait utiliser la pagination par défaut', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });
    vi.mocked(mockComplaintRepository.findComplaintsWithFilters).mockResolvedValueOnce({
      data: [],
      total: 0,
    });

    const request = new NextRequest('http://localhost:3000/api/complaints');
    await GET(request);

    const instance = mockComplaintQueryBuilderSpy.mock.results[0]?.value;
    expect(instance?.page).toHaveBeenCalled();
  });
});

describe('POST /api/complaints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait créer une réclamation avec succès', async () => {
    const mockComplaint = {
      id: 'complaint1',
      _id: 'complaint1',
      number: 'COMP-001',
      title: 'Test complaint',
      type: 'QUALITY' as const,
      priority: 'MEDIUM' as const,
      status: 'OPEN' as const,
      description: 'Test description',
      provider: 'provider123',
      appointmentId: 'appointment123',
      userId: 'user123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });
    const { complaintFacade } = await import('@/facades');
    vi.mocked(complaintFacade.createComplaint).mockResolvedValueOnce({
      success: true,
      complaintId: 'complaint1',
      notificationSent: true,
      emailSent: true,
    });
    const { complaintService } = await import('@/services/complaint/complaint.service');
    vi.mocked(complaintService.getComplaintById).mockResolvedValueOnce(mockComplaint);

    const request = new NextRequest('http://localhost:3000/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'SERVICE_QUALITY',
        subject: 'Test complaint',
        description: 'Test description',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Réutiliser complaintFacade déjà importé plus haut
    expect(vi.mocked(complaintFacade.createComplaint)).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user123',
      }),
    );
  });

  it('devrait retourner 401 si non authentifié', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'SERVICE_QUALITY',
        subject: 'Test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non autorisé');
  });

  it('devrait valider le body avec CreateComplaintSchema', async () => {
    const { validateBody } = await import('@/lib/api/error-handler');
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });
    const { complaintFacade } = await import('@/facades');
    vi.mocked(complaintFacade.createComplaint).mockResolvedValueOnce({
      success: true,
      complaintId: 'complaint1',
    });
    const { complaintService } = await import('@/services/complaint/complaint.service');
    vi.mocked(complaintService.getComplaintById).mockResolvedValueOnce({
      id: 'complaint1',
      _id: 'complaint1',
      number: 'COMP-001',
      title: 'Test',
      type: 'QUALITY' as const,
      priority: 'MEDIUM' as const,
      status: 'OPEN' as const,
      description: 'Test description',
      provider: 'provider123',
      appointmentId: 'appointment123',
      userId: 'user123',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest('http://localhost:3000/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'SERVICE_QUALITY',
        subject: 'Test',
      }),
    });

    await POST(request);

    expect(validateBody).toHaveBeenCalled();
  });

  it('devrait retourner une erreur si la création échoue', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });
    const { complaintFacade } = await import('@/facades');
    vi.mocked(complaintFacade.createComplaint).mockResolvedValueOnce({
      success: false,
      error: 'Erreur de création',
    });

    const request = new NextRequest('http://localhost:3000/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'SERVICE_QUALITY',
        subject: 'Test',
      }),
    });

    const response = await POST(request);
    const data = await response.json();
    
    // Le mock handleApiRoute gère les erreurs et retourne un objet avec status
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(data.success).toBe(false);
  });
});

