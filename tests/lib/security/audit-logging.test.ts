// @vitest-environment node
import * as Sentry from '@sentry/nextjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Les décorateurs (cache, journal, performance) ont leurs propres tests : ici, ils laissent
// passer l'appel tel quel, pour tester la logique d'audit sans cache entre deux tests.
const h = vi.hoisted(() => {
  const passThrough = () => (_t: unknown, _k: string, d: PropertyDescriptor) => d;
  return {
    passThrough,
    repo: { create: vi.fn(), searchAuditLogs: vi.fn(), getAuditStats: vi.fn() },
    redisSet: vi.fn(),
    recordMetric: vi.fn(),
    cacheEnabled: vi.fn(() => true),
  };
});

vi.mock('@/lib/decorators/cache.decorator', () => ({ Cacheable: h.passThrough, InvalidateCache: h.passThrough }));
vi.mock('@/lib/decorators/log.decorator', () => ({ Log: h.passThrough }));
vi.mock('@/lib/decorators/performance.decorator', () => ({ Performance: h.passThrough }));
vi.mock('@/repositories', () => ({ getAuditLogRepository: () => h.repo }));
vi.mock('@/lib/redis/redis-client', () => ({ redis: { set: h.redisSet } }));
vi.mock('@/lib/cache/redis', () => ({ isCacheEnabled: () => h.cacheEnabled() }));
vi.mock('@/lib/monitoring/advanced-monitoring', () => ({ monitoringManager: { recordMetric: h.recordMetric } }));

import { AuditLoggingSystem, auditLogging, type AuditLog } from '@/lib/security/audit-logging';

const page = (data: Partial<AuditLog>[] = [], total = data.length, hasNext = false) => ({ data, total, pagination: { hasNext } });
const entry = (o: Partial<AuditLog>): Partial<AuditLog> => ({ severity: 'LOW', outcome: 'SUCCESS', riskScore: 0, ...o });

beforeEach(() => {
  vi.clearAllMocks();
  h.repo.create.mockResolvedValue(undefined);
  h.repo.searchAuditLogs.mockResolvedValue(page());
  h.redisSet.mockResolvedValue(true);
  h.cacheEnabled.mockReturnValue(true);
});

