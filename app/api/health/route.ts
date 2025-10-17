/**
 * Endpoint de santé avancé - DiaspoMoney
 * Monitoring de santé Company-Grade
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';

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

// Fonction pour tester la connexion MongoDB
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
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'connected',
        responseTime: Date.now() - startTime,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      };
    } else {
      return {
        status: 'disconnected',
        error: `Database state: ${dbState}`
      };
    }
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Fonction pour tester Redis (si configuré)
async function testRedisConnection(): Promise<{
  status: 'connected' | 'disconnected' | 'error';
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // TODO: Implémenter le test Redis
    // const redis = require('ioredis');
    // const client = new redis(process.env.REDIS_URL);
    // await client.ping();
    // client.disconnect();
    
    return {
      status: 'disconnected',
      error: 'Redis not configured'
    };
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Fonction pour tester le CDN
async function testCDNConnection(): Promise<{
  status: 'available' | 'unavailable' | 'error';
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Test de connectivité CDN
    const cdnUrl = process.env.CDN_BASE_URL || 'https://cdn.diaspomoney.fr';
    const response = await fetch(`${cdnUrl}/health`, {
      method: 'HEAD',
      timeout: 5000
    });
    
    if (response.ok) {
      return {
        status: 'available',
        responseTime: Date.now() - startTime
      };
    } else {
      return {
        status: 'unavailable',
        responseTime: Date.now() - startTime,
        error: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Fonction pour calculer les métriques de performance
function calculatePerformanceMetrics() {
  const metrics = monitoringManager.getMetrics();
  const stats = monitoringManager.getStats();
  
  // Calculer le taux d'erreur
  const errorMetrics = metrics.filter(m => m.name.includes('http_errors'));
  const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
  
  const requestMetrics = metrics.filter(m => m.name.includes('http_requests'));
  const totalRequests = requestMetrics.reduce((sum, m) => sum + m.value, 0);
  
  const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
  
  // Calculer le temps de réponse moyen
  const responseTimeMetrics = metrics.filter(m => m.name.includes('http_request_duration'));
  const averageResponseTime = responseTimeMetrics.length > 0 
    ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
    : 0;
  
  return {
    totalRequests,
    errorRate,
    averageResponseTime: averageResponseTime * 1000, // Convertir en ms
    activeAlerts: stats.activeAlerts
  };
}

// Handler principal
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Tester les services
    const [databaseStatus, redisStatus, cdnStatus] = await Promise.all([
      testDatabaseConnection(),
      testRedisConnection(),
      testCDNConnection()
    ]);
    
    // Calculer les métriques
    const metrics = calculatePerformanceMetrics();
    
    // Obtenir les alertes actives
    const alerts = monitoringManager.getAlerts(undefined, false);
    
    // Déterminer le statut global
    let globalStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (databaseStatus.status !== 'connected') {
      globalStatus = 'unhealthy';
    } else if (alerts.some(a => a.severity === 'critical')) {
      globalStatus = 'unhealthy';
    } else if (alerts.some(a => a.severity === 'high') || metrics.errorRate > 0.05) {
      globalStatus = 'degraded';
    }
    
    // Construire la réponse
    const healthStatus: HealthStatus = {
      status: globalStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services: {
        database: databaseStatus,
        redis: redisStatus.status !== 'disconnected' ? redisStatus : undefined,
        cdn: cdnStatus.status !== 'unavailable' ? cdnStatus : undefined
      },
      metrics,
      alerts: alerts.map(alert => ({
        id: alert.id,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp.toISOString()
      }))
    };
    
    // Déterminer le code de statut HTTP
    const httpStatus = globalStatus === 'healthy' ? 200 : 
                      globalStatus === 'degraded' ? 200 : 503;
    
    // Ajouter les headers de monitoring
    const response = new NextResponse(JSON.stringify(healthStatus, null, 2), {
      status: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        'X-Health-Check': 'true',
        'X-Response-Time': (Date.now() - startTime).toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    return response;
    
  } catch (error) {
    console.error('Erreur health check:', error);
    
    return new NextResponse(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
