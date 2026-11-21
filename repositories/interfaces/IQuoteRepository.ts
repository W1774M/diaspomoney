/**
 * Interface du repository pour les devis
 */

import { IRepository } from './IRepository';
import type { Quote } from '@/lib/types';

// Re-export pour compatibilité
export type { Quote };

export interface QuoteFilters {
  type?: 'BTP' | 'EDUCATION';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  providerId?: string;
  schoolId?: string;
  contactEmail?: string;
  [key: string]: any;
}

export interface IQuoteRepository extends IRepository<Quote, string> {
  /**
   * Trouver des devis par type
   */
  findByType(type: 'BTP' | 'EDUCATION'): Promise<Quote[]>;

  /**
   * Trouver des devis par statut
   */
  findByStatus(
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  ): Promise<Quote[]>;

  /**
   * Trouver des devis par email de contact
   */
  findByContactEmail(email: string): Promise<Quote[]>;
}