describe('AuditLoggingSystem.createAuditLog', () => {
  it('est un singleton', () => {
    expect(AuditLoggingSystem.getInstance()).toBe(auditLogging);
  });

  it('enregistre, met en cache et compte un log avec les valeurs par défaut', async () => {
    const log = await auditLogging.createAuditLog('PROFILE_VIEWED', 'USER');

    expect(log).toMatchObject({
      action: 'PROFILE_VIEWED', resource: 'USER', method: 'UNKNOWN', ipAddress: 'unknown', userAgent: 'unknown',
      details: {}, severity: 'LOW', category: 'SYSTEM', outcome: 'SUCCESS', riskScore: 0, complianceFlags: [], retentionPeriod: 2555,
    });
    expect(log.id).toMatch(/^audit_\d+_[a-z0-9]+$/);
    expect(log).not.toHaveProperty('userId');
    expect(log).not.toHaveProperty('_id');
    expect(h.repo.create).toHaveBeenCalledWith(log);
    expect(h.redisSet).toHaveBeenCalledWith(`audit:${log.id}`, JSON.stringify(log), 3600);
    expect(h.recordMetric).toHaveBeenCalledWith(expect.objectContaining({
      name: 'audit_logs_created', type: 'counter', labels: { action: 'PROFILE_VIEWED', resource: 'USER', severity: 'LOW', category: 'SYSTEM', outcome: 'SUCCESS' },
    }));
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('ne contacte pas Redis quand le cache est coupé', async () => {
    h.cacheEnabled.mockReturnValue(false);
    const log = await auditLogging.createAuditLog('PROFILE_VIEWED', 'USER');
    expect(h.repo.create).toHaveBeenCalledWith(log);
    expect(h.redisSet).not.toHaveBeenCalled();
  });

  it('reprend les options fournies', async () => {
    const log = await auditLogging.createAuditLog('USER_UPDATED', 'USER', { champ: 'email' }, {
      userId: 'u1', sessionId: 's1', resourceId: 'r1', method: 'PUT', ipAddress: '1.2.3.4', userAgent: 'vitest',
      severity: 'MEDIUM', category: 'DATA_MODIFICATION', outcome: 'WARNING', riskScore: 12, complianceFlags: ['RGPD'], retentionPeriod: 30,
    });
    expect(log).toMatchObject({
      userId: 'u1', sessionId: 's1', resourceId: 'r1', method: 'PUT', ipAddress: '1.2.3.4', userAgent: 'vitest',
      severity: 'MEDIUM', category: 'DATA_MODIFICATION', outcome: 'WARNING', riskScore: 12, complianceFlags: ['RGPD'], retentionPeriod: 30,
    });
  });

  it.each([
    ['ADMIN_DELETE_USER', {}, 30],
    ['PAYMENT_REFUND', {}, 25],
    ['LOGIN_FAILED', { multipleAttempts: true, unusualLocation: true }, 40],
    ['AUTH_ADMIN_PAYMENT', { suspiciousActivity: true, multipleAttempts: true, unusualLocation: true }, 100],
  ])('calcule le score de risque de %s', async (action, details, score) => {
    expect((await auditLogging.createAuditLog(action, 'X', details)).riskScore).toBe(score);
  });

  it('remonte à Sentry un événement critique ou à risque > 80', async () => {
    await auditLogging.createAuditLog('ADMIN_DELETE_PAYMENT', 'X', { suspiciousActivity: true, multipleAttempts: true }); // 90
    await auditLogging.createAuditLog('BACKUP', 'X', {}, { severity: 'CRITICAL' });
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2);
    expect(Sentry.captureMessage).toHaveBeenCalledWith('Critical Audit Event: ADMIN_DELETE_PAYMENT', expect.objectContaining({
      level: 'error', extra: expect.objectContaining({ riskScore: 90 }),
    }));
  });

  it('ignore une panne du cache, mais propage une panne de la base', async () => {
    h.redisSet.mockRejectedValueOnce(new Error('redis HS'));
    await expect(auditLogging.createAuditLog('A', 'B')).resolves.toMatchObject({ action: 'A' });

    h.repo.create.mockRejectedValueOnce(new Error('mongo HS'));
    await expect(auditLogging.createAuditLog('A', 'B')).rejects.toThrow('mongo HS');
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ tags: { component: 'AuditLoggingSystem', action: 'saveAuditLog' } }));
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ tags: { component: 'AuditLoggingSystem', action: 'createAuditLog' } }));
  });
});

describe('AuditLoggingSystem : recherche et statistiques', () => {
  it('pagine la recherche (page déduite de l’offset)', async () => {
    h.repo.searchAuditLogs.mockResolvedValueOnce(page([entry({ id: 'a' })], 120, true));
    expect(await auditLogging.searchAuditLogs({ userId: 'u1', limit: 20, offset: 40 })).toEqual({ logs: [entry({ id: 'a' })], total: 120, hasNext: true });
    expect(h.repo.searchAuditLogs).toHaveBeenCalledWith({ userId: 'u1', limit: 20, offset: 40 }, { limit: 20, offset: 40, page: 3, sort: { timestamp: -1 } });

    h.repo.searchAuditLogs.mockResolvedValueOnce({ data: [], total: 0 });
    expect(await auditLogging.searchAuditLogs({})).toEqual({ logs: [], total: 0, hasNext: false });
    expect(h.repo.searchAuditLogs).toHaveBeenLastCalledWith({}, { limit: 50, offset: 0, page: 1, sort: { timestamp: -1 } });
  });

  it('renvoie les statistiques du dépôt', async () => {
    const stats = {
      totalLogs: 3, logsByCategory: { SYSTEM: 3 }, logsBySeverity: { LOW: 3 }, logsByOutcome: { SUCCESS: 3 },
      averageRiskScore: 5, complianceIssues: 0, topActions: [{ action: 'A', count: 3 }], topUsers: [], extra: 'ignoré',
    };
    h.repo.getAuditStats.mockResolvedValueOnce(stats);
    const { extra: _ignore, ...attendu } = stats;
    expect(await auditLogging.getAuditStats('week')).toEqual(attendu);
    expect(h.repo.getAuditStats).toHaveBeenCalledWith('week');
  });

  it('propage les erreurs de recherche et de statistiques', async () => {
    h.repo.searchAuditLogs.mockRejectedValueOnce(new Error('requête'));
    await expect(auditLogging.searchAuditLogs({})).rejects.toThrow('requête');
    h.repo.getAuditStats.mockRejectedValueOnce(new Error('stats'));
    await expect(auditLogging.getAuditStats()).rejects.toThrow('stats');
    expect(h.repo.getAuditStats).toHaveBeenCalledWith('day');
    expect(Sentry.captureException).toHaveBeenCalledTimes(2);
  });
});

