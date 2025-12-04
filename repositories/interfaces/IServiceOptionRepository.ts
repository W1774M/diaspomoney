/**
 * Interface du repository pour les options de service
 */

import { IRepository } from './IRepository';

export interface ServiceOption {
  _id: string;
  id: string;
  category?: 'HEALTH' | 'EDUCATION' | 'BTP'; // Optionnel car une option peut être associée à plusieurs services de catégories différentes
  label: string;
  description: string;
  price: number;
  optional: boolean;
  isActive: boolean;
  metadata?: Record<string, any>;
  associatedServices?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IServiceOptionRepository extends IRepository<ServiceOption, string> {
  /**
   * Trouver une option par ID personnalisé
   */
  findByCustomId(id: string): Promise<ServiceOption | null>;

  /**
   * Trouver des options par catégorie
   */
  findByCategory(category: 'HEALTH' | 'EDUCATION' | 'BTP'): Promise<ServiceOption[]>;

  /**
   * Trouver des options actives
   */
  findActive(): Promise<ServiceOption[]>;

  /**
   * Rechercher des options par texte
   */
  search(query: string): Promise<ServiceOption[]>;

  /**
   * Associer une option à un service
   */
  associateToService(optionId: string, serviceId: string): Promise<void>;

  /**
   * Dissocier une option d'un service
   */
  dissociateFromService(optionId: string, serviceId: string): Promise<void>;
}

