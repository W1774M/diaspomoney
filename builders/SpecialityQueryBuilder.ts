/**
 * SpecialityQueryBuilder - Builder spécialisé pour les requêtes de spécialités
 * Étend QueryBuilder avec des méthodes spécifiques aux spécialités
 */

import { SPECIALITY_TYPES } from '@/lib/constants';
import { QueryBuilder } from './QueryBuilder';

export class SpecialityQueryBuilder extends QueryBuilder {
  /**
   * Filtrer par nom
   */
  byName(name: string): this {
    return this.whereRegex('name', name, 'i');
  }

  /**
   * Filtrer par groupe
   */
  byGroup(group: string): this {
    return this.where('group', group);
  }

  /**
   * Filtrer par type de spécialité
   */
  byType(type: typeof SPECIALITY_TYPES[keyof typeof SPECIALITY_TYPES]): this {
    return this.where('type', type);
  }

  /**
   * Filtrer les spécialités actives
   */
  active(): this {
    return this.where('isActive', true);
  }

  /**
   * Filtrer les spécialités inactives
   */
  inactive(): this {
    return this.where('isActive', false);
  }

  /**
   * Filtrer par description (recherche partielle)
   */
  byDescription(description: string): this {
    return this.whereRegex('description', description, 'i');
  }

  /**
   * Filtrer les spécialités santé
   */
  health(): this {
    return this.where('type', SPECIALITY_TYPES.HEALTH);
  }

  /**
   * Filtrer les spécialités BTP
   */
  btp(): this {
    return this.where('type', SPECIALITY_TYPES.BTP);
  }

  /**
   * Filtrer les spécialités éducation
   */
  education(): this {
    return this.where('type', SPECIALITY_TYPES.EDUCATION);
  }

  /**
   * Filtrer les spécialités juridiques
   */
  legal(): this {
    return this.where('type', SPECIALITY_TYPES.LEGAL);
  }

  /**
   * Filtrer les spécialités finance
   */
  finance(): this {
    return this.where('type', SPECIALITY_TYPES.FINANCE);
  }

  /**
   * Filtrer les spécialités technologie
   */
  technology(): this {
    return this.where('type', SPECIALITY_TYPES.TECHNOLOGY);
  }
}

