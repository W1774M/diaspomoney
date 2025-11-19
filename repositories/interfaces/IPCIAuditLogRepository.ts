/**
 * Interface du repository pour les logs d'audit PCI-DSS
 */

import type { PCIAuditLog } from '@/lib/types';
import {
  IPaginatedRepository,
  PaginatedResult,
  PaginationOptions,
} from './IRepository';

export interface PCIAuditLogQuery {
  userId?: string;
  transactionId?: string;
  event?: string;
  severity?: PCIAuditLog['severity'];
  complianceStatus?: PCIAuditLog['complianceStatus'];
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface IPCIAuditLogRepository
  extends IPaginatedRepository<PCIAuditLog> {
  /**
   * Rechercher des logs PCI avec filtres avancés
   */
  searchPCIAuditLogs(
    query: PCIAuditLogQuery,
    options?: PaginationOptions
  ): Promise<PaginatedResult<PCIAuditLog>>;

  /**
   * Obtenir les statistiques PCI
   */
  getPCIStats(period: 'day' | 'week' | 'month'): Promise<{
    totalLogs: number;
    logsByEvent: Record<string, number>;
    logsBySeverity: Record<string, number>;
    logsByComplianceStatus: Record<string, number>;
    averageComplianceScore: number;
    criticalIssues: number;
  }>;

  /**
   * Supprimer les logs PCI expirés
   */
  deleteExpiredLogs(): Promise<number>;
}
