/**
 * Interface du repository pour les logs d'audit
 */

import type { AuditLog, AuditLogWithId, AuditQuery } from '@/lib/security/audit-logging';
import {
  PaginatedResult,
  PaginationOptions,
} from './IRepository';

// Interface personnalisée car AuditLog a _id optionnel mais les résultats de lecture ont _id requis
export interface IAuditLogRepository {
  /**
   * Trouver un log d'audit par son ID
   */
  findById(id: string): Promise<AuditLogWithId | null>;

  /**
   * Trouver tous les logs d'audit
   */
  findAll(filters?: Record<string, any>): Promise<AuditLogWithId[]>;

  /**
   * Trouver un log d'audit avec filtres
   */
  findOne(filters: Record<string, any>): Promise<AuditLogWithId | null>;

  /**
   * Créer un log d'audit
   */
  create(data: Partial<AuditLog>): Promise<AuditLogWithId>;

  /**
   * Mettre à jour un log d'audit
   */
  update(id: string, data: Partial<AuditLog>): Promise<AuditLogWithId | null>;

  /**
   * Supprimer un log d'audit
   */
  delete(id: string): Promise<boolean>;

  /**
   * Compter les logs d'audit
   */
  count(filters?: Record<string, any>): Promise<number>;

  /**
   * Trouver des logs d'audit avec pagination
   */
  findWithPagination(
    filters?: Record<string, any>,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<AuditLogWithId>>;

  /**
   * Rechercher des logs d'audit avec filtres avancés
   */
  searchAuditLogs(
    query: AuditQuery,
    options?: PaginationOptions
  ): Promise<PaginatedResult<AuditLogWithId>>;

  /**
   * Obtenir les statistiques d'audit
   */
  getAuditStats(period: 'day' | 'week' | 'month'): Promise<{
    totalLogs: number;
    logsByCategory: Record<string, number>;
    logsBySeverity: Record<string, number>;
    logsByOutcome: Record<string, number>;
    averageRiskScore: number;
    complianceIssues: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
  }>;

  /**
   * Supprimer les logs d'audit expirés (selon retentionPeriod)
   */
  deleteExpiredLogs(): Promise<number>;

  /**
   * Trouver les logs d'audit par utilisateur
   */
  findByUserId(
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<AuditLogWithId>>;

  /**
   * Trouver les logs d'audit par action
   */
  findByAction(
    action: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<AuditLogWithId>>;

  /**
   * Trouver les logs d'audit par catégorie
   */
  findByCategory(
    category: AuditLog['category'],
    options?: PaginationOptions
  ): Promise<PaginatedResult<AuditLogWithId>>;

  /**
   * Trouver les logs d'audit par sévérité
   */
  findBySeverity(
    severity: AuditLog['severity'],
    options?: PaginationOptions
  ): Promise<PaginatedResult<AuditLogWithId>>;
}
