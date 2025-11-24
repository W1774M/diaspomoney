/**
 * Tests unitaires pour /api/notifications
 * 
 * Implémente les tests pour :
 * - GET /api/notifications avec filtres et pagination
 * - PATCH /api/notifications (marquer comme lue)
 * - PUT /api/notifications (marquer toutes comme lues)
 * - Authentification
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, PUT } from '@/app/api/notifications/route';
import { NextRequest } from 'next/server';

// Mock de auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock de getMongoClient
const mockFind = vi.fn();
const mockCountDocuments = vi.fn();
const mockFindOne = vi.fn();
const mockUpdateOne = vi.fn();
const mockUpdateMany = vi.fn();
const mockCollection = {
  find: vi.fn(() => ({
    sort: vi.fn(() => ({
      skip: vi.fn(() => ({
        limit: vi.fn(() => ({
          toArray: mockFind,
        })),
      })),
    })),
  })),
  countDocuments: mockCountDocuments,
  findOne: mockFindOne,
  updateOne: mockUpdateOne,
  updateMany: mockUpdateMany,
};
const mockDb = {
  collection: vi.fn(() => mockCollection),
};
const mockClient = {
  db: vi.fn(() => mockDb),
};

vi.mock('@/lib/database/mongodb', () => ({
  getMongoClient: vi.fn(() => Promise.resolve(mockClient)),
}));

// Mock de handleApiRoute
vi.mock('@/lib/api/error-handler', () => ({
  handleApiRoute: vi.fn(async (_request, handler) => {
    const result = await handler();
    // Si le résultat a déjà une méthode json(), le retourner tel quel
    if (result && typeof result.json === 'function') {
      return result;
    }
    // Sinon, créer un NextResponse avec json()
    const { NextResponse } = await import('next/server');
    return NextResponse.json(result);
  }),
  validateBody: vi.fn((body) => body),
  validateQuery: vi.fn((params) => Object.fromEntries(params)),
  ApiErrors: {
    UNAUTHORIZED: new Error('Unauthorized'),
    NOT_FOUND: new Error('Not Found'),
    VALIDATION_ERROR: (msg: string) => new Error(msg),
  },
}));

// Mock de ObjectId
vi.mock('mongodb', () => ({
  ObjectId: class {
    constructor(public id: string) {}
    toString() {
      return this.id;
    }
  },
}));

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les notifications avec succès', async () => {
    const mockNotifications = [
      {
        _id: { toString: () => 'notif1' },
        type: 'INFO',
        subject: 'Test',
        content: 'Test content',
        read: false,
        createdAt: new Date(),
      },
    ];

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123', email: 'test@example.com' },
    });
    mockFind.mockResolvedValueOnce(mockNotifications);
    mockCountDocuments.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    const request = new NextRequest('http://localhost:3000/api/notifications');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.notifications).toBeDefined();
  });

  it('devrait filtrer par statut (unread)', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123', email: 'test@example.com' },
    });
    mockFind.mockResolvedValueOnce([]);
    mockCountDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const request = new NextRequest('http://localhost:3000/api/notifications?status=unread');
    await GET(request);

    expect(mockCollection.find).toHaveBeenCalled();
  });

  it('devrait retourner 401 si non authentifié', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/notifications');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non autorisé');
  });
});

describe('PATCH /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait marquer une notification comme lue', async () => {
    const mockNotification = {
      _id: { toString: () => 'notif1' },
      recipient: 'user123',
    };

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123', email: 'test@example.com' },
    });
    mockFindOne.mockResolvedValueOnce(mockNotification);
    mockUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });

    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: 'notif1',
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpdateOne).toHaveBeenCalled();
  });

  it('devrait retourner 404 si la notification n\'existe pas', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123', email: 'test@example.com' },
    });
    mockFindOne.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: 'nonexistent',
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Ressource non trouvée');
  });
});

describe('PUT /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait marquer toutes les notifications comme lues', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123', email: 'test@example.com' },
    });
    mockUpdateMany.mockResolvedValueOnce({ modifiedCount: 5 });

    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markAllAsRead: true,
      }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.updatedCount).toBe(5);
  });

  it('devrait retourner une erreur si markAllAsRead est false', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123', email: 'test@example.com' },
    });

    const request = new NextRequest('http://localhost:3000/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markAllAsRead: false,
      }),
    });

    await expect(PUT(request)).rejects.toThrow();
  });
});

