/**
 * Monitoring Avancé - DiaspoMoney
 * Architecture de monitoring Company-Grade
 * Basé sur la charte de développement
 */

import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

// Configuration du monitoring
export const MONITORING_CONFIG = {
  // Métriques business
  BUSINESS_METRICS: {
    transactionSuccessRate: 'transaction_success_rate',
    revenuePerMinute: 'revenue_per_minute',
    activeUsers: 'active_users',
    conversionRate: 'conversion_rate',
  },

  // Métriques techniques
  TECHNICAL_METRICS: {
    responseTime: 'http_request_duration_seconds',
    errorRate: 'http_requests_total',
    throughput: 'http_requests_per_second',
    databaseConnections: 'mongodb_connections_current',
    memoryUsage: 'nodejs_memory_usage_bytes',
    cpuUsage: 'nodejs_cpu_usage_percent',
  },

  // Seuils d'alerte
  ALERT_THRESHOLDS: {
    highErrorRate: 0.01, // 1%
    highLatency: 0.5, // 500ms
    lowTransactionSuccessRate: 0.95, // 95%
    highMemoryUsage: 0.8, // 80%
    highCpuUsage: 0.7, // 70%
  },
};

// Interface pour les métriques
export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

// Interface pour les alertes
export interface Alert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  resolved: boolean;
}

// Classe de gestion du monitoring
export class MonitoringManager {
  private static instance: MonitoringManager;
  private metrics: Map<string, Metric[]> = new Map();
  private alerts: Alert[] = [];

  static getInstance(): MonitoringManager {
    if (!MonitoringManager.instance) {
      MonitoringManager.instance = new MonitoringManager();
    }
    return MonitoringManager.instance;
  }

  // Enregistrer une métrique
  recordMetric(metric: Metric): void {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    const metricList = this.metrics.get(metric.name)!;
    metricList.push(metric);

    // Garder seulement les 1000 dernières métriques par nom
    if (metricList.length > 1000) {
      metricList.shift();
    }

    // Vérifier les seuils d'alerte
    this.checkAlertThresholds(metric);
  }

  // Vérifier les seuils d'alerte
  private checkAlertThresholds(metric: Metric): void {
    const thresholds = MONITORING_CONFIG.ALERT_THRESHOLDS;

    switch (metric.name) {
      case 'error_rate':
        if (metric.value > thresholds.highErrorRate) {
          this.createAlert({
            id: `high_error_rate_${Date.now()}`,
            severity: 'critical',
            message: `Taux d'erreur élevé: ${(metric.value * 100).toFixed(2)}%`,
            metric: metric.name,
            threshold: thresholds.highErrorRate,
            currentValue: metric.value,
            timestamp: new Date(),
            resolved: false,
          });
        }
        break;

      case 'response_time':
        if (metric.value > thresholds.highLatency) {
          this.createAlert({
            id: `high_latency_${Date.now()}`,
            severity: 'high',
            message: `Latence élevée: ${metric.value}ms`,
            metric: metric.name,
            threshold: thresholds.highLatency,
            currentValue: metric.value,
            timestamp: new Date(),
            resolved: false,
          });
        }
        break;

      case 'transaction_success_rate':
        if (metric.value < thresholds.lowTransactionSuccessRate) {
          this.createAlert({
            id: `low_success_rate_${Date.now()}`,
            severity: 'critical',
            message: `Taux de succès des transactions faible: ${(metric.value * 100).toFixed(2)}%`,
            metric: metric.name,
            threshold: thresholds.lowTransactionSuccessRate,
            currentValue: metric.value,
            timestamp: new Date(),
            resolved: false,
          });
        }
        break;
    }
  }

  // Créer une alerte
  createAlert(alert: Alert): void {
    this.alerts.push(alert);

    // Envoyer à Sentry
    Sentry.captureMessage(alert.message, {
      level: alert.severity === 'critical' ? 'error' : 'warning',
      tags: {
        alertId: alert.id,
        metric: alert.metric,
        severity: alert.severity,
      },
      extra: {
        threshold: alert.threshold,
        currentValue: alert.currentValue,
      },
    });

    // TODO: Envoyer notification (Slack, email, etc.)
    console.log(`🚨 ALERT: ${alert.message}`);
  }

