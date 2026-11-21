/**
 * Endpoint de santé avancé - DiaspoMoney
 * Monitoring de santé Company-Grade
 *
 * Implémente les design patterns :
 * - Service Layer Pattern (via monitoringManager)
 * - Dependency Injection (via getRedisClient)
 * - Logger Pattern (structured logging avec childLogger)
 */

import { childLogger } from '@/lib/logger';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { getRedisClient } from '@/lib/redis/redis-client';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

// Interface pour le statut de santé
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
      host?: string;
      name?: string;
    };
    redis?: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
    };
    cdn?: {
      status: 'available' | 'unavailable' | 'error';
      responseTime?: number;
    };
  };
  metrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    activeAlerts: number;
  };
  alerts: Array<{
    id: string;
    severity: string;
    message: string;
    timestamp: string;
  }>;
}

/**
 * Fonction pour tester la connexion MongoDB
 * Utilise le Repository Pattern via mongoose
 */
async function testDatabaseConnection(): Promise<{
  status: 'connected' | 'disconnected' | 'error';
  responseTime?: number;
  host?: string;
  name?: string;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const dbState = mongoose.connection.readyState;

    if (dbState === 1) {
      // Test de ping
      await mongoose.connection.db?.admin()?.ping();

      return {
        status: 'connected',
        responseTime: Date.now() - startTime,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      };
    } else {
      return {
        status: 'disconnected',
        error: `Database state: ${dbState}`,
      };
    }
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fonction pour tester Redis
 * Utilise le Dependency Injection Pattern via getRedisClient()
 * et le Singleton Pattern (le client Redis est un singleton)
 */
async function testRedisConnection(): Promise<{
  status: 'connected' | 'disconnected' | 'error';
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    // Vérifier si Redis est configuré
    const redisHost = process.env['REDIS_HOST'];
    const redisPort = process.env['REDIS_PORT'];

    if (!redisHost || !redisPort) {
      return {
        status: 'disconnected',
        error: 'Redis not configured (missing REDIS_HOST or REDIS_PORT)',
      };
    }

    // Utiliser le client Redis via Dependency Injection (Singleton Pattern)
    const redisClient = getRedisClient();

    // Tester la connexion avec ping
    const isConnected = await redisClient.ping();

    if (isConnected) {
      return {
        status: 'connected',
        responseTime: Date.now() - startTime,
      };
    } else {
      return {
        status: 'disconnected',
        responseTime: Date.now() - startTime,
        error: 'Redis ping failed',
      };
    }
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fonction pour tester le CDN
 * Utilise le Service Layer Pattern (test externe)
 */
async function testCDNConnection(): Promise<{
  status: 'available' | 'unavailable' | 'error';
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    // Test de connectivité CDN
    const cdnUrl = process.env['CDN_BASE_URL'] || 'https://cdn.diaspomoney.fr';
    const response = await fetch(`${cdnUrl}/health`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // Timeout de 5 secondes
    });

    if (response.ok) {
      return {
        status: 'available',
        responseTime: Date.now() - startTime,
      };
    } else {
      return {
        status: 'unavailable',
        responseTime: Date.now() - startTime,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fonction pour calculer les métriques de performance
 * Utilise le Service Layer Pattern via monitoringManager
 */
function calculatePerformanceMetrics() {
  const metrics = monitoringManager.getMetrics();
  const stats = monitoringManager.getStats();

  // Calculer le taux d'erreur
  const errorMetrics = (metrics || []).filter((m: any) =>
    m.name.includes('http_errors'),
  );
  const totalErrors = errorMetrics.reduce(
    (sum: number, m: any) => sum + m.value,
    0,
  );

  const requestMetrics = (metrics || []).filter((m: any) =>
    m.name.includes('http_requests'),
  );
  const totalRequests = requestMetrics.reduce(
    (sum: number, m: any) => sum + m.value,
    0,
  );

  const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

  // Calculer le temps de réponse moyen
  const responseTimeMetrics = (metrics || []).filter((m: any) =>
    m.name.includes('http_request_duration'),
  );
  const averageResponseTime =
    responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum: number, m: any) => sum + m.value, 0) /
        responseTimeMetrics.length
      : 0;

  return {
    totalRequests,
    errorRate,
    averageResponseTime: averageResponseTime * 1000, // Convertir en ms
    activeAlerts: stats.activeAlerts,
  };
}

/**
 * Handler principal pour l'endpoint de santé
 * Implémente le Service Layer Pattern via monitoringManager
 * Utilise le Logger Pattern pour le logging structuré
 */
export async function GET(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({ requestId: reqId, route: 'api/health' });

  try {
    const startTime = Date.now();

    log.debug({ msg: 'Health check started' });

    // Tester les services en parallèle
    const [databaseStatus, redisStatus, cdnStatus] = await Promise.all([
      testDatabaseConnection(),
      testRedisConnection(),
      testCDNConnection(),
    ]);

    // Calculer les métriques
    const metrics = calculatePerformanceMetrics();

    // Obtenir les alertes actives
    const alerts = monitoringManager.getAlerts(undefined, false) || [];

    // Déterminer le statut global
    let globalStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (databaseStatus.status !== 'connected') {
      globalStatus = 'unhealthy';
      log.warn({
        msg: 'Database connection failed',
        status: databaseStatus.status,
        error: databaseStatus.error,
      });
    } else if (alerts.some((a: any) => a.severity === 'critical')) {
      globalStatus = 'unhealthy';
      log.warn({
        msg: 'Critical alerts detected',
        alertCount: alerts.filter((a: any) => a.severity === 'critical').length,
      });
    } else if (
      alerts.some((a: any) => a.severity === 'high') ||
      metrics.errorRate > 0.05
    ) {
      globalStatus = 'degraded';
      log.info({
        msg: 'System degraded',
        errorRate: metrics.errorRate,
        highAlerts: alerts.filter((a: any) => a.severity === 'high').length,
      });
    }

    // Construire la réponse
    const healthStatus: HealthStatus = {
      status: globalStatus,
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] || '1.0.0',
      uptime: process.uptime(),
      services: {
        database: databaseStatus,
        redis:
          redisStatus && redisStatus.status !== 'disconnected'
            ? redisStatus
            : { status: 'disconnected' },
        cdn:
          cdnStatus && cdnStatus.status !== 'unavailable'
            ? cdnStatus
            : { status: 'unavailable' },
      },
      metrics,
      alerts: (alerts || []).map((alert: any) => ({
        id: alert.id,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp.toISOString(),
      })),
    };

    // Déterminer le code de statut HTTP
    const httpStatus =
      globalStatus === 'healthy'
        ? 200
        : globalStatus === 'degraded'
        ? 200
        : 503;

    const responseTime = Date.now() - startTime;

    log.info({
      msg: 'Health check completed',
      status: globalStatus,
      responseTime,
      database: databaseStatus.status,
      redis: redisStatus.status,
      cdn: cdnStatus.status,
    });

    // Ajouter les headers de monitoring
    const response = new NextResponse(JSON.stringify(healthStatus, null, 2), {
      status: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        'X-Health-Check': 'true',
        'X-Response-Time': responseTime.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    return response;
  } catch (error) {
    log.error({
      error,
      msg: 'Health check failed',
    });

    return new NextResponse(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
