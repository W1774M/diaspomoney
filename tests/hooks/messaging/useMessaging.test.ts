/**
 * Tests unitaires pour useMessaging
 * 
 * Implémente les tests pour :
 * - Gestion des messages
 * - Conversations, envoi de messages, pièces jointes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMessaging } from '@/hooks/messaging/useMessaging';

// Mock de fetch global
global.fetch = vi.fn();

// Mock de useNotificationManager
const mockAddError = vi.fn();
const mockAddSuccess = vi.fn();
vi.mock('@/components/ui/Notification', () => ({
  useNotificationManager: () => ({
    addError: mockAddError,
    addSuccess: mockAddSuccess,
  }),
}));

describe('useMessaging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait récupérer les conversations', async () => {
    const mockConversations = [
      { id: 'c1', participants: ['user1', 'user2'] },
      { id: 'c2', participants: ['user1', 'user3'] },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        conversations: mockConversations,
      }),
    } as Response);

    const { result } = renderHook(() => useMessaging());

    await act(async () => {
      await result.current.fetchConversations('user1');
    });

    expect(result.current.conversations).toHaveLength(2);
    expect(result.current.conversations?.[0]?.id).toBe('c1');
    expect(result.current.loading).toBe(false);
  });

  it('devrait créer une conversation', async () => {
    const mockConversation = { id: 'c3', participants: ['user1', 'user4'] };
    const mockConversations = [mockConversation];

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          conversation: mockConversation,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          conversations: mockConversations,
        }),
      } as Response);

    const { result } = renderHook(() => useMessaging());

    await act(async () => {
      const conversation = await result.current.createConversation(
        ['user1', 'user4'],
      );

      expect(conversation).toEqual(mockConversation);
    });

    expect(mockAddSuccess).toHaveBeenCalledWith('Conversation créée avec succès');
  });

  it('devrait récupérer les messages d\'une conversation', async () => {
    const mockMessages = [
      {
        id: 'm1',
        text: 'Hello',
        senderId: 'user1',
        timestamp: new Date(),
        read: false,
      },
      {
        id: 'm2',
        text: 'Hi',
        senderId: 'user2',
        timestamp: new Date(),
        read: false,
      },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        messages: mockMessages,
        pagination: { total: 2 },
      }),
    } as Response);

    const { result } = renderHook(() => useMessaging());

    await act(async () => {
      const result_data = await result.current.fetchMessages('c1', 'user1');

      expect(result_data.messages).toHaveLength(2);
      expect(result_data.total).toBe(2);
    });

    expect(result.current.messages).toHaveLength(2);
  });

  it('devrait envoyer un message', async () => {
    const mockMessage = {
      id: 'm3',
      text: 'New message',
      senderId: 'user1',
      timestamp: new Date().toISOString(),
      attachments: [],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: mockMessage,
      }),
    } as Response);

    const { result } = renderHook(() => useMessaging());

    await act(async () => {
      const sentMessage = await result.current.sendMessage(
        'c1',
        'New message',
        'user1',
      );

      expect(sentMessage.text).toBe('New message');
    });

    expect(result.current.messages).toContainEqual(
      expect.objectContaining({
        text: 'New message',
      }),
    );
  });

  it('devrait gérer les pièces jointes', async () => {
    const mockMessage = {
      id: 'm4',
      text: 'Message with attachment',
      senderId: 'user1',
      timestamp: new Date().toISOString(),
      attachments: ['attachment1.pdf', 'attachment2.jpg'],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: mockMessage,
      }),
    } as Response);

    const { result } = renderHook(() => useMessaging());

    await act(async () => {
      const sentMessage = await result.current.sendMessage(
        'c1',
        'Message with attachment',
        'user1',
        ['attachment1.pdf', 'attachment2.jpg'],
      );

      expect(sentMessage.attachments).toHaveLength(2);
    });

    expect(fetch).toHaveBeenCalledWith('/api/messaging/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: 'c1',
        text: 'Message with attachment',
        attachments: ['attachment1.pdf', 'attachment2.jpg'],
      }),
    });
  });

  it('devrait gérer les erreurs API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const { result } = renderHook(() => useMessaging());

    await act(async () => {
      try {
        await result.current.fetchConversations('user1');
      } catch (error) {
        // Erreur gérée par le hook
      }
    });

    expect(result.current.error).toBe('Erreur lors de la récupération des conversations');
    expect(mockAddError).toHaveBeenCalled();
  });

  it('devrait gérer les états de chargement', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(fetch).mockReturnValueOnce(promise as any);

    const { result } = renderHook(() => useMessaging());

    act(() => {
      result.current.fetchConversations('user1');
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => ({
          success: true,
          conversations: [],
        }),
      });
      await promise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('devrait gérer les erreurs', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useMessaging());

    await act(async () => {
      try {
        await result.current.fetchConversations('user1');
      } catch (error) {
        // Erreur gérée par le hook
      }
    });

    expect(result.current.error).toBe('Network error');
  });

  it('devrait gérer les erreurs lors de la récupération des messages (response.ok = false)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const { result } = renderHook(() => useMessaging());

    await act(async () => {
      try {
        await result.current.fetchMessages('c1', 'user1');
      } catch (error) {
        // Erreur gérée par le hook
      }
    });

    expect(result.current.error).toBe('Erreur lors de la récupération des messages');
    expect(mockAddError).toHaveBeenCalledWith('Erreur lors de la récupération des messages');
  });

  it('devrait gérer les erreurs avec data.error lors de la récupération des messages', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Erreur personnalisée',
      }),
    } as Response);

    const { result } = renderHook(() => useMessaging());

    await act(async () => {
      try {
        await result.current.fetchMessages('c1', 'user1');
      } catch (error) {
        // Erreur gérée par le hook
      }
    });

    expect(result.current.error).toBe('Erreur personnalisée');
    expect(mockAddError).toHaveBeenCalledWith('Erreur lors de la récupération des messages');
  });

  it('devrait gérer les erreurs lors de l\'envoi d\'un message (response.ok = false)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    const { result } = renderHook(() => useMessaging());

    await act(async () => {
      try {
        await result.current.sendMessage('c1', 'Test', 'user1');
      } catch (error) {
        // Erreur gérée par le hook
      }
    });

    expect(result.current.error).toBe("Erreur lors de l'envoi du message");
    expect(mockAddError).toHaveBeenCalledWith("Erreur lors de l'envoi du message");
  });

  it('devrait gérer les erreurs avec data.error lors de l\'envoi d\'un message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Erreur personnalisée',
      }),
    } as Response);

    const { result } = renderHook(() => useMessaging());

    await act(async () => {
      try {
        await result.current.sendMessage('c1', 'Test', 'user1');
      } catch (error) {
        // Erreur gérée par le hook
      }
    });

    expect(result.current.error).toBe('Erreur personnalisée');
    expect(mockAddError).toHaveBeenCalledWith("Erreur lors de l'envoi du message");
  });
});

