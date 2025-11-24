/**
 * Tests unitaires pour /api/messaging
 * 
 * Implémente les tests pour :
 * - GET /api/messaging/conversations
 * - POST /api/messaging/conversations
 * - GET /api/messaging/messages
 * - POST /api/messaging/messages
 * - Authentification
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as GET_CONVERSATIONS, POST as POST_CONVERSATIONS } from '@/app/api/messaging/conversations/route';
import { GET as GET_MESSAGES, POST as POST_MESSAGES } from '@/app/api/messaging/messages/route';
import { NextRequest } from 'next/server';

// Mock de auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

// Mock de dbConnect
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

// Mock de Conversation model - utiliser vi.hoisted() pour que les variables soient disponibles dans vi.mock
const { mockConversationFindOne, mockConversationFindById, mockConversationUpdateOne } = vi.hoisted(() => {
  return {
    mockConversationFindOne: vi.fn(),
    mockConversationFindById: vi.fn(),
    mockConversationUpdateOne: vi.fn(),
  };
});

vi.mock('@/models/Conversation', () => {
  const mockConversationModel = vi.fn((data) => ({
    ...data,
    save: vi.fn(),
  }));
  (mockConversationModel as any).findOne = mockConversationFindOne;
  (mockConversationModel as any).findById = mockConversationFindById;
  (mockConversationModel as any).updateOne = mockConversationUpdateOne;
  return {
    default: mockConversationModel,
  };
});

// Mock de Message model - créer des instances de mocks réutilisables
const mockMessageFind = vi.fn();
const mockMessageFindOne = vi.fn();
const mockMessageCountDocuments = vi.fn();
const mockMessageUpdateMany = vi.fn();

vi.mock('@/models/Message', () => {
  const mockMessageModel = vi.fn((data) => ({
    ...data,
    save: vi.fn(),
    _id: { toString: () => 'msg1' },
    createdAt: new Date(),
  }));
  (mockMessageModel as any).find = mockMessageFind;
  (mockMessageModel as any).findOne = mockMessageFindOne;
  (mockMessageModel as any).countDocuments = mockMessageCountDocuments;
  (mockMessageModel as any).updateMany = mockMessageUpdateMany;
  return {
    default: mockMessageModel,
  };
});

// Mock de mongoose
vi.mock('mongoose', () => ({
  default: {
    Types: {
      ObjectId: class {
        constructor(public id: string) {}
        toString() {
          return this.id;
        }
      },
    },
  },
}));

// Mock de handleApiRoute
vi.mock('@/lib/api/error-handler', () => ({
  handleApiRoute: vi.fn((_request, handler) => handler()),
  validateBody: vi.fn((body) => body),
}));

describe('GET /api/messaging/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les conversations avec succès', async () => {
    const mockConversations = [
      {
        _id: { toString: () => 'conv1' },
        participants: [
          { _id: { toString: () => 'user123' }, name: 'User 1' },
          { _id: { toString: () => 'user456' }, name: 'User 2' },
        ],
        lastMessageAt: new Date(),
      },
    ];

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
    });
    mockConversationFind.mockResolvedValueOnce(mockConversations);
    mockMessageFindOne.mockResolvedValueOnce(null);
    mockMessageCountDocuments.mockResolvedValueOnce(0);

    const request = new NextRequest('http://localhost:3000/api/messaging/conversations');
    const response = await GET_CONVERSATIONS(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.conversations).toBeDefined();
  });

  it('devrait retourner 401 si non authentifié', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/messaging/conversations');
    const response = await GET_CONVERSATIONS(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non autorisé');
  });
});

describe('POST /api/messaging/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait créer une conversation avec succès', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
    });
    mockConversationFindOne.mockResolvedValueOnce(null);
    mockConversationSave.mockResolvedValueOnce({
      _id: { toString: () => 'conv1' },
    });

    const request = new NextRequest('http://localhost:3000/api/messaging/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: 'user456',
      }),
    });

    const response = await POST_CONVERSATIONS(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.conversation).toBeDefined();
  });

  it('devrait retourner la conversation existante si elle existe déjà', async () => {
    const mockExistingConversation = {
      _id: { toString: () => 'conv1' },
    };

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
    });
    mockConversationFindOne.mockResolvedValueOnce(mockExistingConversation);

    const request = new NextRequest('http://localhost:3000/api/messaging/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: 'user456',
      }),
    });

    const response = await POST_CONVERSATIONS(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.conversation.id).toBe('conv1');
  });
});

describe('GET /api/messaging/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les messages avec succès', async () => {
    const mockConversation = {
      _id: { toString: () => 'conv1' },
      participants: [{ toString: () => 'user123' }],
    };

    const mockMessages = [
      {
        _id: { toString: () => 'msg1' },
        text: 'Hello',
        senderId: { toString: () => 'user456' },
        createdAt: new Date(),
        attachments: [],
        read: false,
      },
    ];

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
    });
    mockConversationFindOne.mockResolvedValueOnce(mockConversation);
    mockMessageFind.mockResolvedValueOnce(mockMessages);
    mockMessageCountDocuments.mockResolvedValueOnce(1);
    mockMessageUpdateMany.mockResolvedValueOnce({ modifiedCount: 1 });
    mockConversationUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });

    const request = new NextRequest('http://localhost:3000/api/messaging/messages?conversationId=conv1');
    const response = await GET_MESSAGES(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.messages).toBeDefined();
  });

  it('devrait retourner 400 si conversationId est manquant', async () => {
    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
    });

    const request = new NextRequest('http://localhost:3000/api/messaging/messages');
    const response = await GET_MESSAGES(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('ID de conversation requis');
  });
});

describe('POST /api/messaging/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait créer un message avec succès', async () => {
    const mockConversation = {
      _id: { toString: () => 'conv1' },
      participants: [
        { toString: () => 'user123' },
        { toString: () => 'user456' },
      ],
      unreadCount: {},
      save: vi.fn(),
    };

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
    });
    mockConversationFindById.mockResolvedValueOnce(mockConversation);
    mockMessageSave.mockResolvedValueOnce({
      _id: { toString: () => 'msg1' },
      text: 'Hello',
      senderId: { toString: () => 'user123' },
      createdAt: new Date(),
      attachments: [],
    });

    const request = new NextRequest('http://localhost:3000/api/messaging/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: 'conv1',
        text: 'Hello',
      }),
    });

    const response = await POST_MESSAGES(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBeDefined();
  });

  it('devrait retourner 403 si l\'utilisateur n\'est pas participant', async () => {
    const mockConversation = {
      _id: { toString: () => 'conv1' },
      participants: [{ toString: () => 'user456' }],
    };

    const { auth } = await import('@/auth');
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: 'user123' },
    });
    mockConversationFindById.mockResolvedValueOnce(mockConversation);

    const request = new NextRequest('http://localhost:3000/api/messaging/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: 'conv1',
        text: 'Hello',
      }),
    });

    const response = await POST_MESSAGES(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Accès non autorisé');
  });
});

