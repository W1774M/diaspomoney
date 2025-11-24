/**
 * Tests unitaires pour ComplaintFacade
 * 
 * Implémente les tests pour :
 * - createComplaint
 * - Orchestration des services (ComplaintService, NotificationService, EmailService)
 * - Gestion d'erreurs
 * - Validation des données
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { complaintFacade, type ComplaintFacadeData } from '@/facades/complaint.facade';

// Mock des dépendances
vi.mock('@/services/complaint/complaint.service');
vi.mock('@/services/notification/notification.service');
vi.mock('@/services/email/email.service');
vi.mock('@/repositories');
vi.mock('@/lib/mappers');
vi.mock('@/lib/logger');
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('ComplaintFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createComplaint', () => {
    it('devrait créer une réclamation avec succès', async () => {
      const complaintData: ComplaintFacadeData = {
        userId: 'user123',
        title: 'Problème de service',
        type: 'QUALITY',
        priority: 'HIGH',
        description: 'Description du problème',
        provider: 'provider123',
        appointmentId: 'appointment123',
      };

      const mockComplaint = {
        _id: 'complaint123',
        id: 'complaint123',
        title: complaintData.title,
        type: complaintData.type,
        priority: complaintData.priority,
      };

      const { complaintService } = await import('@/services/complaint/complaint.service');
      vi.mocked(complaintService.createComplaint).mockResolvedValue(mockComplaint as any);

      const { complaintMapper } = await import('@/lib/mappers');
      vi.mocked(complaintMapper.map).mockReturnValue({
        id: 'complaint123',
      } as any);

      const result = await complaintFacade.createComplaint(complaintData);

      expect(result.success).toBe(true);
      expect(result.complaintId).toBe('complaint123');
      expect(complaintService.createComplaint).toHaveBeenCalledWith(complaintData);
    });

    it('devrait envoyer une notification si sendNotification est true', async () => {
      const complaintData: ComplaintFacadeData = {
        userId: 'user123',
        title: 'Problème de service',
        type: 'QUALITY',
        priority: 'HIGH',
        description: 'Description',
        provider: 'provider123',
        appointmentId: 'appointment123',
        sendNotification: true,
      };

      const mockComplaint = {
        _id: 'complaint123',
        id: 'complaint123',
      };

      const { complaintService } = await import('@/services/complaint/complaint.service');
      vi.mocked(complaintService.createComplaint).mockResolvedValue(mockComplaint as any);

      const { complaintMapper } = await import('@/lib/mappers');
      vi.mocked(complaintMapper.map).mockReturnValue({
        id: 'complaint123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({} as any);

      const result = await complaintFacade.createComplaint(complaintData);

      expect(result.success).toBe(true);
      expect(result.notificationSent).toBe(true);
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });

    it('devrait notifier le provider si notifyProvider est true', async () => {
      const complaintData: ComplaintFacadeData = {
        userId: 'user123',
        title: 'Problème',
        type: 'QUALITY',
        priority: 'MEDIUM',
        description: 'Description',
        provider: 'provider123',
        appointmentId: 'appointment123',
        notifyProvider: true,
      };

      const mockComplaint = {
        _id: 'complaint123',
        id: 'complaint123',
      };

      const { complaintService } = await import('@/services/complaint/complaint.service');
      vi.mocked(complaintService.createComplaint).mockResolvedValue(mockComplaint as any);

      const { complaintMapper } = await import('@/lib/mappers');
      vi.mocked(complaintMapper.map).mockReturnValue({
        id: 'complaint123',
      } as any);

      const { getUserRepository } = await import('@/repositories');
      const mockRepository = getUserRepository();
      vi.mocked(mockRepository.findById).mockResolvedValue({
        id: 'provider123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({} as any);

      const result = await complaintFacade.createComplaint(complaintData);

      expect(result.success).toBe(true);
      expect(notificationService.sendNotification).toHaveBeenCalledTimes(2); // User + Provider
    });

    it('devrait envoyer un email si sendEmail est true et recipientEmail est fourni', async () => {
      const complaintData: ComplaintFacadeData = {
        userId: 'user123',
        title: 'Problème',
        type: 'BILLING',
        priority: 'LOW',
        description: 'Description',
        provider: 'provider123',
        appointmentId: 'appointment123',
        sendEmail: true,
        recipientEmail: 'client@example.com',
      };

      const mockComplaint = {
        _id: 'complaint123',
        id: 'complaint123',
        title: 'Problème',
        type: 'BILLING',
        priority: 'LOW',
      };

      const { complaintService } = await import('@/services/complaint/complaint.service');
      vi.mocked(complaintService.createComplaint).mockResolvedValue(mockComplaint as any);

      const { complaintMapper } = await import('@/lib/mappers');
      vi.mocked(complaintMapper.map).mockReturnValue({
        id: 'complaint123',
      } as any);

      const { emailService } = await import('@/services/email/email.service');
      vi.mocked(emailService.sendCustomEmail).mockResolvedValue(true);

      const result = await complaintFacade.createComplaint(complaintData);

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(emailService.sendCustomEmail).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de création de réclamation', async () => {
      const complaintData: ComplaintFacadeData = {
        userId: 'user123',
        title: 'Problème',
        type: 'QUALITY',
        priority: 'HIGH',
        description: 'Description',
        provider: 'provider123',
        appointmentId: 'appointment123',
      };

      const { complaintService } = await import('@/services/complaint/complaint.service');
      vi.mocked(complaintService.createComplaint).mockRejectedValue(new Error('Service error'));

      const result = await complaintFacade.createComplaint(complaintData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('devrait continuer même si la notification échoue', async () => {
      const complaintData: ComplaintFacadeData = {
        userId: 'user123',
        title: 'Problème',
        type: 'QUALITY',
        priority: 'HIGH',
        description: 'Description',
        provider: 'provider123',
        appointmentId: 'appointment123',
        sendNotification: true,
      };

      const mockComplaint = {
        _id: 'complaint123',
        id: 'complaint123',
      };

      const { complaintService } = await import('@/services/complaint/complaint.service');
      vi.mocked(complaintService.createComplaint).mockResolvedValue(mockComplaint as any);

      const { complaintMapper } = await import('@/lib/mappers');
      vi.mocked(complaintMapper.map).mockReturnValue({
        id: 'complaint123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockRejectedValue(new Error('Notification error'));

      const result = await complaintFacade.createComplaint(complaintData);

      expect(result.success).toBe(true);
      expect(result.notificationSent).toBe(false);
    });
  });
});
