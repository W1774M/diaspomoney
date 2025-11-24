/**
 * Speciality Facade - DiaspoMoney
 *
 * Facade Pattern pour simplifier le processus de gestion de spécialité
 * Orchestre SpecialityService avec validation
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { Audit } from '@/lib/decorators/audit.decorator';
import { Performance } from '@/lib/decorators/performance.decorator';
import { logger } from '@/lib/logger';
import { specialityService } from '@/services/speciality/speciality.service';
import { specialityMapper } from '@/lib/mappers';
import * as Sentry from '@sentry/nextjs';
import type { SpecialityFacadeData, SpecialityFacadeResult, IFacade, FacadeOptions } from '@/lib/types';
import { CreateSpecialitySchema } from '@/lib/validations/speciality.schema';

// Réexporter pour compatibilité
export type { SpecialityFacadeData, SpecialityFacadeResult };

/**
 * SpecialityFacade - Facade pour le processus de gestion de spécialité
 */
export class SpecialityFacade implements IFacade<SpecialityFacadeData, SpecialityFacadeResult> {
  private static instance: SpecialityFacade;

  private constructor() {}

  static getInstance(): SpecialityFacade {
    if (!SpecialityFacade.instance) {
      SpecialityFacade.instance = new SpecialityFacade();
    }
    return SpecialityFacade.instance;
  }

  /**
   * Exécuter la facade (implémentation de IFacade)
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: CreateSpecialitySchema,
        paramName: 'data',
      },
    ],
  })
  async execute(
    data: SpecialityFacadeData,
    _options?: FacadeOptions,
  ): Promise<SpecialityFacadeResult> {
    return this.createSpeciality(data);
  }

  @Audit({ eventType: 'SPECIALITY_CREATED', includeArgs: true })
  @Performance({ warningThreshold: 1000, errorThreshold: 3000 })
  async createSpeciality(data: SpecialityFacadeData): Promise<SpecialityFacadeResult> {
    try {
      logger.info(
        {
          name: data.name,
          group: data.group,
          isActive: data.isActive,
        },
        'SpecialityFacade.createSpeciality called',
      );

      // Créer la spécialité
      const specialityData = {
        name: data.name,
        description: data.description,
        group: data.group,
        isActive: data.isActive !== undefined ? data.isActive : true,
      };

      const speciality = await specialityService.createSpeciality(specialityData);
      const mappedSpeciality = specialityMapper.map(speciality);

      logger.info(
        {
          specialityId: speciality._id?.toString() || '',
          name: speciality.name,
        },
        'Speciality created successfully',
      );

      return {
        success: true,
        speciality: mappedSpeciality,
        message: 'Spécialité créée avec succès',
      };
    } catch (error: any) {
      logger.error(
        {
          error,
          name: data.name,
          group: data.group,
        },
        'Error in SpecialityFacade.createSpeciality',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'SpecialityFacade',
          action: 'createSpeciality',
        },
        extra: {
          name: data.name,
          group: data.group,
        },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de la création de la spécialité',
        errorCode: 'SPECIALITY_CREATION_FAILED',
      };
    }
  }
}

// Instance singleton exportée
export const specialityFacade = SpecialityFacade.getInstance();

