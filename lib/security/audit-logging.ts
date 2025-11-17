/**
 * Audit Logging System - DiaspoMoney
 * Système d'audit complet pour la conformité et la sécurité
 *
 * Implémente les design patterns :
 * - Singleton Pattern
 * - Repository Pattern (via IAuditLogRepository)
 * - Dependency Injection (via constructor injection)
 * - Logger Pattern (structured logging avec childLogger)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache)
 * - Error Handling Pattern (Sentry)
 * - Service Layer Pattern
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { childLogger } from '@/lib/logger';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { redis } from '@/lib/redis/redis-client';
import { getAuditLogRepository } from '@/repositories';
import * as Sentry from '@sentry/nextjs';

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  details: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category:
    | 'AUTHENTICATION'
    | 'AUTHORIZATION'
    | 'DATA_ACCESS'
    | 'DATA_MODIFICATION'
    | 'SYSTEM'
    | 'SECURITY';
  outcome: 'SUCCESS' | 'FAILURE' | 'WARNING';
  riskScore: number; // 0-100
  complianceFlags: string[];
  retentionPeriod: number; // days
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  resource?: string;
  severity?: string;
  category?: string;
  outcome?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalLogs: number;
  logsByCategory: Record<string, number>;
  logsBySeverity: Record<string, number>;
  logsByOutcome: Record<string, number>;
  averageRiskScore: number;
  complianceIssues: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
}

export class AuditLoggingSystem {
  private static instance: AuditLoggingSystem;
  private auditLogRepository = getAuditLogRepository();
  private readonly log = childLogger({
    component: 'AuditLoggingSystem',
  });

  private constructor() {
    // Dependency Injection : repository déjà injecté
  }

  static getInstance(): AuditLoggingSystem {
    if (!AuditLoggingSystem.instance) {
      AuditLoggingSystem.instance = new AuditLoggingSystem();
    }
    return AuditLoggingSystem.instance;
  }

  /**
   * Enregistrer un log d'audit
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('AuditLoggingSystem:*') // Invalider le cache après création
  async createAuditLog(
    action: string,
    resource: string,
    details: Record<string, any> = {},
    options: {
      userId?: string;
      sessionId?: string;
      resourceId?: string;
      method?: string;
      ipAddress?: string;
      userAgent?: string;
      severity?: AuditLog['severity'];
      category?: AuditLog['category'];
      outcome?: AuditLog['outcome'];
      riskScore?: number;
      complianceFlags?: string[];
      retentionPeriod?: number;
    } = {},
  ): Promise<AuditLog> {
    try {
      const auditLog: Omit<AuditLog, 'userId' | 'sessionId' | 'resourceId'> & {
        userId?: string | undefined;
        sessionId?: string | undefined;
        resourceId?: string | undefined;
      } = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId: options.userId ?? undefined,
        sessionId: options.sessionId ?? undefined,
        action,
        resource,
        resourceId: options.resourceId || '',
        method: options.method || 'UNKNOWN',
        ipAddress: options.ipAddress || 'unknown',
        userAgent: options.userAgent || 'unknown',
        details,
        severity: options.severity || 'LOW',
        category: options.category || 'SYSTEM',
        outcome: options.outcome || 'SUCCESS',
        riskScore:
          options.riskScore || this.calculateRiskScore(action, details),
        complianceFlags: options.complianceFlags || [],
        retentionPeriod: options.retentionPeriod || 2555, // 7 ans par défaut
      };

      // Sauvegarder en base de données
      await this.saveAuditLog(auditLog as AuditLog);

      // Mettre en cache pour les requêtes rapides
      await this.cacheAuditLog(auditLog as AuditLog);

      // Envoyer à Sentry si critique
      if (auditLog.severity === 'CRITICAL' || auditLog.riskScore > 80) {
        Sentry.captureMessage(`Critical Audit Event: ${action}`, {
          level: 'error',
          extra: auditLog,
        });
      }

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'audit_logs_created',
        value: 1,
        timestamp: new Date(),
        labels: {
          action,
          resource,
          severity: auditLog.severity,
          category: auditLog.category,
          outcome: auditLog.outcome,
        },
        type: 'counter',
      });

      this.log.info(
        {
          auditLogId: auditLog.id,
          action,
          resource,
          userId: auditLog.userId,
          severity: auditLog.severity,
          category: auditLog.category,
        },
        'Audit log created successfully',
      );

      return auditLog as unknown as AuditLog;
    } catch (error) {
      this.log.error(
        { error, action, resource, userId: options.userId },
        'Error creating audit log',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'AuditLoggingSystem',
          action: 'log',
        },
        extra: { action, resource, userId: options.userId },
      });
      throw error;
    }
  }

  /**
   * Rechercher des logs d'audit
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AuditLoggingSystem:searchAuditLogs' }) // Cache 5 minutes
  async searchAuditLogs(query: AuditQuery): Promise<{
    logs: AuditLog[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const paginationOptions = {
        limit: query.limit || 50,
        offset: query.offset || 0,
        page: query.offset
          ? Math.floor(query.offset / (query.limit || 50)) + 1
          : 1,
        sort: { timestamp: -1 } as Record<string, 1 | -1>,
      };

      const result = await this.auditLogRepository.searchAuditLogs(
        query,
        paginationOptions,
      );

      this.log.debug(
        {
          count: result.data.length,
          total: result.total,
          hasMore: result.hasMore,
          query,
        },
        'Audit logs searched successfully',
      );

      return {
        logs: result.data,
        total: result.total,
        hasMore: result.hasMore,
      };
    } catch (error) {
      this.log.error({ error, query }, 'Error searching audit logs');
      Sentry.captureException(error, {
        tags: {
          component: 'AuditLoggingSystem',
          action: 'searchAuditLogs',
        },
        extra: { query },
      });
      throw error;
    }
  }

  /**
   * Obtenir les statistiques d'audit
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(600, { prefix: 'AuditLoggingSystem:getAuditStats' }) // Cache 10 minutes
  async getAuditStats(
    period: 'day' | 'week' | 'month' = 'day',
  ): Promise<AuditStats> {
    try {
      const stats = await this.auditLogRepository.getAuditStats(period);

      return {
        totalLogs: stats.totalLogs,
        logsByCategory: stats.logsByCategory,
        logsBySeverity: stats.logsBySeverity,
        logsByOutcome: stats.logsByOutcome,
        averageRiskScore: stats.averageRiskScore,
        complianceIssues: stats.complianceIssues,
        topActions: stats.topActions,
        topUsers: stats.topUsers,
      };
    } catch (error) {
      this.log.error({ error, period }, 'Error getting audit stats');
      Sentry.captureException(error, {
        tags: {
          component: 'AuditLoggingSystem',
          action: 'getAuditStats',
        },
        extra: { period },
      });
      throw error;
    }
  }

  /**
   * Détecter les anomalies d'audit
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'AuditLoggingSystem:detectAnomalies' }) // Cache 5 minutes
  async detectAnomalies(userId?: string): Promise<{
    anomalies: Array<{
      type: string;
      description: string;
      severity: string;
      recommendations: string[];
    }>;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }> {
    try {
      const anomalies: Array<{
        type: string;
        description: string;
        severity: string;
        recommendations: string[];
      }> = [];

      // Détecter les tentatives de connexion suspectes
      const suspiciousLogins = await this.detectSuspiciousLogins(userId);
      if (suspiciousLogins.length > 0) {
        anomalies.push({
          type: 'SUSPICIOUS_LOGINS',
          description: 'Multiple failed login attempts detected',
          severity: 'HIGH',
          recommendations: [
            'Review login patterns',
            'Consider implementing account lockout',
            'Enable 2FA for affected users',
          ],
        });
      }

      // Détecter les accès non autorisés
      const unauthorizedAccess = await this.detectUnauthorizedAccess(userId);
      if (unauthorizedAccess.length > 0) {
        anomalies.push({
          type: 'UNAUTHORIZED_ACCESS',
          description: 'Unauthorized access attempts detected',
          severity: 'CRITICAL',
          recommendations: [
            'Immediately review access logs',
            'Block suspicious IP addresses',
            'Notify security team',
          ],
        });
      }

      // Détecter les modifications de données suspectes
      const suspiciousModifications = await this.detectSuspiciousModifications(
        userId,
      );
      if (suspiciousModifications.length > 0) {
        anomalies.push({
          type: 'SUSPICIOUS_MODIFICATIONS',
          description: 'Unusual data modification patterns detected',
          severity: 'MEDIUM',
          recommendations: [
            'Review data modification logs',
            'Verify user permissions',
            'Consider additional monitoring',
          ],
        });
      }

      // Calculer le niveau de risque
      const riskLevel = this.calculateRiskLevel(anomalies);

      this.log.info(
        {
          userId,
          anomalyCount: anomalies.length,
          riskLevel,
        },
        'Anomalies detected',
      );

      return {
        anomalies,
        riskLevel,
      };
    } catch (error) {
      this.log.error({ error, userId }, 'Error detecting anomalies');
      Sentry.captureException(error, {
        tags: {
          component: 'AuditLoggingSystem',
          action: 'detectAnomalies',
        },
        extra: { userId },
      });
      throw error;
    }
  }

  /**
   * Générer un rapport d'audit
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  async generateAuditReport(
    startDate: Date,
    endDate: Date,
    format: 'JSON' | 'PDF' | 'CSV' = 'JSON',
  ): Promise<{
    reportId: string;
    format: string;
    url?: string;
    summary: {
      totalLogs: number;
      criticalIssues: number;
      complianceScore: number;
      recommendations: string[];
    };
  }> {
    try {
      const reportId = `audit_report_${Date.now()}`;

      this.log.debug(
        { startDate, endDate, format },
        'Starting audit report generation',
      );

      // Récupérer tous les logs d'audit dans la période
      const query: AuditQuery = {
        dateFrom: startDate,
        dateTo: endDate,
        limit: 10000, // Limite élevée pour récupérer tous les logs
      };

      const logsResult = await this.searchAuditLogs(query);
      const allLogs = logsResult.logs;

      // Calculer les statistiques réelles
      const totalLogs = logsResult.total;
      const criticalLogs = allLogs.filter(
        log => log.severity === 'CRITICAL' || log.riskScore > 80,
      );
      const criticalIssues = criticalLogs.length;

      // Calculer le score de conformité basé sur les données réelles
      const failureLogs = allLogs.filter(log => log.outcome === 'FAILURE');
      const failureRate = totalLogs > 0 ? failureLogs.length / totalLogs : 0;
      const highRiskLogs = allLogs.filter(
        log => log.severity === 'HIGH' || log.severity === 'CRITICAL',
      );
      const highRiskRate = totalLogs > 0 ? highRiskLogs.length / totalLogs : 0;

      // Score de conformité : 100 - (taux d'échec * 30) - (taux de risque élevé * 50)
      // Minimum 0, maximum 100
      const complianceScore = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            100 - failureRate * 30 - highRiskRate * 50 - criticalIssues * 2,
          ),
        ),
      );

      // Détecter les anomalies pour générer des recommandations
      const anomalies = await this.detectAnomalies();

      // Générer des recommandations basées sur les anomalies et les statistiques
      const recommendations: string[] = [];

      if (criticalIssues > 0) {
        recommendations.push(
          `Address ${criticalIssues} critical security issue(s) immediately`,
        );
      }

      if (anomalies.anomalies.length > 0) {
        anomalies.anomalies.forEach(anomaly => {
          recommendations.push(...anomaly.recommendations);
        });
      }

      if (failureRate > 0.1) {
        recommendations.push(
          'High failure rate detected - review authentication and authorization processes',
        );
      }

      if (highRiskRate > 0.05) {
        recommendations.push(
          'Elevated risk activities detected - implement additional monitoring',
        );
      }

      // Recommandations par défaut si aucune anomalie spécifique
      if (recommendations.length === 0) {
        recommendations.push(
          'Implement additional monitoring for high-risk activities',
          'Review and update access control policies',
          'Conduct regular security training for staff',
        );
      }

      // Supprimer les doublons
      const uniqueRecommendations = Array.from(new Set(recommendations));

      const summary = {
        totalLogs,
        criticalIssues,
        complianceScore,
        recommendations: uniqueRecommendations,
      };

      // Déterminer l'extension de fichier selon le format
      let fileExtension: string;
      switch (format) {
        case 'JSON':
          fileExtension = 'json';
          break;
        case 'CSV':
          fileExtension = 'csv';
          break;
        case 'PDF':
          // Pour PDF, on retourne les données structurées en JSON
          // L'implémentation PDF complète nécessiterait une bibliothèque comme pdfkit
          fileExtension = 'json';
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // URL du rapport (peut être utilisé pour téléchargement via API)
      const reportUrl = `/api/audit/reports/${reportId}.${fileExtension}`;

      this.log.info(
        {
          reportId,
          format,
          totalLogs,
          criticalIssues,
          complianceScore,
        },
        'Audit report generated successfully',
      );

      // Enregistrer l'audit de génération de rapport
      await this.createAuditLog(
        'AUDIT_REPORT_GENERATED',
        'AUDIT_SYSTEM',
        {
          reportId,
          startDate,
          endDate,
          format,
          totalLogs,
          criticalIssues,
          complianceScore,
        },
        {
          category: 'SYSTEM',
          severity: 'LOW',
          outcome: 'SUCCESS',
        },
      );

      return {
        reportId,
        format,
        url: reportUrl,
        summary,
      };
    } catch (error) {
      this.log.error(
        { error, startDate, endDate, format },
        'Error generating audit report',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'AuditLoggingSystem',
          action: 'generateAuditReport',
        },
        extra: { startDate, endDate, format },
      });
      throw error;
    }
  }

  /**
   * Sauvegarder un log d'audit
   */
  @Log({ level: 'debug', logArgs: false, logExecutionTime: true })
  private async saveAuditLog(auditLog: AuditLog): Promise<void> {
    try {
      await this.auditLogRepository.create(auditLog);
      this.log.debug(
        { auditLogId: auditLog.id, action: auditLog.action },
        'Audit log saved to database',
      );
    } catch (error) {
      this.log.error(
        { error, auditLogId: auditLog.id },
        'Error saving audit log to database',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'AuditLoggingSystem',
          action: 'saveAuditLog',
        },
        extra: { auditLogId: auditLog.id },
      });
      throw error;
    }
  }

  /**
   * Grouper les logs par catégorie
   */
  private groupByCategory(logs: AuditLog[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    logs.forEach(log => {
      grouped[log.category] = (grouped[log.category] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Grouper les logs par sévérité
   */
  private groupBySeverity(logs: AuditLog[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    logs.forEach(log => {
      grouped[log.severity] = (grouped[log.severity] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Grouper les logs par résultat
   */
  private groupByOutcome(logs: AuditLog[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    logs.forEach(log => {
      grouped[log.outcome] = (grouped[log.outcome] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Obtenir les actions les plus fréquentes
   */
  private getTopActions(
    logs: AuditLog[],
    limit: number = 10,
  ): Array<{
    action: string;
    count: number;
  }> {
    const actionCounts: Record<string, number> = {};
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    return Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Obtenir les utilisateurs les plus actifs
   */
  private getTopUsers(
    logs: AuditLog[],
    limit: number = 10,
  ): Array<{
    userId: string;
    count: number;
  }> {
    const userCounts: Record<string, number> = {};
    logs.forEach(log => {
      if (log.userId) {
        userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
      }
    });

    return Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Générer un rapport CSV
   */
  private generateCSV(logs: AuditLog[], summary: any): string {
    const headers = [
      'ID',
      'Timestamp',
      'User ID',
      'Action',
      'Resource',
      'Category',
      'Severity',
      'Outcome',
      'Risk Score',
      'IP Address',
      'User Agent',
    ];

    const rows = logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.userId || '',
      log.action,
      log.resource,
      log.category,
      log.severity,
      log.outcome,
      log.riskScore.toString(),
      log.ipAddress,
      log.userAgent,
    ]);

    // Ajouter un résumé en fin de fichier
    const summaryData = [
      ['Total Logs', summary.totalLogs.toString()],
      ['Critical Issues', summary.criticalIssues.toString()],
      ['Compliance Score', summary.complianceScore.toString()],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      ),
      '',
      'SUMMARY',
      ...summaryData.map(([key, value]) => `"${key}","${value}"`),
    ].join('\n');

    return csvContent;
  }

  /**
   * Mettre en cache un log d'audit
   */
  @Log({ level: 'debug', logArgs: false, logExecutionTime: false })
  private async cacheAuditLog(auditLog: AuditLog): Promise<void> {
    try {
      const cacheKey = `audit:${auditLog.id}`;
      await redis.set(cacheKey, JSON.stringify(auditLog), 3600); // 1 heure
      this.log.debug(
        { auditLogId: auditLog.id, cacheKey },
        'Audit log cached successfully',
      );
    } catch (error) {
      this.log.warn(
        { error, auditLogId: auditLog.id },
        'Error caching audit log (non-critical)',
      );
      // Ne pas faire échouer l'opération principale
    }
  }

  /**
   * Calculer le score de risque
   */
  private calculateRiskScore(
    action: string,
    details: Record<string, any>,
  ): number {
    let score = 0;

    // Actions à haut risque
    if (action.includes('DELETE') || action.includes('ADMIN')) {
      score += 30;
    }

    if (action.includes('PAYMENT') || action.includes('FINANCIAL')) {
      score += 25;
    }

    if (action.includes('LOGIN') || action.includes('AUTH')) {
      score += 15;
    }

    // Détails suspects
    if (details['suspiciousActivity']) {
      score += 20;
    }

    if (details['multipleAttempts']) {
      score += 15;
    }

    if (details['unusualLocation']) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculer le niveau de risque
   */
  private calculateRiskLevel(
    anomalies: Array<{ severity: string }>,
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalCount = anomalies.filter(
      a => a.severity === 'CRITICAL',
    ).length;
    const highCount = anomalies.filter(a => a.severity === 'HIGH').length;

    if (criticalCount > 0) return 'CRITICAL';
    if (highCount > 2) return 'HIGH';
    if (highCount > 0 || anomalies.length > 3) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Détecter les connexions suspectes
   */
  private async detectSuspiciousLogins(userId?: string): Promise<any[]> {
    try {
      const query: AuditQuery = {
        action: 'LOGIN_FAILED',
        category: 'AUTHENTICATION',
        outcome: 'FAILURE',
        dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000), // Dernières 24h
        limit: 100,
      };

      if (userId) {
        query.userId = userId;
      }

      const result = await this.auditLogRepository.searchAuditLogs(query);
      this.log.debug(
        { userId, count: result.data.length },
        'Suspicious logins detected',
      );
      return result.data;
    } catch (error) {
      this.log.error({ error, userId }, 'Error detecting suspicious logins');
      Sentry.captureException(error, {
        tags: {
          component: 'AuditLoggingSystem',
          action: 'detectSuspiciousLogins',
        },
        extra: { userId },
      });
      return [];
    }
  }

  /**
   * Détecter les accès non autorisés
   */
  private async detectUnauthorizedAccess(userId?: string): Promise<any[]> {
    try {
      const query: AuditQuery = {
        category: 'AUTHORIZATION',
        outcome: 'FAILURE',
        severity: 'HIGH',
        dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Dernière semaine
        limit: 100,
      };

      if (userId) {
        query.userId = userId;
      }

      const result = await this.auditLogRepository.searchAuditLogs(query);
      this.log.debug(
        { userId, count: result.data.length },
        'Unauthorized access detected',
      );
      return result.data;
    } catch (error) {
      this.log.error({ error, userId }, 'Error detecting unauthorized access');
      Sentry.captureException(error, {
        tags: {
          component: 'AuditLoggingSystem',
          action: 'detectUnauthorizedAccess',
        },
        extra: { userId },
      });
      return [];
    }
  }

  /**
   * Détecter les modifications suspectes
   */
  private async detectSuspiciousModifications(userId?: string): Promise<any[]> {
    try {
      const query: AuditQuery = {
        category: 'DATA_MODIFICATION',
        severity: 'HIGH',
        dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000), // Dernières 24h
        limit: 100,
      };

      if (userId) {
        query.userId = userId;
      }

      const result = await this.auditLogRepository.searchAuditLogs(query);
      this.log.debug(
        { userId, count: result.data.length },
        'Suspicious modifications detected',
      );
      return result.data;
    } catch (error) {
      this.log.error(
        { error, userId },
        'Error detecting suspicious modifications',
      );
      Sentry.captureException(error, {
        tags: {
          component: 'AuditLoggingSystem',
          action: 'detectSuspiciousModifications',
        },
        extra: { userId },
      });
      return [];
    }
  }
}

// Instance singleton
export const auditLogging = AuditLoggingSystem.getInstance();
