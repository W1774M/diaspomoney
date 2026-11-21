/**
 * Statistics Facade - DiaspoMoney
 *
 * Facade Pattern pour simplifier le processus de calcul de statistiques
 * Orchestre StatisticsService avec cache et validation
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { Audit } from '@/lib/decorators/audit.decorator';
import { Performance } from '@/lib/decorators/performance.decorator';
import { Cacheable } from '@/lib/decorators/cache.decorator';
import { logger } from '@/lib/logger';
import { statisticsService } from '@/services/statistics/statistics.service';
import { statisticsMapper, type StatisticsRawData } from '@/lib/mappers';
import * as Sentry from '@sentry/nextjs';
import type { StatisticsFacadeData, StatisticsFacadeResult, IFacade, FacadeOptions } from '@/lib/types';
import { z } from 'zod';

// Réexporter pour compatibilité
export type { StatisticsFacadeData, StatisticsFacadeResult };

const GetStatisticsFacadeSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  type: z.enum(['personal', 'transactions', 'bookings', 'providers']).optional(),
});

/**
 * StatisticsFacade - Facade pour le processus de calcul de statistiques
 */
export class StatisticsFacade implements IFacade<StatisticsFacadeData, StatisticsFacadeResult> {
  private static instance: StatisticsFacade;

  private constructor() {}

  static getInstance(): StatisticsFacade {
    if (!StatisticsFacade.instance) {
      StatisticsFacade.instance = new StatisticsFacade();
    }
    return StatisticsFacade.instance;
  }

  /**
   * Exécuter la facade (implémentation de IFacade)
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: GetStatisticsFacadeSchema,
        paramName: 'data',
      },
    ],
  })
  async execute(
    data: StatisticsFacadeData,
    _options?: FacadeOptions,
  ): Promise<StatisticsFacadeResult> {
    return this.getStatistics(data);
  }

  @Cacheable(600, { prefix: 'StatisticsFacade:getStatistics' }) // Cache 10 minutes
  @Audit({ eventType: 'STATISTICS_RETRIEVED', includeArgs: true })
  @Performance({ warningThreshold: 3000, errorThreshold: 8000 })
  async getStatistics(data: StatisticsFacadeData): Promise<StatisticsFacadeResult> {
    try {
      logger.info(
        {
          userId: data.userId,
          type: data.type,
          dateFrom: data.dateFrom,
          dateTo: data.dateTo,
        },
        'StatisticsFacade.getStatistics called',
      );

      // Récupérer les statistiques selon le type
      let statistics = null;

      if (data.type === 'personal' || !data.type) {
        // Statistiques personnelles
        statistics = await statisticsService.getPersonalStatistics(data.userId);
      } else {
        // Autres types de statistiques (à implémenter selon les besoins)
        logger.warn(
          { type: data.type },
          'Statistics type not fully implemented, returning personal statistics',
        );
        statistics = await statisticsService.getPersonalStatistics(data.userId);
      }

      // Convertir PersonalStatistics en StatisticsRawData pour le mapper
      // Le mapper accepte providers comme any, donc on peut passer ProviderStatistics directement
      const rawData: StatisticsRawData = {
        budget: statistics.budget,
        services: statistics.services,
        savings: statistics.savings,
        providers: statistics.providers as any, // ProviderStatistics (objet) est compatible avec any dans StatisticsRawData
        period: {
          start: statistics.period.start,
          end: statistics.period.end,
        },
      };
      const mappedStatistics = statisticsMapper.map(rawData);

      logger.info(
        {
          userId: data.userId,
          type: data.type,
        },
        'Statistics retrieved successfully',
      );

      return {
        success: true,
        statistics: mappedStatistics,
        message: 'Statistiques récupérées avec succès',
      };
    } catch (error: any) {
      logger.error(
        {
          error,
          userId: data.userId,
          type: data.type,
        },
        'Error in StatisticsFacade.getStatistics',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'StatisticsFacade',
          action: 'getStatistics',
        },
        extra: {
          userId: data.userId,
          type: data.type,
        },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des statistiques',
        errorCode: 'STATISTICS_RETRIEVAL_FAILED',
      };
    }
  }
}

// Instance singleton exportée
export const statisticsFacade = StatisticsFacade.getInstance();

