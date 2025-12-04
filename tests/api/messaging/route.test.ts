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
const { mockConversationFind, mockConversationFindOne, mockConversationFindById, mockConversationUpdateOne, mockConversationSave } = vi.hoisted(() => {
  const mockFind = vi.fn();
  const mockFindOne = vi.fn();
  const mockFindById = vi.fn();
  const mockUpdateOne = vi.fn();
  const mockSave = vi.fn();
  
  return {
    mockConversationFind: mockFind,
    mockConversationFindOne: mockFindOne,
    mockConversationFindById: mockFindById,
    mockConversationUpdateOne: mockUpdateOne,
    mockConversationSave: mockSave,
  };
});

vi.mock('@/models/Conversation', () => {
  class MockConversation {
    _id?: { toString: () => string };
    constructor(public data?: any) {}
    async save() {
      const saved = mockConversationSave();
      if (saved && saved._id) {
        this._id = saved._id;
      } else if (!this._id) {
        this._id = { toString: () => 'conv1' };
      }
      return Promise.resolve(this);
    }
    static find() {
      return {
        sort: vi.fn(() => ({
          populate: vi.fn(() => ({
            lean: vi.fn(() => Promise.resolve(mockConversationFind())),
          })),
        })),
      };
    }
    static findOne() {
      const queryResult = mockConversationFindOne();
      const promise = Promise.resolve(queryResult);
      (promise as any).lean = vi.fn(() => Promise.resolve(queryResult));
      return promise;
    }
    static findById() {
      return Promise.resolve(mockConversationFindById());
    }
    static updateOne() {
      return Promise.resolve(mockConversationUpdateOne());
    }
  }
  return {
    default: MockConversation,
  };
});

// Mock de Message model - utiliser vi.hoisted() pour que les variables soient disponibles dans vi.mock
const { mockMessageFind, mockMessageFindOne, mockMessageCountDocuments, mockMessageUpdateMany, mockMessageSave } = vi.hoisted(() => {
  const mockFind = vi.fn();
  const mockFindOne = vi.fn();
  const mockCountDocuments = vi.fn();
  const mockUpdateMany = vi.fn();
  const mockSave = vi.fn();
  
  return {
    mockMessageFind: mockFind,
    mockMessageFindOne: mockFindOne,
    mockMessageCountDocuments: mockCountDocuments,
    mockMessageUpdateMany: mockUpdateMany,
    mockMessageSave: mockSave,
  };
});

vi.mock('@/models/Message', () => {
  class MockMessage {
    _id: { toString: () => string };
    createdAt: Date;
    senderId?: { toString: () => string };
    text?: string;
    attachments?: any[];
    constructor(public data?: any) {
      this._id = { toString: () => 'msg1' };
      this.createdAt = new Date();
      if (data) {
        this.text = data.text;
        this.senderId = data.senderId || { toString: () => 'user123' };
        this.attachments = data.attachments || [];
      }
    }
    async save() {
      const saved = mockMessageSave();
      if (saved) {
        if (saved._id) this._id = saved._id;
        if (saved.senderId) this.senderId = saved.senderId;
        if (saved.text) this.text = saved.text;
        if (saved.attachments) this.attachments = saved.attachments;
        if (saved.createdAt) this.createdAt = saved.createdAt;
      }
      return Promise.resolve(this);
    }
    static find() {
      return {
        sort: vi.fn(() => ({
          limit: vi.fn(() => ({
            skip: vi.fn(() => ({
              populate: vi.fn(() => ({
                lean: vi.fn(() => Promise.resolve(mockMessageFind())),
              })),
            })),
          })),
        })),
      };
    }
    static findOne() {
      return {
        sort: vi.fn(() => ({
          lean: vi.fn(() => Promise.resolve(mockMessageFindOne())),
        })),
      };
    }
    static countDocuments() {
      return Promise.resolve(mockMessageCountDocuments());
    }
    static updateMany() {
      return Promise.resolve(mockMessageUpdateMany());
    }
  }
  return {
    default: MockMessage,
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
      expires: new Date(Date.now() + 3600000).toISOString(),
    } as any);
    mockConversationFind.mockReturnValueOnce(mockConversations);
    mockMessageFindOne.mockReturnValueOnce(null);
    mockMessageCountDocuments.mockReturnValueOnce(0);
    
    // Mock dbConnect
    const dbConnect = (await import('@/lib/mongodb')).default;
    vi.mocked(dbConnect).mockResolvedValueOnce(undefined);

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
      expires: new Date(Date.now() + 3600000).toISOString(),
    } as any);
    mockConversationFindOne.mockReturnValueOnce(null);
    mockConversationSave.mockReturnValueOnce({
      _id: { toString: () => 'conv1' },
    } as any);
    
    // Mock dbConnect
    const dbConnect = (await import('@/lib/mongodb')).default;
    vi.mocked(dbConnect).mockResolvedValueOnce(undefined);

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
      expires: new Date(Date.now() + 3600000).toISOString(),
    } as any);
    mockConversationFindOne.mockReturnValueOnce(mockExistingConversation);
    
    // Mock dbConnect
    const dbConnect = (await import('@/lib/mongodb')).default;
    vi.mocked(dbConnect).mockResolvedValueOnce(undefined);

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
      expires: new Date(Date.now() + 3600000).toISOString(),
    } as any);
    mockConversationFindOne.mockReturnValueOnce(mockConversation);
    mockMessageFind.mockReturnValueOnce(mockMessages);
    mockMessageCountDocuments.mockReturnValueOnce(1);
    mockMessageUpdateMany.mockReturnValueOnce({ modifiedCount: 1 });
    mockConversationUpdateOne.mockReturnValueOnce({ modifiedCount: 1 });
    
    // Mock dbConnect
    const dbConnect = (await import('@/lib/mongodb')).default;
    vi.mocked(dbConnect).mockResolvedValueOnce(undefined);

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
      expires: new Date(Date.now() + 3600000).toISOString(),
    } as any);

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
      expires: new Date(Date.now() + 3600000).toISOString(),
    } as any);
    mockConversationFindById.mockReturnValueOnce(mockConversation);
    mockMessageSave.mockReturnValueOnce({
      _id: { toString: () => 'msg1' },
      text: 'Hello',
      senderId: { toString: () => 'user123' },
      createdAt: new Date(),
      attachments: [],
    } as any);
    
    // Mock dbConnect
    const dbConnect = (await import('@/lib/mongodb')).default;
    vi.mocked(dbConnect).mockResolvedValueOnce(undefined);

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
      expires: new Date(Date.now() + 3600000).toISOString(),
    } as any);
    mockConversationFindById.mockReturnValueOnce(mockConversation);
    
    // Mock dbConnect
    const dbConnect = (await import('@/lib/mongodb')).default;
    vi.mocked(dbConnect).mockResolvedValueOnce(undefined);

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

