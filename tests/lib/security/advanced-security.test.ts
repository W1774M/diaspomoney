// @vitest-environment node
import * as Sentry from '@sentry/nextjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Redis en mémoire : compteurs, clés posées et TTL suffisent aux règles testées.
const h = vi.hoisted(() => {
  const store = new Map<string, string>();
  const redis = {
    store,
    fail: false,
    async exists(k: string) {
      if (redis.fail) throw new Error('redis HS');
      return store.has(k);
    },
    async ttl() {
      return 1200;
    },
    async incrWithExpiry(k: string) {
      if (redis.fail) throw new Error('redis HS');
      const n = Number(store.get(k) ?? 0) + 1;
      store.set(k, String(n));
      return n;
    },
    async set(k: string, v: string) {
      store.set(k, v);
      return true;
    },
    async del(k: string) {
      if (redis.fail) throw new Error('redis HS');
      return store.delete(k);
    },
  };
  return { redis, createAuditLog: vi.fn(async () => undefined) };
});

vi.mock('@/lib/redis/redis-client', () => ({ getRedisClient: () => h.redis }));
vi.mock('@/lib/security/audit-logging', () => ({ auditLogging: { createAuditLog: h.createAuditLog } }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn(), captureMessage: vi.fn(), addBreadcrumb: vi.fn() }));

import {
  addSecurityHeaders,
  ROLES,
  sanitizeInput,
  SECURITY_CONFIG,
  securityManager,
  SecurityManager,
} from '@/lib/security/advanced-security';

const at = (hour: number) => vi.setSystemTime(new Date(2026, 10, 23, hour, 30));
const tx = (amount: number, id = 't1') => securityManager.detectAnomalies('u1', 'TRANSACTION_CREATED', { transaction: { id, amount } });
const fraudMessages = () => vi.mocked(Sentry.captureMessage).mock.calls.filter(([m]) => String(m).startsWith('Fraud'));

beforeEach(() => {
  h.redis.store.clear();
  h.redis.fail = false;
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout'] });
  at(10);
});
afterEach(() => vi.useRealTimers());

describe('SecurityManager : mots de passe et jetons', () => {
  it('est un singleton', () => {
    expect(SecurityManager.getInstance()).toBe(securityManager);
  });

  it('liste chaque règle de mot de passe non respectée', () => {
    expect(securityManager.validatePassword('Bon-Mot2passe')).toEqual({ isValid: true, errors: [] });
    const { isValid, errors } = securityManager.validatePassword('abc');
    expect(isValid).toBe(false);
    expect(errors).toEqual([
      'Le mot de passe doit contenir au moins 8 caractères',
      'Le mot de passe doit contenir au moins une majuscule',
      'Le mot de passe doit contenir au moins un chiffre',
      'Le mot de passe doit contenir au moins un caractère spécial',
    ]);
    expect(securityManager.validatePassword('A1!' + 'a'.repeat(130)).errors).toEqual([
      'Le mot de passe ne peut pas dépasser 128 caractères',
    ]);
    expect(securityManager.validatePassword('TOUTMAJ1!').errors).toEqual(['Le mot de passe doit contenir au moins une minuscule']);
  });

  it('hache puis vérifie un mot de passe', async () => {
    vi.useRealTimers();
    const config = SECURITY_CONFIG as { BCRYPT_ROUNDS: number };
    const rounds = config.BCRYPT_ROUNDS;
    config.BCRYPT_ROUNDS = 4; // 12 tours : trop lent pour un test
    try {
      const hash = await securityManager.hashPassword('Secret-123');
      expect(hash.startsWith('$2')).toBe(true);
      expect(await securityManager.verifyPassword('Secret-123', hash)).toBe(true);
      expect(await securityManager.verifyPassword('autre', hash)).toBe(false);
    } finally {
      config.BCRYPT_ROUNDS = rounds;
    }
  });

  it('émet des jetons d’accès et de rafraîchissement vérifiables, chacun avec son secret', async () => {
    const { accessToken, refreshToken } = securityManager.generateTokens({ id: 'u1', email: 'a@b.fr', role: 'CUSTOMER' });
    expect(await securityManager.verifyToken(accessToken)).toMatchObject({ userId: 'u1', email: 'a@b.fr', role: 'CUSTOMER', type: 'access' });
    expect(await securityManager.verifyToken(refreshToken, 'refresh')).toMatchObject({ userId: 'u1', type: 'refresh' });
    await expect(securityManager.verifyToken(refreshToken)).rejects.toThrow('Token invalide');
    await expect(securityManager.verifyToken('pas-un-jwt')).rejects.toThrow('Token invalide');
  });

  it('refuse un jeton mis sur liste noire, pendant 15 minutes', async () => {
    const { accessToken } = securityManager.generateTokens({ id: 'u2', email: 'c@d.fr', role: 'ADMIN' });
    securityManager.blacklistToken(accessToken);
    await expect(securityManager.verifyToken(accessToken)).rejects.toThrow('Token invalide');
    vi.advanceTimersByTime(15 * 60 * 1000);
    at(10); // le jeton expire lui aussi à 15 min : on revient à l’heure d’émission
    await expect(securityManager.verifyToken(accessToken)).resolves.toMatchObject({ userId: 'u2' });
  });
});

