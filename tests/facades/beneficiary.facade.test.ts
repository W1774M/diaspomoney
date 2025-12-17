/**
 * Tests unitaires pour BeneficiaryFacade
 * 
 * Implémente les tests pour :
 * - createBeneficiary
 * - updateBeneficiary
 * - deleteBeneficiary
 * - getBeneficiaries
 * - Orchestration des services
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { beneficiaryFacade, type BeneficiaryFacadeData, type UpdateBeneficiaryFacadeData } from '@/facades/beneficiary.facade';

// Mock des dépendances
vi.mock('@/services/user/user.service');
vi.mock('@/services/notification/notification.service');
vi.mock('@/services/email/email.service');

// Mock des repositories - utiliser vi.hoisted() pour que les variables soient disponibles dans vi.mock
const { mockBeneficiaryRepository } = vi.hoisted(() => {
  return {
    mockBeneficiaryRepository: {
      findById: vi.fn(),
      findByPayer: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  };
});

vi.mock('@/repositories', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/repositories')>();
  return {
    ...actual,
    getBeneficiaryRepository: vi.fn(() => mockBeneficiaryRepository),
    getUserRepository: vi.fn(() => ({
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      findUsersWithFilters: vi.fn(),
    })),
    getAuditLogRepository: vi.fn(() => ({
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
    })),
  };
});

vi.mock('@/lib/mappers');
vi.mock('@/lib/logger');
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('BeneficiaryFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createBeneficiary', () => {
    it('devrait créer un bénéficiaire avec succès', async () => {
      const beneficiaryData: BeneficiaryFacadeData = {
        firstName: 'John',
        lastName: 'Doe',
        relationship: 'SPOUSE',
        location: {
          address: '123 Main St',
          city: 'Paris',
          country: 'FR',
        },
      };

      const mockBeneficiary = {
        _id: 'beneficiary123',
        id: 'beneficiary123',
        firstName: 'John',
        lastName: 'Doe',
        relationship: 'SPOUSE',
      };

      const { userService } = await import('@/services/user/user.service');
      vi.mocked(userService.addBeneficiary).mockResolvedValue(mockBeneficiary as any);

      const { beneficiaryMapper } = await import('@/lib/mappers');
      vi.mocked(beneficiaryMapper.map).mockReturnValue({
        id: 'beneficiary123',
        firstName: 'John',
        lastName: 'Doe',
      } as any);

      const result = await beneficiaryFacade.createBeneficiary('user123', beneficiaryData);

      expect(result.success).toBe(true);
      expect(result.beneficiary).toBeDefined();
      expect(userService.addBeneficiary).toHaveBeenCalled();
    });

    it('devrait envoyer une notification si sendNotification est true', async () => {
      const beneficiaryData: BeneficiaryFacadeData = {
        firstName: 'Jane',
        lastName: 'Doe',
        relationship: 'SPOUSE',
        location: {
          address: '123 Main St',
          city: 'Paris',
          country: 'FR',
        },
        sendNotification: true,
      };

      const mockBeneficiary = {
        _id: 'beneficiary123',
        id: 'beneficiary123',
      };

      const { userService } = await import('@/services/user/user.service');
      vi.mocked(userService.addBeneficiary).mockResolvedValue(mockBeneficiary as any);

      const { beneficiaryMapper } = await import('@/lib/mappers');
      vi.mocked(beneficiaryMapper.map).mockReturnValue({
        id: 'beneficiary123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({} as any);

      const result = await beneficiaryFacade.createBeneficiary('user123', beneficiaryData);

      expect(result.success).toBe(true);
      expect(result.notificationSent).toBe(true);
    });

    it('devrait envoyer un email si sendEmail est true et email est fourni', async () => {
      const beneficiaryData: BeneficiaryFacadeData = {
        firstName: 'John',
        lastName: 'Doe',
        relationship: 'SPOUSE',
        location: {
          address: '123 Main St',
          city: 'Paris',
          country: 'FR',
        },
        email: 'john@example.com',
        sendEmail: true,
      };

      const mockBeneficiary = {
        _id: 'beneficiary123',
        id: 'beneficiary123',
      };

      const { userService } = await import('@/services/user/user.service');
      vi.mocked(userService.addBeneficiary).mockResolvedValue(mockBeneficiary as any);

      const { beneficiaryMapper } = await import('@/lib/mappers');
      vi.mocked(beneficiaryMapper.map).mockReturnValue({
        id: 'beneficiary123',
      } as any);

      const { emailService } = await import('@/services/email/email.service');
      vi.mocked(emailService.sendCustomEmail).mockResolvedValue(true);

      const result = await beneficiaryFacade.createBeneficiary('user123', beneficiaryData);

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
    });
  });

  describe('updateBeneficiary', () => {
    it('devrait mettre à jour un bénéficiaire avec succès', async () => {
      const updateData: UpdateBeneficiaryFacadeData = {
        firstName: 'John Updated',
        email: 'john.updated@example.com',
      };

      const mockExistingBeneficiary = {
        id: 'beneficiary123',
        payerId: 'user123',
        email: 'john@example.com',
      };

      mockBeneficiaryRepository.findById.mockResolvedValue(mockExistingBeneficiary as any);
      mockBeneficiaryRepository.findByPayer.mockResolvedValue({
        data: [mockExistingBeneficiary],
      } as any);
      mockBeneficiaryRepository.update.mockResolvedValue({
        ...mockExistingBeneficiary,
        ...updateData,
      } as any);

      const result = await beneficiaryFacade.updateBeneficiary(
        'user123',
        'beneficiary123',
        updateData,
      );

      expect(result.success).toBe(true);
      expect(result.beneficiary).toBeDefined();
    });

    it('devrait retourner une erreur si le bénéficiaire n\'existe pas', async () => {
      mockBeneficiaryRepository.findById.mockResolvedValue(null);

      const result = await beneficiaryFacade.updateBeneficiary(
        'user123',
        'nonexistent',
        { firstName: 'John' },
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bénéficiaire non trouvé');
    });

    it('devrait retourner une erreur si le bénéficiaire n\'appartient pas à l\'utilisateur', async () => {
      const mockExistingBeneficiary = {
        id: 'beneficiary123',
        payerId: 'other-user',
      };

      mockBeneficiaryRepository.findById.mockResolvedValue(mockExistingBeneficiary as any);

      const result = await beneficiaryFacade.updateBeneficiary(
        'user123',
        'beneficiary123',
        { firstName: 'John' },
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Ce bénéficiaire n'appartient pas à cet utilisateur");
    });
  });

  describe('deleteBeneficiary', () => {
    it('devrait supprimer un bénéficiaire avec succès', async () => {
      const { userService } = await import('@/services/user/user.service');
      vi.mocked(userService.removeBeneficiary).mockResolvedValue(undefined);

      const result = await beneficiaryFacade.deleteBeneficiary('user123', 'beneficiary123');

      expect(result.success).toBe(true);
      expect(userService.removeBeneficiary).toHaveBeenCalledWith('user123', 'beneficiary123');
    });

    it('devrait gérer les erreurs de suppression', async () => {
      const { userService } = await import('@/services/user/user.service');
      vi.mocked(userService.removeBeneficiary).mockRejectedValue(new Error('Delete error'));

      const result = await beneficiaryFacade.deleteBeneficiary('user123', 'beneficiary123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getBeneficiaries', () => {
    it('devrait récupérer tous les bénéficiaires d\'un utilisateur', async () => {
      const mockBeneficiaries = [
        {
          id: 'beneficiary1',
          firstName: 'John',
          lastName: 'Doe',
        },
        {
          id: 'beneficiary2',
          firstName: 'Jane',
          lastName: 'Doe',
        },
      ];

      const { userService } = await import('@/services/user/user.service');
      vi.mocked(userService.getBeneficiaries).mockResolvedValue(mockBeneficiaries as any);

      const result = await beneficiaryFacade.getBeneficiaries('user123');

      expect(result).toEqual(mockBeneficiaries);
      expect(userService.getBeneficiaries).toHaveBeenCalledWith('user123');
    });

    it('devrait propager les erreurs', async () => {
      const { userService } = await import('@/services/user/user.service');
      vi.mocked(userService.getBeneficiaries).mockRejectedValue(new Error('Service error'));

      await expect(beneficiaryFacade.getBeneficiaries('user123')).rejects.toThrow('Service error');
    });
  });
});
