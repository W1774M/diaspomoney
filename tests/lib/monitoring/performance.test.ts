import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
}));

import { performanceMonitoring, getPerformanceReport, withPerformanceTracking } from '@/lib/monitoring/performance';

describe('performanceMonitoring', () => {
  beforeEach(() => {
    performanceMonitoring.cleanup();
  });

  it('retient les temps, alerte au-delà de 2 s et ne garde que 100 mesures', () => {
    performanceMonitoring.trackAPIPerformance('/api/sante', 120);
    performanceMonitoring.trackAPIPerformance('/api/sante', 2500);
    for (let i = 0; i < 100; i += 1) {
      performanceMonitoring.trackAPIPerformance('/api/sante', 10);
    }
    const times = performanceMonitoring.metrics.apiResponseTime.get('/api/sante');
    expect(times).toHaveLength(100);
    expect(times?.[0]).toBe(10);
  });

  it('compte les hits, les misses et les erreurs', () => {
    performanceMonitoring.trackCachePerformance('users', true);
    performanceMonitoring.trackCachePerformance('users', false);
    performanceMonitoring.trackError('/api/sante', 'db');

    const stats = performanceMonitoring.getStats();
    expect(stats['users_cache_hit_rate']).toBe(50);
    expect(stats['/api/sante_errors']).toBe(1);

    performanceMonitoring.metrics.cacheHitRate.set('vide', { hits: 0, misses: 0 });
    expect(performanceMonitoring.getStats()['vide_cache_hit_rate']).toBe(0);
  });

  it('enveloppe un appel réussi ou en échec', async () => {
    const ok = await withPerformanceTracking(async (n: number) => n + 1, '/api/ok')(1);
    expect(ok).toBe(2);

    await expect(
      withPerformanceTracking(async () => {
        throw new Error('panne');
      }, '/api/ko')(),
    ).rejects.toThrow('panne');

    await expect(
      withPerformanceTracking(async () => {
        throw 'texte';
      }, '/api/ko')(),
    ).rejects.toBe('texte');

    expect(getPerformanceReport()['/api/ok_response_time'].count).toBe(1);
    expect(performanceMonitoring.metrics.errorCount.get('/api/ko')).toBe(2);
  });
});