describe('SecurityManager : droits (RBAC) et middlewares', () => {
  it('accorde selon le rôle, avec jokers et super-admin', () => {
    const [roleName, role] = Object.entries(ROLES).find(([, r]) => r.name !== 'SUPER_ADMIN' && r.permissions.length > 0)!;
    const p = role.permissions[0]!;
    const resource = p.resource === '*' ? 'n-importe-quoi' : p.resource;
    const action = p.action === '*' ? 'n-importe-quoi' : p.action;
    expect(securityManager.hasPermission(roleName, resource, action)).toBe(true);
    expect(securityManager.hasPermission(roleName, 'ressource-inexistante', 'action-inexistante')).toBe(
      role.permissions.some((x) => x.resource === '*' && x.action === '*'),
    );
    expect(securityManager.hasPermission('ROLE_INCONNU', resource, action)).toBe(false);
    const superAdmin = Object.keys(ROLES).find((k) => ROLES[k]!.name === 'SUPER_ADMIN');
    if (superAdmin) expect(securityManager.hasPermission(superAdmin, 'tout', 'tout')).toBe(true);
  });

  it('authentifie depuis l’en-tête Authorization (avec ou sans « Bearer »)', async () => {
    const { accessToken } = securityManager.generateTokens({ id: 'u3', email: 'e@f.fr', role: 'CUSTOMER' });
    const req = (auth?: string) => new NextRequest('http://localhost/api', auth ? { headers: { authorization: auth } } : {});

    expect((await securityManager.authenticate(req(`Bearer ${accessToken}`))).user).toMatchObject({ userId: 'u3' });
    expect((await securityManager.authenticate(req(accessToken))).user).toMatchObject({ userId: 'u3' });
    expect(await securityManager.authenticate(req())).toEqual({ user: null, error: 'Token manquant' });
    expect(await securityManager.authenticate(req('Bearer faux'))).toEqual({ user: null, error: 'Token invalide' });

    const forged = jwt.sign({ userId: 'x', role: 'SUPER_ADMIN' }, 'autre-secret');
    expect(await securityManager.authorize('users', 'read')(req(`Bearer ${forged}`))).toBe(false);
    const allowed = Object.entries(ROLES).find(([, r]) => r.name === 'SUPER_ADMIN')?.[0];
    if (allowed) {
      const { accessToken: admin } = securityManager.generateTokens({ id: 'a', email: 'a@a.fr', role: allowed });
      expect(await securityManager.authorize('users', 'delete')(req(`Bearer ${admin}`))).toBe(true);
    }
  });
});

describe('SecurityManager : force brute', () => {
  const fail = () => securityManager.detectAnomalies('u1', 'LOGIN_FAILED', { ipAddress: '1.2.3.4' });

  it('alerte à 80 % du seuil, bloque au seuil, puis signale l’utilisateur bloqué', async () => {
    for (let i = 0; i < 3; i++) await fail();
    expect(Sentry.addBreadcrumb).not.toHaveBeenCalledWith(expect.objectContaining({ message: 'Approaching brute force threshold' }));

    await fail(); // 4e : 80 %
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({ message: 'Approaching brute force threshold' }));
    expect(await securityManager.isUserBlocked('u1')).toBe(false);

    await fail(); // 5e : blocage
    expect(await securityManager.isUserBlocked('u1')).toBe(true);
    expect(JSON.parse(h.redis.store.get('security:blocked:user:u1')!)).toMatchObject({ attemptCount: 5, reason: 'BRUTE_FORCE' });
    expect(Sentry.captureMessage).toHaveBeenCalledWith('Brute force attack detected - user blocked automatically', expect.objectContaining({ level: 'error' }));

    await fail(); // déjà bloqué : plus de comptage
    expect(Sentry.captureMessage).toHaveBeenLastCalledWith(
      'Brute force attack detected - user blocked',
      expect.objectContaining({ level: 'warning', extra: expect.objectContaining({ remainingBlockTime: 1200 }) }),
    );
    expect(h.redis.store.get('security:login_failed:user:u1')).toBe('5');
  });

  it('journalise l’événement d’audit avec gravité et issue', async () => {
    await fail();
    expect(h.createAuditLog).toHaveBeenCalledWith('LOGIN_FAILED', 'SECURITY_SYSTEM', { ipAddress: '1.2.3.4' }, expect.objectContaining({
      userId: 'u1', category: 'SECURITY', severity: 'MEDIUM', outcome: 'FAILURE', ipAddress: '1.2.3.4', userAgent: 'unknown',
    }));
    await securityManager.detectAnomalies('u1', 'PROFILE_VIEWED');
    expect(h.createAuditLog).toHaveBeenLastCalledWith('PROFILE_VIEWED', 'SECURITY_SYSTEM', {}, expect.objectContaining({ severity: 'LOW', outcome: 'SUCCESS' }));
  });

  it('remet le compteur à zéro après une connexion réussie', async () => {
    await fail();
    await securityManager.resetLoginAttempts('u1');
    expect(h.redis.store.has('security:login_failed:user:u1')).toBe(false);
  });

  it('ne bloque personne quand Redis est en panne', async () => {
    h.redis.fail = true;
    await expect(fail()).resolves.toBeUndefined();
    expect(Sentry.captureException).toHaveBeenCalled();
    expect(await securityManager.isUserBlocked('u1')).toBe(false);
    await expect(securityManager.resetLoginAttempts('u1')).resolves.toBeUndefined();
    expect(await securityManager.isTransactionSuspicious('t1')).toBe(false);
  });

  it('survit à une erreur du journal d’audit', async () => {
    h.createAuditLog.mockRejectedValueOnce(new Error('mongo HS'));
    await expect(securityManager.detectAnomalies('u1', 'PROFILE_VIEWED')).resolves.toBeUndefined();
  });
});

