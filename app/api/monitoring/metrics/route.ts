/**
 * Endpoint de métriques pour Prometheus/Grafana
 * DiaspoMoney - Monitoring Company-Grade
 */

import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { NextRequest, NextResponse } from 'next/server';

// Fonction pour formater les métriques au format Prometheus
function formatPrometheusMetrics(): string {
  const metrics = monitoringManager.getMetrics();
  // const stats = monitoringManager.getStats();

  let prometheusOutput = '';

  // Métriques système
  prometheusOutput += `# HELP diaspomoney_http_requests_total Total HTTP requests\n`;
  prometheusOutput += `# TYPE diaspomoney_http_requests_total counter\n`;

  // Métriques de performance
  const performanceMetrics = metrics.filter(m =>
    m.name.includes('http_request_duration'),
  );
  for (const metric of performanceMetrics) {
    const labels = metric.labels
      ? Object.entries(metric.labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',')
      : '';

    prometheusOutput += `diaspomoney_http_request_duration_seconds{${labels}} ${metric.value}\n`;
  }

  // Métriques d'erreur
  const errorMetrics = metrics.filter(m => m.name.includes('http_errors'));
  for (const metric of errorMetrics) {
    const labels = metric.labels
      ? Object.entries(metric.labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',')
      : '';

    prometheusOutput += `diaspomoney_http_errors_total{${labels}} ${metric.value}\n`;
  }

  // Métriques business
  const businessMetrics = metrics.filter(m => m.name.includes('transaction'));
  for (const metric of businessMetrics) {
    const labels = metric.labels
      ? Object.entries(metric.labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',')
      : '';

    prometheusOutput += `diaspomoney_${metric.name}{${labels}} ${metric.value}\n`;
  }

  // Métriques de revenus
  const revenueMetrics = metrics.filter(m => m.name.includes('revenue'));
  for (const metric of revenueMetrics) {
    const labels = metric.labels
      ? Object.entries(metric.labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',')
      : '';

    prometheusOutput += `diaspomoney_${metric.name}{${labels}} ${metric.value}\n`;
  }

  // Métriques d'utilisateurs actifs
  const userMetrics = metrics.filter(m => m.name.includes('active_users'));
  for (const metric of userMetrics) {
    const labels = metric.labels
      ? Object.entries(metric.labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',')
      : '';

    prometheusOutput += `diaspomoney_${metric.name}{${labels}} ${metric.value}\n`;
  }

  // Métriques de santé
  prometheusOutput += `# HELP diaspomoney_health_status Application health status\n`;
  prometheusOutput += `# TYPE diaspomoney_health_status gauge\n`;
  prometheusOutput += `diaspomoney_health_status 1\n`;

  // Métriques d'alertes
  const alerts = monitoringManager.getAlerts();
  const activeAlerts = alerts.filter(a => !a.resolved);

  prometheusOutput += `# HELP diaspomoney_active_alerts_total Total active alerts\n`;
  prometheusOutput += `# TYPE diaspomoney_active_alerts_total gauge\n`;
  prometheusOutput += `diaspomoney_active_alerts_total ${activeAlerts.length}\n`;

  // Métriques par sévérité
  const criticalAlerts = activeAlerts.filter(
    a => a.severity === 'critical',
  ).length;
  const highAlerts = activeAlerts.filter(a => a.severity === 'high').length;
  const mediumAlerts = activeAlerts.filter(a => a.severity === 'medium').length;
  const lowAlerts = activeAlerts.filter(a => a.severity === 'low').length;

  prometheusOutput += `diaspomoney_critical_alerts_total ${criticalAlerts}\n`;
  prometheusOutput += `diaspomoney_high_alerts_total ${highAlerts}\n`;
  prometheusOutput += `diaspomoney_medium_alerts_total ${mediumAlerts}\n`;
  prometheusOutput += `diaspomoney_low_alerts_total ${lowAlerts}\n`;

  return prometheusOutput;
}

// Handler GET pour les métriques
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification (optionnel)
    const authHeader = request.headers.get('authorization');
    if (authHeader && !authHeader.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Générer les métriques Prometheus
    const metrics = formatPrometheusMetrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Erreur génération métriques:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Handler POST pour enregistrer des métriques personnalisées
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, value, labels = {}, type = 'gauge' } = body;

    if (!name || typeof value !== 'number') {
      return new NextResponse('Invalid metric data', { status: 400 });
    }

    // Enregistrer la métrique
    monitoringManager.recordMetric({
      name,
      value,
      timestamp: new Date(),
      labels,
      type: type as any,
    });

    return new NextResponse('Metric recorded', { status: 200 });
  } catch (error) {
    console.error('Erreur enregistrement métrique:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
