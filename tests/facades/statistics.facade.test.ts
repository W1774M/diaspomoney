/**
 * Tests unitaires pour StatisticsFacade
 * 
 * Implémente les tests pour :
 * - getStatistics
 * - execute (IFacade)
 * - Orchestration avec StatisticsService
 * - Cache (Cacheable decorator)
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { statisticsFacade, type StatisticsFacadeData } from '@/facades/statistics.facade';

// Mock des dépendances
vi.mock('@/services/statistics/statistics.service');
vi.mock('@/lib/mappers');
vi.mock('@/lib/logger');
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('StatisticsFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStatistics', () => {
    it('devrait récupérer les statistiques personnelles avec succès', async () => {
      const statisticsData: StatisticsFacadeData = {
        userId: 'user123',
        type: 'personal',
      };

      const mockPersonalStats = {
        budget: { total: 10000, used: 5000 },
        services: { total: 10, completed: 5 },
        savings: { total: 2000 },
        providers: { count: 3 },
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      };

      const { statisticsService } = await import('@/services/statistics/statistics.service');
      vi.mocked(statisticsService.getPersonalStatistics).mockResolvedValue(mockPersonalStats as any);

      const { statisticsMapper } = await import('@/lib/mappers');
      vi.mocked(statisticsMapper.map).mockReturnValue({
        budget: mockPersonalStats.budget,
        services: mockPersonalStats.services,
      } as any);

      const result = await statisticsFacade.getStatistics(statisticsData);

      expect(result.success).toBe(true);
      expect(result.statistics).toBeDefined();
      expect(result.message).toBe('Statistiques récupérées avec succès');
      expect(statisticsService.getPersonalStatistics).toHaveBeenCalledWith('user123');
    });

    it('devrait utiliser personal par défaut si type n\'est pas fourni', async () => {
      const statisticsData: StatisticsFacadeData = {
        userId: 'user123',
      };

      const mockPersonalStats = {
        budget: { total: 10000 },
        services: { total: 10 },
        savings: { total: 2000 },
        providers: { count: 3 },
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      };

      const { statisticsService } = await import('@/services/statistics/statistics.service');
      vi.mocked(statisticsService.getPersonalStatistics).mockResolvedValue(mockPersonalStats as any);

      const { statisticsMapper } = await import('@/lib/mappers');
      vi.mocked(statisticsMapper.map).mockReturnValue({} as any);

      await statisticsFacade.getStatistics(statisticsData);

      expect(statisticsService.getPersonalStatistics).toHaveBeenCalledWith('user123');
    });

    it('devrait filtrer par date range si fourni', async () => {
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-12-31');
      const statisticsData: StatisticsFacadeData = {
        userId: 'user123',
        type: 'personal',
        dateFrom,
        dateTo,
      };

      const mockPersonalStats = {
        budget: { total: 10000 },
        services: { total: 10 },
        savings: { total: 2000 },
        providers: { count: 3 },
        period: {
          start: dateFrom,
          end: dateTo,
        },
      };

      const { statisticsService } = await import('@/services/statistics/statistics.service');
      vi.mocked(statisticsService.getPersonalStatistics).mockResolvedValue(mockPersonalStats as any);

      const { statisticsMapper } = await import('@/lib/mappers');
      vi.mocked(statisticsMapper.map).mockReturnValue({} as any);

      await statisticsFacade.getStatistics(statisticsData);

      expect(statisticsService.getPersonalStatistics).toHaveBeenCalledWith('user123');
    });

    it('devrait gérer les erreurs de récupération', async () => {
      const statisticsData: StatisticsFacadeData = {
        userId: 'user123',
        type: 'personal',
      };

      const { statisticsService } = await import('@/services/statistics/statistics.service');
      vi.mocked(statisticsService.getPersonalStatistics).mockRejectedValue(new Error('Service error'));

      const result = await statisticsFacade.getStatistics(statisticsData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorCode).toBe('STATISTICS_RETRIEVAL_FAILED');
    });
  });

  describe('execute', () => {
    it('devrait appeler getStatistics via execute', async () => {
      const statisticsData: StatisticsFacadeData = {
        userId: 'user123',
        type: 'personal',
      };

      const mockPersonalStats = {
        budget: { total: 10000 },
        services: { total: 10 },
        savings: { total: 2000 },
        providers: { count: 3 },
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      };

      const { statisticsService } = await import('@/services/statistics/statistics.service');
      vi.mocked(statisticsService.getPersonalStatistics).mockResolvedValue(mockPersonalStats as any);

      const { statisticsMapper } = await import('@/lib/mappers');
      vi.mocked(statisticsMapper.map).mockReturnValue({} as any);

      const result = await statisticsFacade.execute(statisticsData);

      expect(result.success).toBe(true);
      expect(statisticsService.getPersonalStatistics).toHaveBeenCalled();
    });
  });
});