describe('AuditLoggingSystem.detectAnomalies', () => {
  /** Répond selon la catégorie recherchée. */
  const byCategory = (found: Record<string, number>) =>
    h.repo.searchAuditLogs.mockImplementation(async (q: { category?: string }) =>
      page(Array.from({ length: found[q.category ?? ''] ?? 0 }, (_, i) => entry({ id: String(i) }))));

  it('ne signale rien quand les journaux sont propres', async () => {
    expect(await auditLogging.detectAnomalies()).toEqual({ anomalies: [], riskLevel: 'LOW' });
  });

  it('classe le risque selon les anomalies trouvées', async () => {
    byCategory({ AUTHENTICATION: 2 });
    expect((await auditLogging.detectAnomalies('u1')).riskLevel).toBe('MEDIUM');
    for (const [q] of h.repo.searchAuditLogs.mock.calls) expect(q).toMatchObject({ userId: 'u1', limit: 100 });

    byCategory({ DATA_MODIFICATION: 1 });
    const modifs = await auditLogging.detectAnomalies();
    expect(modifs).toMatchObject({ riskLevel: 'LOW', anomalies: [{ type: 'SUSPICIOUS_MODIFICATIONS', severity: 'MEDIUM' }] });

    byCategory({ AUTHENTICATION: 1, AUTHORIZATION: 1, DATA_MODIFICATION: 1 });
    const tout = await auditLogging.detectAnomalies();
    expect(tout.riskLevel).toBe('CRITICAL');
    expect(tout.anomalies.map((a) => a.type)).toEqual(['SUSPICIOUS_LOGINS', 'UNAUTHORIZED_ACCESS', 'SUSPICIOUS_MODIFICATIONS']);
  });

  it('cherche sur 24 h (connexions, modifications) et 7 jours (accès refusés)', async () => {
    vi.useFakeTimers({ now: new Date('2026-11-23T12:00:00Z'), toFake: ['Date'] });
    await auditLogging.detectAnomalies();
    vi.useRealTimers();
    const [logins, access, modifs] = h.repo.searchAuditLogs.mock.calls.map(([q]) => q);
    expect(logins).toMatchObject({ action: 'LOGIN_FAILED', category: 'AUTHENTICATION', outcome: 'FAILURE', dateFrom: new Date('2026-11-22T12:00:00Z') });
    expect(access).toMatchObject({ category: 'AUTHORIZATION', outcome: 'FAILURE', severity: 'HIGH', dateFrom: new Date('2026-11-16T12:00:00Z') });
    expect(modifs).toMatchObject({ category: 'DATA_MODIFICATION', severity: 'HIGH', dateFrom: new Date('2026-11-22T12:00:00Z') });
    expect(logins).not.toHaveProperty('userId');
  });

  it('continue si une recherche échoue', async () => {
    h.repo.searchAuditLogs.mockRejectedValue(new Error('mongo HS'));
    expect(await auditLogging.detectAnomalies('u1')).toEqual({ anomalies: [], riskLevel: 'LOW' });
    expect(Sentry.captureException).toHaveBeenCalledTimes(3);
  });

  it('propage une erreur inattendue', async () => {
    const spy = vi.spyOn(auditLogging as any, 'calculateRiskLevel').mockImplementationOnce(() => {
      throw new Error('bug');
    });
    await expect(auditLogging.detectAnomalies()).rejects.toThrow('bug');
    spy.mockRestore();
  });
});

