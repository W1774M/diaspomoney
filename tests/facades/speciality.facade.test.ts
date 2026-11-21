/**
 * Tests unitaires pour SpecialityFacade
 * 
 * Implémente les tests pour :
 * - createSpeciality
 * - execute (IFacade)
 * - Orchestration avec SpecialityService
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { specialityFacade, type SpecialityFacadeData } from '@/facades/speciality.facade';

// Mock des dépendances
vi.mock('@/services/speciality/speciality.service');
vi.mock('@/lib/mappers');
vi.mock('@/lib/logger');
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('SpecialityFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createSpeciality', () => {
    it('devrait créer une spécialité avec succès', async () => {
      const specialityData: SpecialityFacadeData = {
        name: 'Cardiologie',
        description: 'Spécialité médicale',
        group: 'HEALTH',
        isActive: true,
      };

      const mockSpeciality = {
        _id: 'speciality123',
        name: 'Cardiologie',
        description: 'Spécialité médicale',
        group: 'HEALTH',
        isActive: true,
      };

      const { specialityService } = await import('@/services/speciality/speciality.service');
      vi.mocked(specialityService.createSpeciality).mockResolvedValue(mockSpeciality as any);

      const { specialityMapper } = await import('@/lib/mappers');
      vi.mocked(specialityMapper.map).mockReturnValue({
        id: 'speciality123',
        name: 'Cardiologie',
      } as any);

      const result = await specialityFacade.createSpeciality(specialityData);

      expect(result.success).toBe(true);
      expect(result.speciality).toBeDefined();
      expect(result.message).toBe('Spécialité créée avec succès');
      expect(specialityService.createSpeciality).toHaveBeenCalledWith({
        name: specialityData.name,
        description: specialityData.description,
        group: specialityData.group,
        isActive: true,
      });
    });

    it('devrait utiliser isActive par défaut à true si non fourni', async () => {
      const specialityData: SpecialityFacadeData = {
        name: 'Neurologie',
        description: 'Spécialité médicale',
        group: 'HEALTH',
      };

      const mockSpeciality = {
        _id: 'speciality123',
        name: 'Neurologie',
        isActive: true,
      };

      const { specialityService } = await import('@/services/speciality/speciality.service');
      vi.mocked(specialityService.createSpeciality).mockResolvedValue(mockSpeciality as any);

      const { specialityMapper } = await import('@/lib/mappers');
      vi.mocked(specialityMapper.map).mockReturnValue({
        id: 'speciality123',
      } as any);

      await specialityFacade.createSpeciality(specialityData);

      expect(specialityService.createSpeciality).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
        }),
      );
    });

    it('devrait gérer les erreurs de création', async () => {
      const specialityData: SpecialityFacadeData = {
        name: 'Cardiologie',
        description: 'Spécialité médicale',
        group: 'HEALTH',
      };

      const { specialityService } = await import('@/services/speciality/speciality.service');
      vi.mocked(specialityService.createSpeciality).mockRejectedValue(new Error('Service error'));

      const result = await specialityFacade.createSpeciality(specialityData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorCode).toBe('SPECIALITY_CREATION_FAILED');
    });
  });

  describe('execute', () => {
    it('devrait appeler createSpeciality via execute', async () => {
      const specialityData: SpecialityFacadeData = {
        name: 'Cardiologie',
        description: 'Spécialité médicale',
        group: 'HEALTH',
      };

      const mockSpeciality = {
        _id: 'speciality123',
        name: 'Cardiologie',
      };

      const { specialityService } = await import('@/services/speciality/speciality.service');
      vi.mocked(specialityService.createSpeciality).mockResolvedValue(mockSpeciality as any);

      const { specialityMapper } = await import('@/lib/mappers');
      vi.mocked(specialityMapper.map).mockReturnValue({
        id: 'speciality123',
      } as any);

      const result = await specialityFacade.execute(specialityData);

      expect(result.success).toBe(true);
      expect(specialityService.createSpeciality).toHaveBeenCalled();
    });
  });
});
