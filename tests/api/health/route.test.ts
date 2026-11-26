/**
 * GET /api/health
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  pingDb: vi.fn(),
  pingRedis: vi.fn(),
  getMetrics: vi.fn(() => []),
  getStats: vi.fn(() => ({ activeAlerts: 0 })),
  getAlerts: vi.fn(
    (): Array<{
      id: string;
      severity: string;
      message: string;
      timestamp: Date;
    }> => [],
  ),
  fetch: vi.fn(),
  connection: {
    readyState: 1,
    host: 'localhost',
    name: 'test',
    db: { admin: () => ({ ping: vi.fn() }) },
  },
}));

vi.mock('mongoose', () => ({
  default: { connection: h.connection },
}));
vi.mock('@/lib/redis/redis-client', () => ({
  getRedisClient: () => ({ ping: h.pingRedis }),
}));
vi.mock('@/lib/monitoring/advanced-monitoring', () => ({
  monitoringManager: {
    getMetrics: h.getMetrics,
    getStats: h.getStats,
    getAlerts: h.getAlerts,
  },
}));

import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.connection.readyState = 1;
    h.connection.db = { admin: () => ({ ping: h.pingDb }) };
    h.pingDb.mockResolvedValue({});
    h.pingRedis.mockResolvedValue(true);
    h.getMetrics.mockReturnValue([]);
    h.getStats.mockReturnValue({ activeAlerts: 0 });
    h.getAlerts.mockReturnValue([]);
    vi.stubGlobal(
      'fetch',
      h.fetch.mockResolvedValue({ ok: true } as Response),
    );
    vi.stubEnv('REDIS_HOST', '127.0.0.1');
    vi.stubEnv('REDIS_PORT', '6379');
    vi.stubEnv('CDN_BASE_URL', 'https://cdn.test');
  });

  it('répond healthy quand DB, Redis et CDN sont OK', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/health', {
        headers: { 'x-request-id': 'req-1' },
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.services.database.status).toBe('connected');
    expect(body.services.redis.status).toBe('connected');
    expect(body.services.cdn.status).toBe('available');
    expect(res.headers.get('X-Health-Check')).toBe('true');
  });

  it('répond unhealthy (503) si la base est déconnectée', async () => {
    h.connection.readyState = 0;
    const res = await GET(new NextRequest('http://localhost/api/health'));
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.status).toBe('unhealthy');
  });

  it('répond degraded si alertes high', async () => {
    h.getAlerts.mockReturnValue([
      {
        id: 'a1',
        severity: 'high',
        message: 'latency',
        timestamp: new Date(),
      },
    ]);
    const res = await GET(new NextRequest('http://localhost/api/health'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe('degraded');
  });
});
