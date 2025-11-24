/**
 * BTP Facade - DiaspoMoney
 *
 * Facade Pattern pour simplifier le processus de gestion BTP
 * Orchestre BTPService
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { Audit } from '@/lib/decorators/audit.decorator';
import { Performance } from '@/lib/decorators/performance.decorator';
import { logger } from '@/lib/logger';
import { btpService } from '@/services/btp/btp.service';
import * as Sentry from '@sentry/nextjs';
import type { BTPFacadeData, BTPFacadeResult, IFacade, FacadeOptions } from '@/lib/types';
import { z } from 'zod';

// Réexporter pour compatibilité
export type { BTPFacadeData, BTPFacadeResult };

const BTPFacadeSchema = z.object({
  operation: z.enum(['searchProperties', 'searchContractors', 'createQuote', 'createProject']),
  data: z.record(z.any()),
  userId: z.string().optional(),
});

/**
 * BTPFacade - Facade pour le processus de gestion BTP
 */
export class BTPFacade implements IFacade<BTPFacadeData, BTPFacadeResult> {
  private static instance: BTPFacade;

  private constructor() {}

  static getInstance(): BTPFacade {
    if (!BTPFacade.instance) {
      BTPFacade.instance = new BTPFacade();
    }
    return BTPFacade.instance;
  }

  /**
   * Exécuter la facade (implémentation de IFacade)
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: BTPFacadeSchema,
        paramName: 'data',
      },
    ],
  })
  async execute(
    data: BTPFacadeData,
    _options?: FacadeOptions,
  ): Promise<BTPFacadeResult> {
    return this.executeOperation(data);
  }

  @Audit({ eventType: 'BTP_OPERATION', includeArgs: true })
  @Performance({ warningThreshold: 3000, errorThreshold: 8000 })
  async executeOperation(data: BTPFacadeData): Promise<BTPFacadeResult> {
    try {
      logger.info(
        {
          operation: data.operation,
          userId: data.userId || data.metadata?.['userId'],
        },
        'BTPFacade.executeOperation called',
      );

      let result = null;

      switch (data.operation) {
        case 'searchProperties':
          result = await btpService.searchProperties(data.data as any);
          break;
        case 'searchContractors':
          result = await btpService.searchContractors(data.data as any);
          break;
        case 'createQuote':
          result = await btpService.createBTPQuote(data.data as any);
          break;
        case 'createProject':
          result = await btpService.createConstructionProject(data.data as any);
          break;
        default:
          throw new Error(`Unknown operation: ${data.operation}`);
      }

      logger.info(
        {
          operation: data.operation,
          success: !!result,
        },
        'BTP operation executed successfully',
      );

      return {
        success: true,
        result,
        message: `Opération ${data.operation} exécutée avec succès`,
      };
    } catch (error: any) {
      logger.error(
        {
          error,
          operation: data.operation,
          userId: data.userId || data.metadata?.['userId'],
        },
        'Error in BTPFacade.executeOperation',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'BTPFacade',
          action: 'executeOperation',
        },
        extra: {
          operation: data.operation,
          userId: data.userId || data.metadata?.['userId'],
        },
      });

      return {
        success: false,
        error: error.message || `Erreur lors de l'exécution de l'opération ${data.operation}`,
        errorCode: 'BTP_OPERATION_FAILED',
      };
    }
  }
}

// Instance singleton exportée
export const btpFacade = BTPFacade.getInstance();

