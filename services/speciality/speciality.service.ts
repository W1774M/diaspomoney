/**
 * Speciality Service - DiaspoMoney
 * Service de gestion des spécialités utilisant le Service Layer Pattern
 * Utilise le Repository Pattern pour l'accès aux données
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import {
  createValidationRule,
  Validate,
} from '@/lib/decorators/validate.decorator';
import { logger } from '@/lib/logger';
import { getSpecialityRepository, ISpecialityRepository } from '@/repositories';
import { ISpeciality } from '@/types';
import { z } from 'zod';

export interface CreateSpecialityData {
  name: string;
  description: string;
  group: string;
  isActive?: boolean;
}

export interface UpdateSpecialityData {
  name?: string;
  description?: string;
  group?: string;
  isActive?: boolean;
}

/**
 * SpecialityService utilisant le Service Layer Pattern
 * Utilise le Repository Pattern pour l'accès aux données (Dependency Injection)
 */
export class SpecialityService {
  private static instance: SpecialityService;
  private specialityRepository: ISpecialityRepository;

  private constructor() {
    // Dependency Injection : injecter le repository
    this.specialityRepository = getSpecialityRepository();
  }

  static getInstance(): SpecialityService {
    if (!SpecialityService.instance) {
      SpecialityService.instance = new SpecialityService();
    }
    return SpecialityService.instance;
  }

  /**
   * Récupérer une spécialité par ID
   */
  @Log({ level: 'info', logArgs: true })
  @Cacheable(300, { prefix: 'speciality' }) // Cache 5 minutes
  @Validate({
    rules: [
      createValidationRule(
        0,
        z.string().min(1, 'Speciality ID is required'),
        'id',
      ),
    ],
  })
  async getSpecialityById(id: string): Promise<ISpeciality | null> {
    try {
      // Utiliser le repository au lieu d'accéder directement au modèle
      return await this.specialityRepository.findById(id);
    } catch (error) {
      logger.error(
        { error, id },
        'Erreur lors de la récupération de la spécialité',
      );
      throw error;
    }
  }

  /**
   * Créer une nouvelle spécialité
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      createValidationRule(
        0,
        z.object({
          name: z.string().min(1, 'Name is required'),
          description: z.string().min(1, 'Description is required'),
          group: z.string().min(1, 'Group is required'),
          isActive: z.boolean().optional(),
        }),
        'data',
      ),
    ],
  })
  @InvalidateCache('speciality:*')
  async createSpeciality(data: CreateSpecialityData): Promise<ISpeciality> {
    try {
      // Vérifier si une spécialité avec le même nom existe déjà (Repository Pattern)
      const existing = await this.specialityRepository.findByName(data.name);
      if (existing) {
        throw new Error('Une spécialité avec ce nom existe déjà');
      }

      // Créer la spécialité via le repository
      return await this.specialityRepository.create({
        name: data.name,
        description: data.description,
        group: data.group,
        isActive: data.isActive !== undefined ? data.isActive : true,
      });
    } catch (error) {
      logger.error(
        { error, data },
        'Erreur lors de la création de la spécialité',
      );
      throw error;
    }
  }

  /**
   * Mettre à jour une spécialité
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      createValidationRule(
        0,
        z.string().min(1, 'Speciality ID is required'),
        'id',
      ),
      createValidationRule(
        1,
        z.object({
          name: z.string().min(1).optional(),
          description: z.string().min(1).optional(),
          group: z.string().min(1).optional(),
          isActive: z.boolean().optional(),
        }),
        'data',
      ),
    ],
  })
  @InvalidateCache('speciality:*')
  async updateSpeciality(
    id: string,
    data: UpdateSpecialityData,
  ): Promise<ISpeciality> {
    try {
      // Vérifier que la spécialité existe (Repository Pattern)
      const speciality = await this.specialityRepository.findById(id);
      if (!speciality) {
        throw new Error('Spécialité non trouvée');
      }

      // Vérifier si le nom est modifié et s'il existe déjà (Repository Pattern)
      if (data.name && data.name !== speciality.name) {
        const existing = await this.specialityRepository.findByName(data.name);
        if (existing) {
          throw new Error('Une spécialité avec ce nom existe déjà');
        }
      }

      // Mettre à jour via le repository
      const updated = await this.specialityRepository.update(id, data);
      if (!updated) {
        throw new Error('Erreur lors de la mise à jour');
      }

      return updated;
    } catch (error) {
      logger.error(
        { error, id, data },
        'Erreur lors de la mise à jour de la spécialité',
      );
      throw error;
    }
  }

  /**
   * Supprimer une spécialité
   */
  @Log({ level: 'info', logArgs: true })
  @InvalidateCache('speciality:*')
  @Validate({
    rules: [
      createValidationRule(
        0,
        z.string().min(1, 'Speciality ID is required'),
        'id',
      ),
    ],
  })
  async deleteSpeciality(id: string): Promise<boolean> {
    try {
      // Vérifier que la spécialité existe (Repository Pattern)
      const speciality = await this.specialityRepository.findById(id);
      if (!speciality) {
        throw new Error('Spécialité non trouvée');
      }

      // Supprimer via le repository
      return await this.specialityRepository.delete(id);
    } catch (error) {
      logger.error(
        { error, id },
        'Erreur lors de la suppression de la spécialité',
      );
      throw error;
    }
  }
}

// Singleton instance
export const specialityService = SpecialityService.getInstance();
