/**
 * Interface du repository pour les spécialités
 */

import { ISpeciality } from '@/lib/types';
import { IRepository } from './IRepository';

export interface ISpecialityRepository
  extends IRepository<ISpeciality, string> {
  /**
   * Trouver une spécialité par nom
   */
  findByName(name: string): Promise<ISpeciality | null>;

  /**
   * Trouver des spécialités par groupe
   */
  findByGroup(group: string): Promise<ISpeciality[]>;

  /**
   * Trouver des spécialités actives
   */
  findActive(): Promise<ISpeciality[]>;
}
