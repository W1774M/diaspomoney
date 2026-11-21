/**
 * Tests unitaires pour BTPFacade
 * 
 * Implémente les tests pour :
 * - executeOperation
 * - execute (IFacade)
 * - Toutes les opérations (searchProperties, searchContractors, createQuote, createProject)
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { btpFacade, type BTPFacadeData } from '@/facades/btp.facade';

// Mock des dépendances
vi.mock('@/services/btp/btp.service');
vi.mock('@/lib/logger');
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('BTPFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeOperation', () => {
    it('devrait exécuter searchProperties avec succès', async () => {
      const btpData: BTPFacadeData = {
        operation: 'searchProperties',
        data: { city: 'Paris' },
        userId: 'user123',
      };

      const mockResult = {
        properties: [{ id: 'prop1', city: 'Paris' }],
      };

      const { btpService } = await import('@/services/btp/btp.service');
      vi.mocked(btpService.searchProperties).mockResolvedValue(mockResult as any);

      const result = await btpFacade.executeOperation(btpData);

      expect(result.success).toBe(true);
      expect(result.result).toEqual(mockResult);
      expect(btpService.searchProperties).toHaveBeenCalledWith(btpData.data);
    });

    it('devrait exécuter searchContractors avec succès', async () => {
      const btpData: BTPFacadeData = {
        operation: 'searchContractors',
        data: { specialty: 'Plomberie' },
        userId: 'user123',
      };

      const mockResult = {
        contractors: [{ id: 'contractor1', specialty: 'Plomberie' }],
      };

      const { btpService } = await import('@/services/btp/btp.service');
      vi.mocked(btpService.searchContractors).mockResolvedValue(mockResult as any);

      const result = await btpFacade.executeOperation(btpData);

      expect(result.success).toBe(true);
      expect(result.result).toEqual(mockResult);
      expect(btpService.searchContractors).toHaveBeenCalledWith(btpData.data);
    });

    it('devrait exécuter createQuote avec succès', async () => {
      const btpData: BTPFacadeData = {
        operation: 'createQuote',
        data: { projectId: 'project123', amount: 5000 },
        userId: 'user123',
      };

      const mockResult = {
        id: 'quote123',
        amount: 5000,
      };

      const { btpService } = await import('@/services/btp/btp.service');
      vi.mocked(btpService.createBTPQuote).mockResolvedValue(mockResult as any);

      const result = await btpFacade.executeOperation(btpData);

      expect(result.success).toBe(true);
      expect(result.result).toEqual(mockResult);
      expect(btpService.createBTPQuote).toHaveBeenCalledWith(btpData.data);
    });

    it('devrait exécuter createProject avec succès', async () => {
      const btpData: BTPFacadeData = {
        operation: 'createProject',
        data: { name: 'Projet test', location: 'Paris' },
        userId: 'user123',
      };

      const mockResult = {
        id: 'project123',
        name: 'Projet test',
      };

      const { btpService } = await import('@/services/btp/btp.service');
      vi.mocked(btpService.createConstructionProject).mockResolvedValue(mockResult as any);

      const result = await btpFacade.executeOperation(btpData);

      expect(result.success).toBe(true);
      expect(result.result).toEqual(mockResult);
      expect(btpService.createConstructionProject).toHaveBeenCalledWith(btpData.data);
    });

    it('devrait retourner une erreur pour une opération inconnue', async () => {
      const btpData = {
        operation: 'unknownOperation' as any,
        data: {},
        userId: 'user123',
      };

      const result = await btpFacade.executeOperation(btpData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown operation');
    });

    it('devrait gérer les erreurs de service', async () => {
      const btpData: BTPFacadeData = {
        operation: 'searchProperties',
        data: {},
        userId: 'user123',
      };

      const { btpService } = await import('@/services/btp/btp.service');
      vi.mocked(btpService.searchProperties).mockRejectedValue(new Error('Service error'));

      const result = await btpFacade.executeOperation(btpData);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('BTP_OPERATION_FAILED');
    });
  });

  describe('execute', () => {
    it('devrait appeler executeOperation via execute', async () => {
      const btpData: BTPFacadeData = {
        operation: 'searchProperties',
        data: {},
        userId: 'user123',
      };

      const mockResult = {
        properties: [],
      };

      const { btpService } = await import('@/services/btp/btp.service');
      vi.mocked(btpService.searchProperties).mockResolvedValue(mockResult as any);

      const result = await btpFacade.execute(btpData);

      expect(result.success).toBe(true);
      expect(btpService.searchProperties).toHaveBeenCalled();
    });
  });
});