  // Obtenir les métriques
  getMetrics(name?: string): Metric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }

    const allMetrics: Metric[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }

    return allMetrics;
  }

  // Obtenir les alertes
  getAlerts(severity?: string, resolved?: boolean): Alert[] {
    let filteredAlerts = this.alerts;

    if (severity) {
      filteredAlerts = filteredAlerts.filter(
        alert => alert.severity === severity
      );
    }

    if (resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter(
        alert => alert.resolved === resolved
      );
    }

    return filteredAlerts;
  }

  // Résoudre une alerte
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`✅ Alert resolved: ${alertId}`);
    }
  }

  // Obtenir les statistiques
  getStats(): {
    totalMetrics: number;
    totalAlerts: number;
    activeAlerts: number;
    criticalAlerts: number;
  } {
    const totalMetrics = Array.from(this.metrics.values()).reduce(
      (sum, metrics) => sum + metrics.length,
      0
    );

    const totalAlerts = this.alerts.length;
    const activeAlerts = this.alerts.filter(a => !a.resolved).length;
    const criticalAlerts = this.alerts.filter(
      a => !a.resolved && a.severity === 'critical'
    ).length;

    return {
      totalMetrics,
      totalAlerts,
      activeAlerts,
      criticalAlerts,
    };
  }
}

// Fonction pour enregistrer les métriques de performance
export function recordPerformanceMetric(
  name: string,
  value: number,
  labels: Record<string, string> = {}
): void {
  const monitoring = MonitoringManager.getInstance();

  monitoring.recordMetric({
    name,
    value,
    timestamp: new Date(),
    labels,
    type: 'gauge',
  });
}

// Fonction pour enregistrer les métriques business
export function recordBusinessMetric(
  name: string,
  value: number,
  labels: Record<string, string> = {}
): void {
  const monitoring = MonitoringManager.getInstance();

  monitoring.recordMetric({
    name,
    value,
    timestamp: new Date(),
    labels,
    type: 'counter',
  });
}

// Middleware de monitoring des requêtes
export function monitoringMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const method = request.method;
  const pathname = request.nextUrl.pathname;

  return (response: NextResponse) => {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Enregistrer les métriques de performance
    recordPerformanceMetric('http_request_duration_seconds', duration / 1000, {
      method,
      path: pathname,
      status: response.status.toString(),
    });

    recordPerformanceMetric('http_requests_total', 1, {
      method,
      path: pathname,
      status: response.status.toString(),
    });

    // Enregistrer les métriques d'erreur
    if (response.status >= 400) {
      recordPerformanceMetric('http_errors_total', 1, {
        method,
        path: pathname,
        status: response.status.toString(),
      });
    }

    // Ajouter les headers de monitoring
    response.headers.set('X-Response-Time', duration.toString());
    response.headers.set('X-Request-ID', crypto.randomUUID());

    return response;
  };
}

// Fonction pour surveiller les transactions
export function monitorTransaction(
  transactionId: string,
  amount: number,
  currency: string,
  status: 'initiated' | 'completed' | 'failed' | 'refunded'
): void {
  const monitoring = MonitoringManager.getInstance();

  // Enregistrer la métrique de transaction
  monitoring.recordMetric({
    name: 'transactions_total',
    value: 1,
    timestamp: new Date(),
    labels: {
      transaction_id: transactionId,
      currency,
      status,
    },
    type: 'counter',
  });

  // Enregistrer la métrique de revenus
  if (status === 'completed') {
    monitoring.recordMetric({
      name: 'revenue_total',
      value: amount,
      timestamp: new Date(),
      labels: {
        currency,
        transaction_id: transactionId,
      },
      type: 'counter',
    });
  }

  // Calculer le taux de succès
  const recentTransactions = (monitoring
    .getMetrics('transactions_total') || [])
    .filter(m => Date.now() - m.timestamp.getTime() < 5 * 60 * 1000); // 5 minutes

  const completedTransactions = recentTransactions.filter(
    m => m.labels?.['status'] === 'completed'
  ).length;
  const totalTransactions = recentTransactions.length;

  if (totalTransactions > 0) {
    const successRate = completedTransactions / totalTransactions;

    monitoring.recordMetric({
      name: 'transaction_success_rate',
      value: successRate,
      timestamp: new Date(),
      type: 'gauge',
    });
  }
}

// Fonction pour surveiller les utilisateurs actifs
export function monitorActiveUsers(userId: string, action: string): void {
  const monitoring = MonitoringManager.getInstance();

  monitoring.recordMetric({
    name: 'active_users_total',
    value: 1,
    timestamp: new Date(),
    labels: {
      user_id: userId,
      action,
    },
    type: 'counter',
  });
}

// Export de l'instance singleton
export const monitoringManager = MonitoringManager.getInstance();
