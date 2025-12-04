/**
 * Tests unitaires pour /api/beneficiaries
 * 
 * Implémente les tests pour :
 * - GET /api/beneficiaries
 * - POST /api/beneficiaries
 * - Validation avec CreateBeneficiaryApiSchema
 * - Utilisation de beneficiaryFacade
 * - Authentification
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/beneficiaries/route';
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

// Mock de beneficiaryFacade - utiliser vi.hoisted() pour que les variables soient disponibles dans vi.mock
const { mockGetBeneficiaries, mockCreateBeneficiary } = vi.hoisted(() => {
  return {
    mockGetBeneficiaries: vi.fn(),
    mockCreateBeneficiary: vi.fn(),
  };
});

vi.mock('@/facades', () => ({
  beneficiaryFacade: {
    getBeneficiaries: mockGetBeneficiaries,
    createBeneficiary: mockCreateBeneficiary,
  },
}));

// Mock de getUserRepository - utiliser vi.hoisted() pour que les variables soient disponibles dans vi.mock
const { mockFindByEmail } = vi.hoisted(() => {
  return {
    mockFindByEmail: vi.fn(),
  };
});

vi.mock('@/repositories', () => ({
  getUserRepository: vi.fn(() => ({
    findByEmail: mockFindByEmail,
  })),
}));

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
      // Autres erreurs
      return {
        json: async () => ({ error: error.message || 'Erreur interne du serveur', success: false }),
        status: 500,
      };
    }
  }),
  validateBody: vi.fn((body) => body),
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
  ApiErrors: {
    UNAUTHORIZED: new Error('Unauthorized'),
    NOT_FOUND: new Error('Not Found'),
    VALIDATION_ERROR: (msg: string) => new Error(msg),
  },
}));

// Mock de createListResponse et createResourceResponse
vi.mock('@/lib/api/response', () => ({
  createListResponse: vi.fn((data) => ({
    json: async () => ({
      success: true,
      data,
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

describe('GET /api/beneficiaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les bénéficiaires de l\'utilisateur avec succès', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
    };

    const mockBeneficiaries = [
      {
        id: 'ben1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+33123456789',
        relationship: 'FAMILY',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockAuth.mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    });
    mockFindByEmail.mockResolvedValueOnce(mockUser);
    mockGetBeneficiaries.mockResolvedValueOnce(mockBeneficiaries);

    const request = new NextRequest('http://localhost:3000/api/beneficiaries');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetBeneficiaries).toHaveBeenCalledWith('user123');
  });

  it('devrait retourner 401 si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/beneficiaries');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non autorisé');
  });

  it('devrait retourner 404 si l\'utilisateur n\'existe pas', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    });
    mockFindByEmail.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/beneficiaries');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Ressource non trouvée');
  });

  it('devrait mapper les bénéficiaires vers le format attendu', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
    };

    const mockBeneficiaries = [
      {
        id: 'ben1',
        firstName: 'John',
        lastName: 'Doe',
        relationship: 'FAMILY',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    mockAuth.mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    });
    mockFindByEmail.mockResolvedValueOnce(mockUser);
    mockGetBeneficiaries.mockResolvedValueOnce(mockBeneficiaries);

    const request = new NextRequest('http://localhost:3000/api/beneficiaries');
    await GET(request);

    const { createListResponse } = await import('@/lib/api/response');
    expect(createListResponse).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          status: 'active',
        }),
      ]),
    );
  });
});

describe('POST /api/beneficiaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait créer un bénéficiaire avec succès', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      countryOfResidence: 'FR',
    };

    const mockCreatedBeneficiary = {
      id: 'ben1',
      firstName: 'Jane',
      lastName: 'Doe',
      relationship: 'FAMILY',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    });
    mockFindByEmail.mockResolvedValueOnce(mockUser);
    mockCreateBeneficiary.mockResolvedValueOnce({
      success: true,
      beneficiary: mockCreatedBeneficiary,
    });

    const request = new NextRequest('http://localhost:3000/api/beneficiaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe',
        relationship: 'FAMILY',
        email: 'jane@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockCreateBeneficiary).toHaveBeenCalled();
  });

  it('devrait parser le nom si fourni comme "firstName lastName"', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      countryOfResidence: 'FR',
    };

    mockAuth.mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    });
    mockFindByEmail.mockResolvedValueOnce(mockUser);
    mockCreateBeneficiary.mockResolvedValueOnce({
      success: true,
      beneficiary: { id: 'ben1' },
    });

    const request = new NextRequest('http://localhost:3000/api/beneficiaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Doe',
        relationship: 'FAMILY',
      }),
    });

    await POST(request);

    expect(mockCreateBeneficiary).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        firstName: 'Jane',
        lastName: 'Doe',
      }),
    );
  });

  it('devrait retourner 401 si non authentifié', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/beneficiaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe',
        relationship: 'FAMILY',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non autorisé');
  });

  it('devrait valider le body avec CreateBeneficiaryApiSchema', async () => {
    const { validateBody } = await import('@/lib/api/error-handler');
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      countryOfResidence: 'FR',
    };

    mockAuth.mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    });
    mockFindByEmail.mockResolvedValueOnce(mockUser);
    mockCreateBeneficiary.mockResolvedValueOnce({
      success: true,
      beneficiary: { id: 'ben1' },
    });

    const request = new NextRequest('http://localhost:3000/api/beneficiaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe',
        relationship: 'FAMILY',
      }),
    });

    await POST(request);

    expect(validateBody).toHaveBeenCalled();
  });

  it('devrait retourner une erreur si la création échoue', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      countryOfResidence: 'FR',
    };

    mockAuth.mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    });
    mockFindByEmail.mockResolvedValueOnce(mockUser);
    mockCreateBeneficiary.mockResolvedValueOnce({
      success: false,
      error: 'Erreur de création',
    });

    const request = new NextRequest('http://localhost:3000/api/beneficiaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe',
        relationship: 'FAMILY',
      }),
    });

    await expect(POST(request)).rejects.toThrow();
  });
});

