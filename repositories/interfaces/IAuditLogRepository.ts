/**
 * Interface du repository pour les logs d'audit
 */

import type { AuditLog, AuditQuery } from '@/lib/security/audit-logging';
import {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';

export interface IAuditLogRepository extends IPaginatedRepository<AuditLog> {
  /**
   * Rechercher des logs d'audit avec filtres avancés
   */
  searchAuditLogs(
    query: AuditQuery,
    options?: PaginationOptions
  ): Promise<PaginatedResult<AuditLog>>;

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
  ): Promise<PaginatedResult<AuditLog>>;

  /**
   * Trouver les logs d'audit par action
   */
  findByAction(
    action: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<AuditLog>>;

  /**
   * Trouver les logs d'audit par catégorie
   */
  findByCategory(
    category: AuditLog['category'],
    options?: PaginationOptions
  ): Promise<PaginatedResult<AuditLog>>;

  /**
   * Trouver les logs d'audit par sévérité
   */
  findBySeverity(
    severity: AuditLog['severity'],
    options?: PaginationOptions
  ): Promise<PaginatedResult<AuditLog>>;
}
