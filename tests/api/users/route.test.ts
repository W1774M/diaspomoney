/**
 * Tests d'intégration pour /api/users
 * 
 * Implémente les tests pour :
 * - GET /api/users
 * - POST /api/users
 * - Validation des paramètres
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/users/route';
import { NextRequest } from 'next/server';

// Mock de userFacade
vi.mock('@/facades', () => ({
  userFacade: {
    getUsers: vi.fn(),
    execute: vi.fn(),
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
  validateQuery: vi.fn((params) => {
    const result: Record<string, any> = {};
    params.forEach((value: string, key: string) => {
      result[key] = value;
    });
    return result;
  }),
}));

describe('GET /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner une liste paginée d\'utilisateurs', async () => {
    const mockUsers = [
      {
        id: '1',
        email: 'user1@example.com',
        name: 'User 1',
        roles: ['CUSTOMER'],
        status: 'ACTIVE',
      },
      {
        id: '2',
        email: 'user2@example.com',
        name: 'User 2',
        roles: ['CUSTOMER'],
        status: 'ACTIVE',
      },
    ];

    const { userFacade } = await import('@/facades');
    vi.mocked(userFacade.getUsers).mockResolvedValue({
      success: true,
      data: mockUsers as any,
      total: 2,
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
      },
    });

    const request = new NextRequest('http://localhost:3000/api/users?limit=20&page=1');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.pagination.total).toBe(2);
  });

  it('devrait appliquer les filtres correctement', async () => {
    const { userFacade } = await import('@/facades');
    vi.mocked(userFacade.getUsers).mockResolvedValue({
      success: true,
      data: [],
      total: 0,
      pagination: { page: 1, limit: 20, total: 0 },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/users?role=CUSTOMER&status=ACTIVE',
    );
    await GET(request);

    expect(userFacade.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'CUSTOMER',
      }),
      expect.any(Object),
    );
  });

  it('devrait gérer les erreurs correctement', async () => {
    const { userFacade } = await import('@/facades');
    vi.mocked(userFacade.getUsers).mockResolvedValue({
      success: false,
      error: 'Erreur lors de la récupération',
    });

    const request = new NextRequest('http://localhost:3000/api/users');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

describe('POST /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait créer un utilisateur avec succès', async () => {
    const mockUser = {
      id: '123',
      email: 'newuser@example.com',
      name: 'New User',
      roles: ['CUSTOMER'],
      status: 'ACTIVE',
    };

    const { userFacade } = await import('@/facades');
    vi.mocked(userFacade.execute).mockResolvedValue({
      success: true,
      user: mockUser as any,
      message: 'Utilisateur créé avec succès',
      notificationSent: true,
    });

    const request = new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        name: 'New User',
        firstName: 'New',
        lastName: 'User',
        roles: ['CUSTOMER'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.email).toBe('newuser@example.com');
  });

  it('devrait valider les données d\'entrée', async () => {
    const request = new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email', // Email invalide
      }),
    });

    // La validation devrait retourner 400
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});

