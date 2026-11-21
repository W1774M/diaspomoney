/**
 * Tests unitaires pour MessagingFacade
 * 
 * Implémente les tests pour :
 * - sendMessage
 * - execute (IFacade)
 * - Orchestration avec MessagingService et NotificationService
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { messagingFacade, type MessagingFacadeData } from '@/facades/messaging.facade';

// Mock des dépendances
vi.mock('@/services/messaging/messaging.service');
vi.mock('@/services/notification/notification.service');
vi.mock('@/lib/mappers');
vi.mock('@/lib/logger');
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('MessagingFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendMessage', () => {
    it('devrait envoyer un message avec conversationId existant', async () => {
      const messageData: MessagingFacadeData = {
        conversationId: 'conv123',
        text: 'Hello',
        userId: 'user123',
      };

      const mockConversation = {
        id: 'conv123',
      };

      const mockMessage = {
        id: 'message123',
        text: 'Hello',
        conversationId: 'conv123',
      };

      const { messagingService } = await import('@/services/messaging/messaging.service');
      vi.mocked(messagingService.getConversations).mockResolvedValue([mockConversation] as any);
      vi.mocked(messagingService.sendMessage).mockResolvedValue(mockMessage as any);

      const { messageMapper } = await import('@/lib/mappers');
      vi.mocked(messageMapper.map).mockReturnValue({
        id: 'message123',
      } as any);

      const result = await messagingFacade.sendMessage(messageData);

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(messagingService.sendMessage).toHaveBeenCalled();
    });

    it('devrait créer une nouvelle conversation si participants est fourni', async () => {
      const messageData: MessagingFacadeData = {
        participants: ['user123', 'user456'],
        text: 'Hello',
        userId: 'user123',
        type: 'user',
      };

      const mockConversation = {
        id: 'conv123',
      };

      const mockMessage = {
        id: 'message123',
        text: 'Hello',
      };

      const { messagingService } = await import('@/services/messaging/messaging.service');
      vi.mocked(messagingService.createConversation).mockResolvedValue(mockConversation as any);
      vi.mocked(messagingService.sendMessage).mockResolvedValue(mockMessage as any);

      const { messageMapper } = await import('@/lib/mappers');
      vi.mocked(messageMapper.map).mockReturnValue({
        id: 'message123',
      } as any);

      const result = await messagingFacade.sendMessage(messageData);

      expect(result.success).toBe(true);
      expect(result.conversation).toBeDefined();
      expect(messagingService.createConversation).toHaveBeenCalled();
    });

    it('devrait envoyer une notification si sendNotification est true', async () => {
      const messageData: MessagingFacadeData = {
        participants: ['user123', 'user456'],
        text: 'Hello',
        userId: 'user123',
        sendNotification: true,
      };

      const mockConversation = {
        id: 'conv123',
      };

      const mockMessage = {
        id: 'message123',
      };

      const { messagingService } = await import('@/services/messaging/messaging.service');
      vi.mocked(messagingService.createConversation).mockResolvedValue(mockConversation as any);
      vi.mocked(messagingService.sendMessage).mockResolvedValue(mockMessage as any);

      const { messageMapper } = await import('@/lib/mappers');
      vi.mocked(messageMapper.map).mockReturnValue({
        id: 'message123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({} as any);

      const result = await messagingFacade.sendMessage(messageData);

      expect(result.success).toBe(true);
      expect(result.notificationSent).toBe(true);
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });

    it('devrait retourner une erreur si ni conversationId ni participants ne sont fournis', async () => {
      const messageData: MessagingFacadeData = {
        text: 'Hello',
        userId: 'user123',
      };

      const result = await messagingFacade.sendMessage(messageData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('conversationId or participants');
    });

    it('devrait gérer les erreurs de service', async () => {
      const messageData: MessagingFacadeData = {
        conversationId: 'conv123',
        text: 'Hello',
        userId: 'user123',
      };

      const { messagingService } = await import('@/services/messaging/messaging.service');
      vi.mocked(messagingService.getConversations).mockRejectedValue(new Error('Service error'));

      const result = await messagingFacade.sendMessage(messageData);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('MESSAGE_SEND_FAILED');
    });
  });

  describe('execute', () => {
    it('devrait appeler sendMessage via execute', async () => {
      const messageData: MessagingFacadeData = {
        conversationId: 'conv123',
        text: 'Hello',
        userId: 'user123',
      };

      const mockConversation = {
        id: 'conv123',
      };

      const mockMessage = {
        id: 'message123',
      };

      const { messagingService } = await import('@/services/messaging/messaging.service');
      vi.mocked(messagingService.getConversations).mockResolvedValue([mockConversation] as any);
      vi.mocked(messagingService.sendMessage).mockResolvedValue(mockMessage as any);

      const { messageMapper } = await import('@/lib/mappers');
      vi.mocked(messageMapper.map).mockReturnValue({
        id: 'message123',
      } as any);

      const result = await messagingFacade.execute(messageData);

      expect(result.success).toBe(true);
      expect(messagingService.sendMessage).toHaveBeenCalled();
    });
  });
});
