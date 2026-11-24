/**
 * GET/POST /api/monitoring/metrics
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Metric = {
  name: string;
  value: number;
  labels?: Record<string, string>;
};
type Alert = { severity: string; resolved: boolean };

const { getMetrics, getAlerts, recordMetric } = vi.hoisted(() => ({
  getMetrics: vi.fn((): Metric[] => []),
  getAlerts: vi.fn((): Alert[] => []),
  recordMetric: vi.fn(),
}));

vi.mock('@/lib/monitoring/advanced-monitoring', () => ({
  monitoringManager: { getMetrics, getAlerts, recordMetric },
}));

import { GET, POST } from '@/app/api/monitoring/metrics/route';

describe('/api/monitoring/metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMetrics.mockReturnValue([
      {
        name: 'http_request_duration',
        value: 0.12,
        labels: { route: '/api/health' },
      },
      { name: 'http_errors', value: 1, labels: { code: '500' } },
      { name: 'transaction_created', value: 3, labels: {} },
      { name: 'revenue_eur', value: 100, labels: {} },
      { name: 'active_users', value: 5, labels: {} },
    ]);
    getAlerts.mockReturnValue([
      { severity: 'critical', resolved: false },
      { severity: 'high', resolved: true },
    ]);
  });

  describe('GET', () => {
    it('répond 401 si Authorization n’est pas Bearer', async () => {
      const res = await GET(
        new NextRequest('http://localhost/api/monitoring/metrics', {
          headers: { authorization: 'Basic x' },
        }),
      );
      expect(res.status).toBe(401);
    });

    it('sert le texte Prometheus', async () => {
      const res = await GET(
        new NextRequest('http://localhost/api/monitoring/metrics'),
      );
      const text = await res.text();
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toMatch(/text\/plain/);
      expect(text).toMatch(/diaspomoney_health_status 1/);
      expect(text).toMatch(/diaspomoney_active_alerts_total 1/);
      expect(text).toMatch(/diaspomoney_http_request_duration_seconds/);
    });
  });

  describe('POST', () => {
    it('répond 400 sans name/value valides', async () => {
      const res = await POST(
        new NextRequest('http://localhost/api/monitoring/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'x' }),
        }),
      );
      expect(res.status).toBe(400);
    });

    it('enregistre une métrique', async () => {
      const res = await POST(
        new NextRequest('http://localhost/api/monitoring/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'custom_metric',
            value: 42,
            labels: { env: 'test' },
            type: 'counter',
          }),
        }),
      );
      expect(res.status).toBe(200);
      expect(recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'custom_metric',
          value: 42,
          type: 'counter',
        }),
      );
    });
  });
});