describe('SecurityManager : détection de fraude', () => {
  it('laisse passer une petite transaction en journée', async () => {
    await tx(2500);
    expect(fraudMessages()).toHaveLength(0);
    expect(Sentry.addBreadcrumb).not.toHaveBeenCalledWith(expect.objectContaining({ message: 'Medium risk transaction detected' }));
  });

  it('signale un risque moyen (montant élevé hors horaires)', async () => {
    at(22);
    await tx(15000); // 20 + 10
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Medium risk transaction detected',
      data: expect.objectContaining({ fraudScore: 30, riskLevel: 'MEDIUM', fraudFlags: ['HIGH_AMOUNT', 'UNUSUAL_HOURS'] }),
    }));
  });

  it('alerte sur un risque élevé sans marquer la transaction', async () => {
    await tx(50000); // 40 + 15 (montant rond)
    const [[msg, ctx]] = fraudMessages() as any;
    expect(msg).toBe('Fraud detected in transaction - Risk Level: HIGH');
    expect(ctx).toMatchObject({ level: 'warning', extra: { fraudScore: 55, fraudFlags: ['VERY_HIGH_AMOUNT', 'SUSPICIOUS_ROUND_AMOUNT'] } });
    expect(await securityManager.isTransactionSuspicious('t1')).toBe(false);
  });

  it('marque la transaction suspecte au-delà de 70 (rafale + montant)', async () => {
    for (let i = 1; i <= 4; i++) await tx(50000, `t${i}`); // 4e : rafale (> 3 par minute)
    const last = fraudMessages().at(-1) as any;
    expect(last[0]).toBe('Fraud detected in transaction - Risk Level: CRITICAL');
    expect(last[1]).toMatchObject({ level: 'error', extra: { fraudScore: 90 } });
    expect(await securityManager.isTransactionSuspicious('t4')).toBe(true);
    expect(await securityManager.isTransactionSuspicious('t3')).toBe(false);
  });

  it('repère les fréquences horaire et journalière et les montants répétés', async () => {
    const day = new Date().toISOString().split('T')[0];
    h.redis.store.set(`security:transactions:user:u1:hour:${new Date().getHours()}`, '10');
    h.redis.store.set(`security:transactions:user:u1:day:${day}`, '50');
    h.redis.store.set('security:transactions:user:u1:amount:1234', '5');
    await securityManager.detectAnomalies('u1', 'TRANSACTION_CREATED', { amount: 1234, transactionId: 'tx-meta' });
    const [[, ctx]] = fraudMessages() as any;
    expect(ctx.extra).toMatchObject({
      transactionId: 'tx-meta',
      fraudScore: 75,
      fraudFlags: ['HIGH_FREQUENCY_HOUR', 'HIGH_FREQUENCY_DAY', 'REPEATED_AMOUNT'],
      currency: 'EUR',
    });
  });

  it('ne bloque pas la transaction si Redis tombe', async () => {
    h.redis.fail = true;
    await expect(tx(50000)).resolves.toBeUndefined();
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({
      tags: expect.objectContaining({ security: 'fraud_detection' }),
    }));
  });
});

describe('utilitaires de sécurité', () => {
  it('ajoute les en-têtes de sécurité configurés', () => {
    const res = addSecurityHeaders(NextResponse.json({}));
    for (const [k, v] of Object.entries(SECURITY_CONFIG.SECURITY_HEADERS)) expect(res.headers.get(k)).toBe(v);
  });

  it('nettoie récursivement chaînes, tableaux et objets', () => {
    expect(sanitizeInput({
      nom: '<b>Awa</b>',
      lien: 'JavaScript:alert(1)',
      tags: ['<x>', 'onclick=go()', 3],
      vide: null,
    })).toEqual({ nom: 'bAwa/b', lien: 'alert(1)', tags: ['x', 'go()', 3], vide: null });
    expect(sanitizeInput(42)).toBe(42);
  });
});
