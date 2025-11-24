/**
 * Tests unitaires pour EducationFacade
 * 
 * Implémente les tests pour :
 * - executeOperation
 * - execute (IFacade)
 * - Toutes les opérations (searchSchools, enrollStudent, payTuition, createInquiry)
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { educationFacade, type EducationFacadeData } from '@/facades/education.facade';

// Mock des dépendances
vi.mock('@/services/education/education.service');
vi.mock('@/lib/logger');
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('EducationFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeOperation', () => {
    it('devrait exécuter searchSchools avec succès', async () => {
      const educationData: EducationFacadeData = {
        operation: 'searchSchools',
        data: { city: 'Montreal' },
        userId: 'user123',
      };

      const mockResult = {
        schools: [{ id: 'school1', city: 'Montreal' }],
      };

      const { educationService } = await import('@/services/education/education.service');
      vi.mocked(educationService.searchSchools).mockResolvedValue(mockResult as any);

      const result = await educationFacade.executeOperation(educationData);

      expect(result.success).toBe(true);
      expect(result.result).toEqual(mockResult);
      expect(educationService.searchSchools).toHaveBeenCalledWith(educationData.data);
    });

    it('devrait exécuter enrollStudent avec succès', async () => {
      const educationData: EducationFacadeData = {
        operation: 'enrollStudent',
        data: {
          studentData: { firstName: 'John', lastName: 'Doe' },
          schoolId: 'school123',
          programId: 'program123',
          academicYear: '2024',
        },
        userId: 'user123',
      };

      const mockResult = {
        enrollmentId: 'enrollment123',
      };

      const { educationService } = await import('@/services/education/education.service');
      vi.mocked(educationService.enrollStudent).mockResolvedValue(mockResult as any);

      const result = await educationFacade.executeOperation(educationData);

      expect(result.success).toBe(true);
      expect(result.result).toEqual(mockResult);
      expect(educationService.enrollStudent).toHaveBeenCalledWith(
        educationData.data['studentData'],
        educationData.data['schoolId'],
        educationData.data['programId'],
        educationData.data['academicYear'],
      );
    });

    it('devrait exécuter payTuition avec succès', async () => {
      const educationData: EducationFacadeData = {
        operation: 'payTuition',
        data: {
          studentId: 'student123',
          amount: 5000,
          currency: 'EUR',
        },
        userId: 'user123',
      };

      const mockResult = {
        paymentId: 'payment123',
        amount: 5000,
      };

      const { educationService } = await import('@/services/education/education.service');
      vi.mocked(educationService.payTuition).mockResolvedValue(mockResult as any);

      const result = await educationFacade.executeOperation(educationData);

      expect(result.success).toBe(true);
      expect(result.result).toEqual(mockResult);
      expect(educationService.payTuition).toHaveBeenCalledWith(
        educationData.data['studentId'],
        educationData.data['amount'],
        educationData.data['currency'],
        educationData.data,
      );
    });

    it('devrait exécuter createInquiry avec succès', async () => {
      const educationData: EducationFacadeData = {
        operation: 'createInquiry',
        data: { question: 'Test question' },
        userId: 'user123',
      };

      const mockResult = {
        inquiryId: 'inquiry123',
      };

      const { educationService } = await import('@/services/education/education.service');
      vi.mocked(educationService.createEducationInquiry).mockResolvedValue(mockResult as any);

      const result = await educationFacade.executeOperation(educationData);

      expect(result.success).toBe(true);
      expect(result.result).toEqual(mockResult);
      expect(educationService.createEducationInquiry).toHaveBeenCalledWith(educationData.data);
    });

    it('devrait retourner une erreur pour une opération inconnue', async () => {
      const educationData = {
        operation: 'unknownOperation' as any,
        data: {},
        userId: 'user123',
      };

      const result = await educationFacade.executeOperation(educationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown operation');
    });

    it('devrait gérer les erreurs de service', async () => {
      const educationData: EducationFacadeData = {
        operation: 'searchSchools',
        data: {},
        userId: 'user123',
      };

      const { educationService } = await import('@/services/education/education.service');
      vi.mocked(educationService.searchSchools).mockRejectedValue(new Error('Service error'));

      const result = await educationFacade.executeOperation(educationData);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('EDUCATION_OPERATION_FAILED');
    });
  });

  describe('execute', () => {
    it('devrait appeler executeOperation via execute', async () => {
      const educationData: EducationFacadeData = {
        operation: 'searchSchools',
        data: {},
        userId: 'user123',
      };

      const mockResult = {
        schools: [],
      };

      const { educationService } = await import('@/services/education/education.service');
      vi.mocked(educationService.searchSchools).mockResolvedValue(mockResult as any);

      const result = await educationFacade.execute(educationData);

      expect(result.success).toBe(true);
      expect(educationService.searchSchools).toHaveBeenCalled();
    });
  });
});
