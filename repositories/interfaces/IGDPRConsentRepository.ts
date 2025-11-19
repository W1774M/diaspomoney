/**
 * Interface du repository pour les consentements GDPR
 */

import type { GDPRConsent } from '@/lib/types';
import {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';

export interface GDPRConsentQuery {
  userId?: string;
  purpose?: string;
  legalBasis?: GDPRConsent['legalBasis'];
  isActive?: boolean;
  granted?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface IGDPRConsentRepository
  extends IPaginatedRepository<GDPRConsent> {
  /**
   * Rechercher des consentements avec filtres avancés
   */
  searchConsents(
    query: GDPRConsentQuery,
    options?: PaginationOptions
  ): Promise<PaginatedResult<GDPRConsent>>;

  /**
   * Trouver les consentements actifs d'un utilisateur
   */
  findActiveByUserId(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<GDPRConsent>>;

  /**
   * Retirer un consentement
   */
  withdrawConsent(
    consentId: string,
    userId: string,
    reason?: string
  ): Promise<GDPRConsent | null>;
}
