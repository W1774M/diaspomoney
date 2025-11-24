/**
 * Interface du repository pour les services
 */

import { IRepository } from './IRepository';

export interface Service {
  _id: string;
  id: string;
  category: 'HEALTH' | 'EDUCATION' | 'BTP';
  label: string;
  description: string;
  price: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  associatedOptions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IServiceRepository extends IRepository<Service, string> {
  /**
   * Trouver un service par ID personnalisé
   */
  findByCustomId(id: string): Promise<Service | null>;

  /**
   * Trouver des services par catégorie
   */
  findByCategory(category: 'HEALTH' | 'EDUCATION' | 'BTP'): Promise<Service[]>;

  /**
   * Trouver des services actifs
   */
  findActive(): Promise<Service[]>;

  /**
   * Rechercher des services par texte
   */
  search(query: string): Promise<Service[]>;
}

