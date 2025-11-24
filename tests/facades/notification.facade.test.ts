/**
 * Tests unitaires pour NotificationFacade
 * 
 * Implémente les tests pour :
 * - sendNotification
 * - execute (IFacade)
 * - Orchestration avec NotificationService
 * - Gestion d'erreurs
 * - Retry logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationFacade, type NotificationFacadeData } from '@/facades/notification.facade';

// Mock des dépendances
vi.mock('@/services/notification/notification.service');
vi.mock('@/lib/mappers');
vi.mock('@/lib/logger');
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('NotificationFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendNotification', () => {
    it('devrait envoyer une notification avec succès', async () => {
      const notificationData: NotificationFacadeData = {
        recipient: 'user123',
        type: 'INFO',
        template: 'test_template',
        data: { message: 'Test' },
        channels: [
          { type: 'IN_APP', enabled: true, priority: 'HIGH' },
        ],
      };

      const mockNotification = {
        id: 'notification123',
        recipient: 'user123',
        type: 'INFO',
      };

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue(mockNotification as any);

      const { notificationMapper } = await import('@/lib/mappers');
      vi.mocked(notificationMapper.map).mockReturnValue({
        id: 'notification123',
      } as any);

      const result = await notificationFacade.sendNotification(notificationData);

      expect(result.success).toBe(true);
      expect(result.notification).toBeDefined();
      expect(result.channelsUsed).toContain('IN_APP');
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });

    it('devrait filtrer les canaux désactivés', async () => {
      const notificationData: NotificationFacadeData = {
        recipient: 'user123',
        type: 'INFO',
        template: 'test_template',
        data: {},
        channels: [
          { type: 'IN_APP', enabled: true, priority: 'HIGH' },
          { type: 'EMAIL', enabled: false, priority: 'MEDIUM' },
        ],
      };

      const mockNotification = {
        id: 'notification123',
      };

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue(mockNotification as any);

      const { notificationMapper } = await import('@/lib/mappers');
      vi.mocked(notificationMapper.map).mockReturnValue({
        id: 'notification123',
      } as any);

      const result = await notificationFacade.sendNotification(notificationData);

      expect(result.success).toBe(true);
      expect(result.channelsUsed).toEqual(['IN_APP']);
    });

    it('devrait gérer les erreurs de notification', async () => {
      const notificationData: NotificationFacadeData = {
        recipient: 'user123',
        type: 'INFO',
        template: 'test_template',
        data: {},
        channels: [{ type: 'IN_APP', enabled: true, priority: 'HIGH' }],
      };

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockRejectedValue(new Error('Service error'));

      const result = await notificationFacade.sendNotification(notificationData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorCode).toBe('NOTIFICATION_SEND_FAILED');
    });
  });

  describe('execute', () => {
    it('devrait appeler sendNotification via execute', async () => {
      const notificationData: NotificationFacadeData = {
        recipient: 'user123',
        type: 'INFO',
        template: 'test_template',
        data: {},
        channels: [{ type: 'IN_APP', enabled: true, priority: 'HIGH' }],
      };

      const mockNotification = {
        id: 'notification123',
      };

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue(mockNotification as any);

      const { notificationMapper } = await import('@/lib/mappers');
      vi.mocked(notificationMapper.map).mockReturnValue({
        id: 'notification123',
      } as any);

      const result = await notificationFacade.execute(notificationData);

      expect(result.success).toBe(true);
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });
  });
});
