/**
 * Tests unitaires pour /api/auth/reset-password
 * 
 * Implémente les tests pour :
 * - POST /api/auth/reset-password
 * - Validation avec ResetPasswordSchema
 * - Recherche utilisateur par token
 * - Vérification expiration du token
 * - Hachage du nouveau mot de passe
 * - Mise à jour de l'utilisateur
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/reset-password/route';
import { NextRequest } from 'next/server';

// Mock de mongoClient
const mockFindOne = vi.fn();
const mockUpdateOne = vi.fn();
const mockCollection = {
  findOne: mockFindOne,
  updateOne: mockUpdateOne,
};
const mockDb = {
  collection: vi.fn(() => mockCollection),
};
vi.mock('@/lib/mongodb', () => ({
  mongoClient: Promise.resolve({
    db: () => mockDb,
  }),
}));

// Mock de bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}));

// Mock de handleApiRoute
vi.mock('@/lib/api/error-handler', async () => {
  const { NextResponse } = await import('next/server');
  return {
    handleApiRoute: vi.fn(async (_request, handler) => {
      try {
        const result = await handler();
        // Si le résultat est déjà une NextResponse, la retourner telle quelle
        if (result instanceof NextResponse) {
          return result;
        }
        // Sinon, envelopper dans NextResponse.json
        return NextResponse.json(result);
      } catch (error: any) {
        // Gérer les erreurs comme handleApiRoute le fait
        if (error && typeof error === 'object' && 'statusCode' in error) {
          return NextResponse.json(
            {
              success: false,
              error: error.message,
              code: error.code,
            },
            { status: error.statusCode },
          );
        }
        return NextResponse.json(
          { error: error?.message || 'Internal server error' },
          { status: 500 },
        );
      }
    }),
    validateBody: vi.fn((body, schema) => {
      // Simuler la validation Zod
      if (schema && typeof schema === 'object' && 'parse' in schema) {
        try {
          return (schema as any).parse(body);
        } catch (error: any) {
          throw error;
        }
      }
      return body;
    }),
  };
});

// Mock de logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait réinitialiser le mot de passe avec succès', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      passwordResetToken: 'valid-token',
      passwordResetExpires: new Date(Date.now() + 3600000), // 1 heure dans le futur
    };

    vi.mocked(mockFindOne).mockResolvedValueOnce(mockUser);
    vi.mocked(mockUpdateOne).mockResolvedValueOnce({ modifiedCount: 1 });
    const bcryptModule = await import('bcryptjs');
    vi.mocked(bcryptModule.default.hash).mockResolvedValueOnce('hashed-password');
    
    // Obtenir les références pour les assertions
    const { mongoClient } = await import('@/lib/mongodb');
    const client = await mongoClient;
    const db = client.db();
    const usersCollection = db.collection('users');

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'valid-token',
        password: 'NewPassword123!',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Mot de passe réinitialisé avec succès');
    expect(vi.mocked(mockFindOne)).toHaveBeenCalledWith({
      passwordResetToken: 'valid-token',
    });
    expect(vi.mocked(bcryptModule.default.hash)).toHaveBeenCalledWith('NewPassword123!', 12);
    expect(vi.mocked(mockUpdateOne)).toHaveBeenCalledWith(
      { _id: 'user123' },
      expect.objectContaining({
        $set: expect.objectContaining({
          password: 'hashed-password',
        }),
        $unset: {
          passwordResetToken: '',
          passwordResetExpires: '',
        },
      }),
    );
  });

  it('devrait retourner 400 si le token est invalide', async () => {
    vi.mocked(mockFindOne).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'invalid-token',
        password: 'NewPassword123!',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Token de réinitialisation invalide');
    expect(data.reason).toBe('invalid_token');
    const bcryptModule = await import('bcryptjs');
    expect(vi.mocked(bcryptModule.default.hash)).not.toHaveBeenCalled();
  });

  it('devrait retourner 400 si le token a expiré', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      passwordResetToken: 'expired-token',
      passwordResetExpires: new Date(Date.now() - 3600000), // 1 heure dans le passé
    };

    vi.mocked(mockFindOne).mockResolvedValueOnce(mockUser);

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'expired-token',
        password: 'NewPassword123!',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Le lien de réinitialisation a expiré');
    expect(data.reason).toBe('expired_token');
    const bcryptModule = await import('bcryptjs');
    expect(vi.mocked(bcryptModule.default.hash)).not.toHaveBeenCalled();
  });

  it('devrait accepter un token sans expiration définie', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      passwordResetToken: 'valid-token',
      // passwordResetExpires non défini
    };

    vi.mocked(mockFindOne).mockResolvedValueOnce(mockUser);
    vi.mocked(mockUpdateOne).mockResolvedValueOnce({ modifiedCount: 1 });
    const bcryptModule = await import('bcryptjs');
    vi.mocked(bcryptModule.default.hash).mockResolvedValueOnce('hashed-password');

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'valid-token',
        password: 'NewPassword123!',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('devrait retourner 500 si la mise à jour échoue', async () => {
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      passwordResetToken: 'valid-token',
      passwordResetExpires: new Date(Date.now() + 3600000),
    };

    vi.mocked(mockFindOne).mockResolvedValueOnce(mockUser);
    vi.mocked(mockUpdateOne).mockResolvedValueOnce({ modifiedCount: 0 }); // Échec de mise à jour
    const bcryptModule = await import('bcryptjs');
    vi.mocked(bcryptModule.default.hash).mockResolvedValueOnce('hashed-password');

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'valid-token',
        password: 'NewPassword123!',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erreur lors de la mise à jour du mot de passe');
  });

  it('devrait valider le body avec ResetPasswordSchema', async () => {
    const { validateBody } = await import('@/lib/api/error-handler');
    const mockUser = {
      _id: 'user123',
      passwordResetToken: 'valid-token',
      passwordResetExpires: new Date(Date.now() + 3600000),
    };

    vi.mocked(mockFindOne).mockResolvedValueOnce(mockUser);
    vi.mocked(mockUpdateOne).mockResolvedValueOnce({ modifiedCount: 1 });
    const bcryptModule = await import('bcryptjs');
    vi.mocked(bcryptModule.default.hash).mockResolvedValueOnce('hashed-password');

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'valid-token',
        password: 'NewPassword123!',
      }),
    });

    await POST(request);

    expect(validateBody).toHaveBeenCalled();
  });

  it('devrait utiliser 12 rounds de salt pour bcrypt', async () => {
    const mockUser = {
      _id: 'user123',
      passwordResetToken: 'valid-token',
      passwordResetExpires: new Date(Date.now() + 3600000),
    };

    vi.mocked(mockFindOne).mockResolvedValueOnce(mockUser);
    vi.mocked(mockUpdateOne).mockResolvedValueOnce({ modifiedCount: 1 });
    const bcryptModule = await import('bcryptjs');
    vi.mocked(bcryptModule.default.hash).mockResolvedValueOnce('hashed-password');

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'valid-token',
        password: 'NewPassword123!',
      }),
    });

    await POST(request);

    expect(vi.mocked(bcryptModule.default.hash)).toHaveBeenCalledWith('NewPassword123!', 12);
  });

  it('devrait supprimer passwordResetToken et passwordResetExpires après succès', async () => {
    const mockUser = {
      _id: 'user123',
      passwordResetToken: 'valid-token',
      passwordResetExpires: new Date(Date.now() + 3600000),
    };

    vi.mocked(mockFindOne).mockResolvedValueOnce(mockUser);
    vi.mocked(mockUpdateOne).mockResolvedValueOnce({ modifiedCount: 1 });
    const bcryptModule = await import('bcryptjs');
    vi.mocked(bcryptModule.default.hash).mockResolvedValueOnce('hashed-password');

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'valid-token',
        password: 'NewPassword123!',
      }),
    });

    await POST(request);

    expect(vi.mocked(mockUpdateOne)).toHaveBeenCalledWith(
      { _id: 'user123' },
      expect.objectContaining({
        $unset: {
          passwordResetToken: '',
          passwordResetExpires: '',
        },
      }),
    );
  });
});

