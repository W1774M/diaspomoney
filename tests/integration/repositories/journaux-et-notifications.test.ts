/**
 * Méthodes métier des repositories de journaux et de notifications, sur la base de test :
 * recherches filtrées, pagination, statistiques et purge. (Le CRUD commun est couvert par
 * crud.test.ts.)
 */
import { ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';

import { mongoClient } from '@/lib/mongodb';
import { MongoAuditLogRepository } from '@/repositories/implementations/MongoAuditLogRepository';
import { MongoNotificationRepository } from '@/repositories/implementations/MongoNotificationRepository';
import { MongoPCIAuditLogRepository } from '@/repositories/implementations/MongoPCIAuditLogRepository';

const DAY = 24 * 60 * 60 * 1000;
const ago = (ms: number) => new Date(Date.now() - ms);
const collection = async (name: string) => (await mongoClient).db().collection(name);

describe('MongoAuditLogRepository', () => {
  const repo = new MongoAuditLogRepository();
  const seed = async () => {
    const base = { resource: 'AUTH_SYSTEM', retentionPeriod: 2555 };
    await repo.create({ ...base, userId: 'u1', action: 'LOGIN_SUCCESS', category: 'AUTHENTICATION', severity: 'LOW', outcome: 'SUCCESS', riskScore: 10, timestamp: ago(60_000) });
    await repo.create({ ...base, userId: 'u1', action: 'LOGIN_FAILED', category: 'AUTHENTICATION', severity: 'MEDIUM', outcome: 'FAILURE', riskScore: 40, complianceFlags: ['GDPR'], timestamp: ago(120_000) });
    await repo.create({ ...base, userId: 'u2', action: 'LOGIN_FAILED', category: 'AUTHENTICATION', severity: 'HIGH', outcome: 'FAILURE', riskScore: 70, timestamp: ago(180_000) });
    await repo.create({ ...base, userId: 'u2', action: 'PAYMENT', category: 'PAYMENT' as never, severity: 'LOW', outcome: 'SUCCESS', timestamp: ago(10 * DAY) });
  };

  it('crée avec un identifiant stable et des valeurs par défaut à la lecture', async () => {
    const id = new ObjectId().toString();
    const log = await repo.create({ id, action: 'X' });
    expect(log).toMatchObject({ id, _id: id, action: 'X', severity: 'LOW', category: 'SYSTEM', outcome: 'SUCCESS', riskScore: 0, complianceFlags: [], retentionPeriod: 2555, details: {} });
    expect(log.timestamp).toBeInstanceOf(Date);
    // Identifiant non ObjectId : un nouvel ObjectId est attribué (l'id renvoyé est toujours _id)
    const other = await repo.create({ id: 'pas-un-objectid', action: 'Y' });
    expect(ObjectId.isValid(other.id)).toBe(true);
    expect(await repo.findById(other.id)).toMatchObject({ action: 'Y' });
  });

  it('recherche par critères, avec pagination et tri du plus récent au plus ancien', async () => {
    await seed();
    const failed = await repo.searchAuditLogs({ action: 'LOGIN_FAILED' } as never);
    expect(failed.total).toBe(2);
    expect(failed.data.map((l) => l.userId)).toEqual(['u1', 'u2']);

    expect((await repo.searchAuditLogs({ userId: 'u2', severity: 'HIGH', outcome: 'FAILURE', category: 'AUTHENTICATION', resource: 'AUTH_SYSTEM' } as never)).total).toBe(1);
    expect((await repo.searchAuditLogs({ dateFrom: ago(DAY), dateTo: new Date() } as never)).total).toBe(3);
    expect((await repo.searchAuditLogs({ dateTo: ago(DAY) } as never)).total).toBe(1);

    const page2 = await repo.searchAuditLogs({} as never, { limit: 2, offset: 2, page: 2 });
    expect(page2.data).toHaveLength(2);
    expect(page2.pagination).toMatchObject({ page: 2, limit: 2, pages: 2, total: 4, hasNext: false, hasPrev: true });
  });

  it('filtre par utilisateur, action, catégorie et sévérité', async () => {
    await seed();
    expect((await repo.findByUserId('u1')).total).toBe(2);
    expect((await repo.findByAction('PAYMENT')).total).toBe(1);
    expect((await repo.findByCategory('AUTHENTICATION')).total).toBe(3);
    expect((await repo.findBySeverity('LOW', { limit: 1, page: 1 })).pagination).toMatchObject({ total: 2, hasNext: true });
    expect((await repo.findWithPagination({}, { sort: { timestamp: 1 }, limit: 1, page: 1 })).data[0]!.action).toBe('PAYMENT');
  });

  it('calcule les statistiques de la période', async () => {
    await seed();
    const day = await repo.getAuditStats('day');
    expect(day).toMatchObject({
      totalLogs: 3,
      logsByCategory: { AUTHENTICATION: 3 },
      logsBySeverity: { LOW: 1, MEDIUM: 1, HIGH: 1 },
      logsByOutcome: { SUCCESS: 1, FAILURE: 2 },
      averageRiskScore: 40,
      complianceIssues: 1,
    });
    expect(day.topActions[0]).toEqual({ action: 'LOGIN_FAILED', count: 2 });
    expect(day.topUsers).toEqual(expect.arrayContaining([{ userId: 'u1', count: 2 }, { userId: 'u2', count: 1 }]));
    expect((await repo.getAuditStats('week')).totalLogs).toBe(3);
    expect((await repo.getAuditStats('month')).totalLogs).toBe(4);
    expect((await repo.getAuditStats('autre' as never)).totalLogs).toBe(3);
  });

  it('ne purge que les journaux dont la durée de conservation est dépassée', async () => {
    await repo.create({ action: 'VIEUX', timestamp: ago(40 * DAY), retentionPeriod: 30 });
    await repo.create({ action: 'RECENT', timestamp: ago(10 * DAY), retentionPeriod: 30 });
    expect(await repo.deleteExpiredLogs()).toBe(1);
    expect((await repo.findAll()).map((l) => l.action)).toEqual(['RECENT']);
  });

  it('signale un identifiant introuvable ou invalide', async () => {
    const missing = new ObjectId().toString();
    expect(await repo.update(missing, { action: 'Z' })).toBeNull();
    expect(await repo.delete(missing)).toBe(false);
    await expect(repo.findById('invalide')).rejects.toThrow();
    await expect(repo.exists('invalide')).rejects.toThrow();
  });
});

describe('MongoNotificationRepository', () => {
  const repo = new MongoNotificationRepository();
  const notif = (extra: Record<string, unknown>) => ({
    recipient: 'awa@test.fr',
    type: 'WELCOME_EMAIL',
    subject: 's',
    content: 'c',
    status: 'PENDING',
    channels: [{ type: 'EMAIL', enabled: true }],
    ...extra,
  }) as never;

  it('crée, lit et met à jour le statut avec ses dates', async () => {
    const created = await repo.create(notif({ userId: 'u1' }));
    expect(created).toMatchObject({ recipient: 'awa@test.fr', userId: 'u1', status: 'PENDING', read: false, metadata: {} });
    const sentAt = new Date();
    const failedAt = new Date();
    const updated = await repo.updateStatus(created.id, 'FAILED' as never, { sentAt, deliveredAt: sentAt, failedAt, failureReason: 'boom' });
    expect(updated).toMatchObject({ status: 'FAILED', failureReason: 'boom' });
    expect(updated?.sentAt).toEqual(sentAt);
    expect(await repo.updateStatus(new ObjectId().toString(), 'SENT' as never)).toBeNull();
    expect(await repo.delete(new ObjectId().toString())).toBe(false);
  });

  it('garde un identifiant fourni, même non ObjectId', async () => {
    expect((await repo.create(notif({ id: 'notif_123' }))).id).toBeDefined();
    const oid = new ObjectId().toString();
    expect((await repo.create(notif({ id: oid }))).id).toBe(oid);
  });

  it('filtre par destinataire, statut et type', async () => {
    await repo.create(notif({}));
    await repo.create(notif({ status: 'SENT' }));
    await repo.create(notif({ recipient: 'moussa@test.fr', type: 'PAYMENT_SUCCESS' }));
    expect((await repo.findByRecipient('awa@test.fr')).total).toBe(2);
    expect((await repo.findByStatus('SENT' as never)).total).toBe(1);
    expect((await repo.findByType('PAYMENT_SUCCESS')).total).toBe(1);
    expect((await repo.findPending()).total).toBe(2);
    expect((await repo.findWithPagination({ channelType: 'EMAIL' } as never)).total).toBe(3);
  });

  it('filtre par période de création', async () => {
    await repo.create(notif({}));
    const notifs = await collection('notifications');
    await notifs.insertOne({ recipient: 'awa@test.fr', type: 'OLD', status: 'SENT', channels: [], createdAt: ago(10 * DAY), updatedAt: ago(10 * DAY) });
    expect((await repo.findWithPagination({ dateFrom: ago(DAY) } as never)).total).toBe(1);
    expect((await repo.findWithPagination({ dateTo: ago(DAY) } as never)).total).toBe(1);
    expect((await repo.findWithPagination({ dateFrom: ago(20 * DAY), dateTo: new Date() } as never)).total).toBe(2);
  });

  it('pagine en respectant la taille de page demandée', async () => {
    for (let i = 0; i < 5; i++) await repo.create(notif({ subject: `n${i}` }));
    const byOffset = await repo.findWithPagination({}, { limit: 2, offset: 2, page: 2, sort: { createdAt: 1 } });
    expect(byOffset.data.map((n) => n.subject)).toEqual(['n2', 'n3']);
    expect(byOffset.pagination).toMatchObject({ limit: 2, pages: 3, hasNext: true, hasPrev: true });

    const byPage = await repo.findWithPagination({}, { limit: 2, page: 2, sort: { createdAt: 1 } });
    expect(byPage.data.map((n) => n.subject)).toEqual(['n2', 'n3']);
    expect(byPage.pagination).toMatchObject({ page: 2, limit: 2 });
  });

  it('applique tous les filtres de findNotificationsWithFilters', async () => {
    await repo.create(notif({ channels: [{ type: 'SMS', enabled: true }] }));
    await repo.create(notif({}));
    const notifs = await collection('notifications');
    await notifs.insertOne({ recipient: 'awa@test.fr', type: 'WELCOME_EMAIL', status: 'PENDING', channels: [{ type: 'SMS' }], createdAt: ago(10 * DAY), updatedAt: ago(10 * DAY) });

    expect((await repo.findNotificationsWithFilters({ recipient: 'awa@test.fr', type: 'WELCOME_EMAIL', status: 'PENDING' } as never)).total).toBe(3);
    expect((await repo.findNotificationsWithFilters({ channelType: 'SMS' } as never)).total).toBe(2);
    expect((await repo.findNotificationsWithFilters({ channelType: 'SMS', dateFrom: ago(DAY) } as never)).total).toBe(1);
    expect((await repo.findNotificationsWithFilters({ dateTo: ago(DAY) } as never)).total).toBe(1);
  });

  it('calcule les statistiques d’envoi par canal', async () => {
    const t0 = new Date(Date.now() - 10_000);
    await repo.create(notif({ status: 'DELIVERED', sentAt: t0, deliveredAt: new Date(t0.getTime() + 4000), channels: [{ type: 'EMAIL' }, { type: 'PUSH' }] }));
    await repo.create(notif({ status: 'SENT', channels: [{ type: 'EMAIL' }] }));
    await repo.create(notif({ status: 'FAILED', channels: [{ type: 'SMS' }] }));
    await repo.create(notif({ status: 'PENDING', channels: [{}] }));

    const stats = await repo.getStats();
    expect(stats).toMatchObject({
      totalSent: 3,
      averageDeliveryTime: 4,
      channelBreakdown: {
        EMAIL: { sent: 2, delivered: 1, failed: 0 },
        PUSH: { sent: 1, delivered: 1, failed: 0 },
        SMS: { sent: 0, delivered: 0, failed: 1 },
        UNKNOWN: { sent: 0, delivered: 0, failed: 0 },
      },
    });
    expect(stats.deliveryRate).toBeCloseTo(33.33, 1);
    expect(stats.failureRate).toBeCloseTo(33.33, 1);
    for (const p of ['week', 'month', 'autre'] as const) expect((await repo.getStats(p as never)).totalSent).toBe(3);
  });

  it('renvoie des statistiques nulles sans notification', async () => {
    expect(await repo.getStats('day')).toEqual({ totalSent: 0, deliveryRate: 0, failureRate: 0, averageDeliveryTime: 0, channelBreakdown: {} });
  });
});

describe('MongoPCIAuditLogRepository', () => {
  const repo = new MongoPCIAuditLogRepository();
  const seed = async () => {
    await repo.create({ event: 'CARD_TOKENIZED', userId: 'u1', transactionId: 't1', severity: 'LOW', complianceStatus: 'COMPLIANT', timestamp: ago(60_000) });
    await repo.create({ event: 'CARD_TOKENIZED', userId: 'u2', severity: 'CRITICAL', complianceStatus: 'NON_COMPLIANT', timestamp: ago(120_000) });
    await repo.create({ event: 'REFUND', userId: 'u1', timestamp: ago(180_000) });
    await repo.create({ event: 'OLD', timestamp: ago(10 * DAY), complianceStatus: 'COMPLIANT' });
  };

  it('crée avec des valeurs par défaut et retrouve par id ou _id', async () => {
    const log = await repo.create({ event: 'X' });
    expect(log).toMatchObject({ event: 'X', ipAddress: 'unknown', userAgent: 'unknown', severity: 'LOW', complianceStatus: 'REVIEW_REQUIRED', details: {} });
    expect(log.userId).toBeUndefined();
    expect(await repo.findById(log.id)).toMatchObject({ id: log.id, event: 'X' });

    const id = new ObjectId().toString();
    expect((await repo.create({ id, event: 'Y' })).id).toBe(id);
    expect(await repo.update(id, { id: 'ignoré', complianceStatus: 'COMPLIANT' } as never)).toMatchObject({ id, complianceStatus: 'COMPLIANT' });
    expect(await repo.findById(new ObjectId().toString())).toBeNull();
  });

  it('recherche par critères et par période', async () => {
    await seed();
    expect((await repo.searchPCIAuditLogs({ event: 'CARD_TOKENIZED' } as never)).total).toBe(2);
    expect((await repo.searchPCIAuditLogs({ userId: 'u1', transactionId: 't1', severity: 'LOW', complianceStatus: 'COMPLIANT' } as never)).total).toBe(1);
    expect((await repo.searchPCIAuditLogs({ dateFrom: ago(DAY), dateTo: new Date() } as never)).total).toBe(3);
    expect((await repo.searchPCIAuditLogs({ dateTo: ago(DAY) } as never)).total).toBe(1);

    const page = await repo.searchPCIAuditLogs({ limit: 2, offset: 2 } as never);
    expect(page.data.map((l) => l.event)).toEqual(['REFUND', 'OLD']);
    expect(page.pagination).toMatchObject({ page: 2, pages: 2, hasNext: false, hasPrev: true });
    expect((await repo.findWithPagination()).total).toBe(4);
  });

  it('calcule les statistiques de conformité', async () => {
    await seed();
    expect(await repo.getPCIStats('day')).toEqual({
      totalLogs: 3,
      logsByEvent: { CARD_TOKENIZED: 2, REFUND: 1 },
      logsBySeverity: { LOW: 2, CRITICAL: 1 },
      logsByComplianceStatus: { COMPLIANT: 1, NON_COMPLIANT: 1, REVIEW_REQUIRED: 1 },
      averageComplianceScore: 50,
      criticalIssues: 1,
    });
    expect((await repo.getPCIStats('week')).totalLogs).toBe(3);
    expect((await repo.getPCIStats('month')).totalLogs).toBe(4);
    expect((await repo.getPCIStats('autre' as never)).totalLogs).toBe(3);
    await (await collection('pci_audit_logs')).deleteMany({});
    expect((await repo.getPCIStats('day')).averageComplianceScore).toBe(0);
  });

  it('purge les journaux de plus d’un an', async () => {
    await repo.create({ event: 'ANCIEN', timestamp: ago(400 * DAY) });
    await repo.create({ event: 'RECENT', timestamp: ago(DAY) });
    expect(await repo.deleteExpiredLogs()).toBe(1);
    expect((await repo.findAll()).map((l) => l.event)).toEqual(['RECENT']);
  });

  it('signale un identifiant introuvable', async () => {
    const missing = new ObjectId().toString();
    expect(await repo.update(missing, { event: 'Z' })).toBeNull();
    expect(await repo.delete(missing)).toBe(false);
    expect(await repo.exists(missing)).toBe(false);
    await expect(repo.findById('invalide')).rejects.toThrow();
  });
});
