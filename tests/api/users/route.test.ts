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

// Session NextAuth simulée (la vraie lib/api/auth est utilisée)
const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mockAuth }));

const sessionWithRoles = (roles: string[]) => ({
  user: { id: 'session-user', email: 'session@example.com', roles },
});

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
    try {
      const result = await handler();
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
      // Autres erreurs (Error standard)
      return {
        json: async () => ({ error: error.message || 'Erreur interne du serveur', success: false }),
        status: 500,
      };
    }
  }),
  validateBody: vi.fn((body) => body),
  validateQuery: vi.fn((params) => {
    const result: Record<string, any> = {};
    params.forEach((value: string, key: string) => {
      result[key] = value;
    });
    return result;
  }),
  ApiError,
  ApiErrors,
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
  beforeEach(async () => {
    vi.clearAllMocks();
    const { validateBody } = await import('@/lib/api/error-handler');
    vi.mocked(validateBody).mockImplementation((body: any) => body);
    mockAuth.mockResolvedValue(sessionWithRoles(['ADMIN']));
  });

  const postRequest = (body: Record<string, unknown>) =>
    new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify(body),
    });

  const mockCreated = async (roles: string[]) => {
    const { userFacade } = await import('@/facades');
    vi.mocked(userFacade.execute).mockResolvedValue({
      success: true,
      user: { id: '123', email: 'x@example.com', name: 'X Y', roles, status: 'PENDING' } as any,
      message: 'Utilisateur créé avec succès',
      notificationSent: false,
    });
    return userFacade;
  };

  it('retourne 401 sans session et ne crée rien', async () => {
    mockAuth.mockResolvedValue(null);
    const { userFacade } = await import('@/facades');

    const response = await POST(
      postRequest({ email: 'pirate@example.com', firstName: 'A', lastName: 'B', roles: ['SUPERADMIN'] }),
    );

    expect(response.status).toBe(401);
    expect(userFacade.execute).not.toHaveBeenCalled();
  });

  it.each([['CUSTOMER'], ['PROVIDER'], ['CSM'], ['BENEFICIARY']])(
    'retourne 403 pour une session %s',
    async role => {
      mockAuth.mockResolvedValue(sessionWithRoles([role]));
      const { userFacade } = await import('@/facades');

      const response = await POST(
        postRequest({ email: 'x@example.com', firstName: 'A', lastName: 'B', roles: ['CUSTOMER'] }),
      );

      expect(response.status).toBe(403);
      expect(userFacade.execute).not.toHaveBeenCalled();
    },
  );

  it.each([['SUPERADMIN'], ['ADMIN']])(
    'retourne 403 si un ADMIN tente d\'attribuer le rôle %s',
    async role => {
      const { userFacade } = await import('@/facades');

      const response = await POST(
        postRequest({ email: 'x@example.com', firstName: 'A', lastName: 'B', roles: ['CUSTOMER', role] }),
      );

      expect(response.status).toBe(403);
      expect(userFacade.execute).not.toHaveBeenCalled();
    },
  );

  it('permet à un ADMIN de créer un prestataire', async () => {
    const userFacade = await mockCreated(['PROVIDER']);

    const response = await POST(
      postRequest({ email: 'Presta@Example.com', firstName: 'A', lastName: 'B', roles: ['PROVIDER'] }),
    );

    expect(response.status).toBe(200);
    expect(userFacade.execute).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'presta@example.com', roles: ['PROVIDER'], status: 'PENDING' }),
    );
  });

  it('permet à un SUPERADMIN de créer un ADMIN', async () => {
    mockAuth.mockResolvedValue(sessionWithRoles(['SUPERADMIN']));
    const userFacade = await mockCreated(['ADMIN']);

    const response = await POST(
      postRequest({ email: 'admin2@example.com', firstName: 'A', lastName: 'B', roles: ['ADMIN'] }),
    );

    expect(response.status).toBe(200);
    expect(userFacade.execute).toHaveBeenCalledWith(
      expect.objectContaining({ roles: ['ADMIN'] }),
    );
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
    const { validateBody } = await import('@/lib/api/error-handler');
    vi.mocked(validateBody).mockImplementation(() => {
      throw ApiErrors.VALIDATION_ERROR('Email invalide');
    });

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


describe('CreateUserSchema (roles et status)', () => {
  const base = { email: 'x@example.com', firstName: 'A', lastName: 'B' };

  it('accepte les rôles et statuts connus', async () => {
    const { CreateUserSchema } = await import('@/lib/validations/user.schema');
    const result = CreateUserSchema.safeParse({ ...base, roles: ['PROVIDER', 'CSM'], status: 'PENDING' });
    expect(result.success).toBe(true);
  });

  it('rejette un rôle inconnu', async () => {
    const { CreateUserSchema } = await import('@/lib/validations/user.schema');
    expect(CreateUserSchema.safeParse({ ...base, roles: ['ROOT'] }).success).toBe(false);
    expect(CreateUserSchema.safeParse({ ...base, roles: ['admin'] }).success).toBe(false);
  });

  it('rejette un statut inconnu', async () => {
    const { CreateUserSchema } = await import('@/lib/validations/user.schema');
    expect(CreateUserSchema.safeParse({ ...base, status: 'VERIFIED' }).success).toBe(false);
  });
});
