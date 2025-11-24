/**
 * Education Facade - DiaspoMoney
 *
 * Facade Pattern pour simplifier le processus de gestion d'éducation
 * Orchestre EducationService
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { Audit } from '@/lib/decorators/audit.decorator';
import { Performance } from '@/lib/decorators/performance.decorator';
import { logger } from '@/lib/logger';
import { educationService } from '@/services/education/education.service';
import * as Sentry from '@sentry/nextjs';
import type { EducationFacadeData, EducationFacadeResult, IFacade, FacadeOptions } from '@/lib/types';
import { z } from 'zod';

// Réexporter pour compatibilité
export type { EducationFacadeData, EducationFacadeResult };

const EducationFacadeSchema = z.object({
  operation: z.enum(['searchSchools', 'enrollStudent', 'payTuition', 'createInquiry']),
  data: z.record(z.any()),
  userId: z.string().optional(),
});

/**
 * EducationFacade - Facade pour le processus de gestion d'éducation
 */
export class EducationFacade implements IFacade<EducationFacadeData, EducationFacadeResult> {
  private static instance: EducationFacade;

  private constructor() {}

  static getInstance(): EducationFacade {
    if (!EducationFacade.instance) {
      EducationFacade.instance = new EducationFacade();
    }
    return EducationFacade.instance;
  }

  /**
   * Exécuter la facade (implémentation de IFacade)
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: EducationFacadeSchema,
        paramName: 'data',
      },
    ],
  })
  async execute(
    data: EducationFacadeData,
    _options?: FacadeOptions,
  ): Promise<EducationFacadeResult> {
    return this.executeOperation(data);
  }

  @Audit({ eventType: 'EDUCATION_OPERATION', includeArgs: true })
  @Performance({ warningThreshold: 3000, errorThreshold: 8000 })
  async executeOperation(data: EducationFacadeData): Promise<EducationFacadeResult> {
    try {
      logger.info(
        {
          operation: data.operation,
          userId: data.userId || data.metadata?.['userId'],
        },
        'EducationFacade.executeOperation called',
      );

      let result = null;

      switch (data.operation) {
        case 'searchSchools':
          result = await educationService.searchSchools(data.data as any);
          break;
        case 'enrollStudent':
          result = await educationService.enrollStudent(
            data.data['studentData'] as any,
            data.data['schoolId'] as string,
            data.data['programId'] as string,
            data.data['academicYear'] || new Date().getFullYear().toString(),
          );
          break;
        case 'payTuition':
          result = await educationService.payTuition(
            data.data['studentId'] as string,
            data.data['amount'] as number,
            data.data['currency'] as string,
            data.data as any,
          );
          break;
        case 'createInquiry':
          result = await educationService.createEducationInquiry(data.data as any);
          break;
        default:
          throw new Error(`Unknown operation: ${data.operation}`);
      }

      logger.info(
        {
          operation: data.operation,
          success: !!result,
        },
        'Education operation executed successfully',
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
        'Error in EducationFacade.executeOperation',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'EducationFacade',
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
        errorCode: 'EDUCATION_OPERATION_FAILED',
      };
    }
  }
}

// Instance singleton exportée
export const educationFacade = EducationFacade.getInstance();