describe('AuditLoggingSystem.generateAuditReport', () => {
  const du = new Date('2026-11-01');
  const au = new Date('2026-11-30');

  it('produit un rapport sans problème avec les recommandations par défaut, et le journalise', async () => {
    h.repo.searchAuditLogs.mockResolvedValue(page([entry({}), entry({})]));
    // Seule la recherche principale renvoie des logs ; la détection d'anomalies n'en trouve pas.
    h.repo.searchAuditLogs.mockImplementation(async (q: { limit?: number }) => (q.limit === 10000 ? page([entry({}), entry({})]) : page()));

    const report = await auditLogging.generateAuditReport(du, au);
    expect(report.reportId).toMatch(/^audit_report_\d+$/);
    expect(report.format).toBe('JSON');
    expect(report.url).toBe(`/api/audit/reports/${report.reportId}.json`);
    expect(report.summary).toEqual({
      totalLogs: 2, criticalIssues: 0, complianceScore: 100,
      recommendations: [
        'Implement additional monitoring for high-risk activities',
        'Review and update access control policies',
        'Conduct regular security training for staff',
      ],
    });
    expect(h.repo.searchAuditLogs.mock.calls[0]![0]).toEqual({ dateFrom: du, dateTo: au, limit: 10000 });
    expect(h.repo.create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'AUDIT_REPORT_GENERATED', resource: 'AUDIT_SYSTEM', details: expect.objectContaining({ reportId: report.reportId, complianceScore: 100 }),
    }));
  });

  it('abaisse le score et recommande selon échecs, risques et anomalies', async () => {
    const logs = [
      entry({ severity: 'CRITICAL', outcome: 'FAILURE' }),
      entry({ riskScore: 90, outcome: 'FAILURE' }),
      entry({ severity: 'HIGH' }),
      ...Array.from({ length: 7 }, () => entry({})),
    ];
    h.repo.searchAuditLogs.mockImplementation(async (q: { limit?: number; category?: string }) =>
      q.limit === 10000 ? page(logs) : q.category === 'AUTHORIZATION' ? page([entry({})]) : page());

    const { summary, url } = await auditLogging.generateAuditReport(du, au, 'CSV');
    // 100 - 0,2×30 - 0,2×50 - 2×2 = 80
    expect(summary).toMatchObject({ totalLogs: 10, criticalIssues: 2, complianceScore: 80 });
    expect(summary.recommendations).toEqual([
      'Address 2 critical security issue(s) immediately',
      'Immediately review access logs',
      'Block suspicious IP addresses',
      'Notify security team',
      'High failure rate detected - review authentication and authorization processes',
      'Elevated risk activities detected - implement additional monitoring',
    ]);
    expect(url).toMatch(/\.csv$/);
  });

  it('borne le score à 0, sert le PDF en JSON et prend le total du dépôt', async () => {
    h.repo.searchAuditLogs.mockImplementation(async (q: { limit?: number }) =>
      q.limit === 10000 ? page(Array.from({ length: 60 }, () => entry({ severity: 'CRITICAL', outcome: 'FAILURE' })), 60) : page());
    const { summary, url } = await auditLogging.generateAuditReport(du, au, 'PDF');
    expect(summary.complianceScore).toBe(0);
    expect(url).toMatch(/\.json$/);

    // Total du dépôt (toutes pages), pas seulement les logs renvoyés.
    h.repo.searchAuditLogs.mockImplementation(async (q: { limit?: number }) => (q.limit === 10000 ? page([entry({})], 25000) : page()));
    expect((await auditLogging.generateAuditReport(du, au)).summary.totalLogs).toBe(25000);
  });

  it('refuse un format inconnu et propage l’erreur', async () => {
    await expect(auditLogging.generateAuditReport(du, au, 'XML' as 'JSON')).rejects.toThrow('Unsupported format: XML');
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ tags: { component: 'AuditLoggingSystem', action: 'generateAuditReport' } }));
  });
});
