/**
 * Support d'un compte (fiche, actions, consultation en lecture seule) sur la base de test :
 * routes admin, tickets à usage unique, callbacks NextAuth jwt/session et journal d'audit.
 */
import { ObjectId } from 'mongodb';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mail = vi.hoisted(() => ({ sendPasswordResetEmail: vi.fn(async () => true) }));
vi.mock('@/lib/email/resend', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  sendPasswordResetEmail: mail.sendPasswordResetEmail,
}));

import * as impersonationRoute from '@/app/api/admin/support/users/[id]/impersonation/route';
import * as supportRoute from '@/app/api/admin/support/users/[id]/route';
import { authConfig } from '@/auth.config';
import { IMPERSONATION_TTL_MS } from '@/lib/support/impersonation-policy';
import {
  applyImpersonationToToken,
  endImpersonation,
  redeemImpersonationTicket,
} from '@/lib/support/support.service';

import { db, read, request, routeParams, seedUser, signIn, type TestUser } from '../api/_helpers';

type Jwt = (args: Record<string, unknown>) => Promise<Record<string, any>>;
type SessionCb = (args: Record<string, unknown>) => Promise<Record<string, any>>;
const jwt = authConfig.callbacks!.jwt as unknown as Jwt;
const sessionCallback = authConfig.callbacks!.session as unknown as SessionCb;

const supportLogs = (targetId: string) =>
  db().collection('audit_logs').find({ resource: 'SUPPORT', resourceId: targetId }).sort({ timestamp: 1 }).toArray();

async function ticketFor(admin: TestUser, target: TestUser, reason = 'ticket 123 : paiement bloqué') {
  signIn(admin);
  const res = await read(
    await impersonationRoute.POST(
      request(`/api/admin/support/users/${target.id}/impersonation`, { method: 'POST', body: { reason } }),
      routeParams({ id: target.id }) as never,
    ),
  );
  return res;
}

const adminToken = (admin: TestUser) => ({ userId: admin.id, email: admin.email, name: 'Admin', roles: admin.roles });

beforeEach(() => {
  mail.sendPasswordResetEmail.mockClear();
});

describe('fiche support (GET)', () => {
  it('réservée aux administrateurs', async () => {
    const target = await seedUser();
    signIn(null);
    expect((await read(await supportRoute.GET(request('/x'), routeParams({ id: target.id }) as never))).status).toBe(401);
    signIn(await seedUser(['CSM']));
    expect((await read(await supportRoute.GET(request('/x'), routeParams({ id: target.id }) as never))).status).toBe(403);
  });

  it('donne les volumes réels et l’état du compte', async () => {
    const target = await seedUser(['CUSTOMER'], { emailVerified: new Date() });
    await db().collection('bookings').insertMany([{ requesterId: target.id }, { requesterId: target.id }, { providerId: target.id }]);
    await db().collection('transactions').insertMany([{ payerId: target.id }, { beneficiaryId: target.id }, { payerId: 'autre' }]);
    await db().collection('invoices').insertOne({ userId: target.id });

    signIn(await seedUser(['ADMIN']));
    const res = await read(await supportRoute.GET(request('/x'), routeParams({ id: target.id }) as never));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      user: { id: target.id, status: 'ACTIVE', emailVerified: true, email: target.email },
      counts: { bookingsAsCustomer: 2, bookingsAsProvider: 1, transactions: 2, invoices: 1 },
      canImpersonate: true,
      history: [],
    });
  });

  it('404 pour un utilisateur absent ou un identifiant invalide', async () => {
    signIn(await seedUser(['ADMIN']));
    for (const id of [new ObjectId().toString(), 'abc']) {
      expect((await read(await supportRoute.GET(request('/x'), routeParams({ id }) as never))).status).toBe(404);
    }
  });

  it('un compte administrateur ne peut pas être consulté', async () => {
    const other = await seedUser(['ADMIN']);
    signIn(await seedUser(['SUPERADMIN']));
    const res = await read(await supportRoute.GET(request('/x'), routeParams({ id: other.id }) as never));
    expect(res.body.data.canImpersonate).toBe(false);
  });
});

describe('actions ciblées (POST)', () => {
  const act = async (target: TestUser, body: Record<string, unknown>) =>
    read(await supportRoute.POST(request('/x', { method: 'POST', body }), routeParams({ id: target.id }) as never));

  it('exige un motif et une action connue', async () => {
    const target = await seedUser();
    signIn(await seedUser(['ADMIN']));
    expect((await act(target, { action: 'suspend', reason: 'ab' })).body.code).toBe('REASON_REQUIRED');
    expect((await act(target, { action: 'supprimer', reason: 'ticket 1' })).body.code).toBe('UNKNOWN_ACTION');
  });

  it('suspend puis réactive, avec motif et auteur au journal', async () => {
    const target = await seedUser();
    signIn(await seedUser(['ADMIN']));

    expect(await act(target, { action: 'suspend', reason: 'fraude suspectée' })).toMatchObject({ status: 200, body: { status: 'SUSPENDED' } });
    expect((await db().collection('users').findOne({ _id: new ObjectId(target.id) }))?.['status']).toBe('SUSPENDED');
    expect((await act(target, { action: 'suspend', reason: 'encore une fois' })).status).toBe(409);

    expect(await act(target, { action: 'reactivate', reason: 'vérification faite' })).toMatchObject({ status: 200, body: { status: 'ACTIVE' } });

    const logs = await supportLogs(target.id);
    expect(logs.map((l) => l['action'])).toEqual(['SUPPORT_ACCOUNT_SUSPENDED', 'SUPPORT_ACCOUNT_REACTIVATED']);
    expect(logs[0]?.['details']).toMatchObject({ reason: 'fraude suspectée', adminName: 'Awa Diallo', previousStatus: 'ACTIVE' });

    const summary = await read(await supportRoute.GET(request('/x'), routeParams({ id: target.id }) as never));
    expect(summary.body.data.history.map((h: { action: string }) => h.action)).toEqual([
      'SUPPORT_ACCOUNT_REACTIVATED',
      'SUPPORT_ACCOUNT_SUSPENDED',
    ]);
  });

  it('refuse de réactiver un compte jamais activé, et d’agir sur soi-même ou un admin', async () => {
    const admin = await seedUser(['ADMIN']);
    const pending = await seedUser(['CUSTOMER'], { status: 'PENDING' });
    signIn(admin);
    expect((await act(pending, { action: 'reactivate', reason: 'ticket 9' })).body.code).toBe('PENDING_ACCOUNT');
    expect((await act(admin, { action: 'suspend', reason: 'ticket 9' })).body.code).toBe('SELF_ACTION');
    expect((await act(await seedUser(['ADMIN']), { action: 'suspend', reason: 'ticket 9' })).body.code).toBe('TARGET_PROTECTED');
  });

  it('envoie un lien de réinitialisation sans exposer le jeton', async () => {
    const target = await seedUser();
    signIn(await seedUser(['ADMIN']));
    const previous = process.env['RESEND_API_KEY'];
    process.env['RESEND_API_KEY'] = 're_test';
    try {
      const res = await act(target, { action: 'send-password-reset', reason: 'ticket 42 : mot de passe perdu' });
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).not.toMatch(/token/i);
    } finally {
      if (previous === undefined) delete process.env['RESEND_API_KEY'];
      else process.env['RESEND_API_KEY'] = previous;
    }
    expect(mail.sendPasswordResetEmail).toHaveBeenCalledWith(target.email, 'Awa Diallo', expect.stringContaining('/reset-password?token='));
    const stored = await db().collection('users').findOne({ _id: new ObjectId(target.id) });
    expect(stored?.['passwordResetToken']).toMatch(/^[a-f0-9]{64}$/);
    expect((await supportLogs(target.id))[0]?.['details']).toMatchObject({ emailSent: true });
  });
});

describe('consultation en lecture seule', () => {
  it('ticket → session de l’utilisateur consulté → sortie, tout au journal', async () => {
    const admin = await seedUser(['ADMIN']);
    const target = await seedUser(['CUSTOMER', 'PROVIDER']);
    const created = await ticketFor(admin, target);
    expect(created.status).toBe(200);
    const { ticketId } = created.body.data;

    // Le navigateur de l'admin échange le ticket (update({ impersonationTicket }))
    let token = await jwt({ token: adminToken(admin), trigger: 'update', session: { impersonationTicket: ticketId } });
    expect(token['impersonation']).toMatchObject({ adminId: admin.id, targetId: target.id, targetRoles: ['CUSTOMER', 'PROVIDER'] });
    expect(token['userId']).toBe(admin.id);

    const session = await sessionCallback({ session: { user: {} }, token });
    expect(session['user']).toMatchObject({ id: target.id, email: target.email, roles: ['CUSTOMER', 'PROVIDER'] });
    expect(session['impersonation']).toMatchObject({ targetId: target.id, reason: 'ticket 123 : paiement bloqué' });

    // Pendant la consultation, les routes admin voient l'utilisateur consulté : refus
    signIn({ id: target.id, email: target.email, roles: ['CUSTOMER'] });
    expect((await read(await supportRoute.GET(request('/x'), routeParams({ id: target.id }) as never))).status).toBe(403);

    // Le ticket ne sert qu'une fois
    expect(await redeemImpersonationTicket(ticketId, admin.id)).toBeNull();

    token = await jwt({ token, trigger: 'update', session: { endImpersonation: true } });
    expect(token['impersonation']).toBeUndefined();
    const back = await sessionCallback({ session: { user: {} }, token });
    expect(back['user']).toMatchObject({ id: admin.id });
    expect(back['impersonation']).toBeUndefined();

    expect((await supportLogs(target.id)).map((l) => l['action'])).toEqual([
      'SUPPORT_IMPERSONATION_REQUESTED',
      'SUPPORT_IMPERSONATION_STARTED',
      'SUPPORT_IMPERSONATION_ENDED',
    ]);
  });

  it('refuse le ticket d’un autre admin, un ticket expiré ou inconnu', async () => {
    const admin = await seedUser(['ADMIN']);
    const target = await seedUser();
    const { ticketId } = (await ticketFor(admin, target)).body.data;

    const intruder = await seedUser(['ADMIN']);
    expect(await redeemImpersonationTicket(ticketId, intruder.id)).toBeNull();
    expect(await redeemImpersonationTicket(new ObjectId().toString(), admin.id)).toBeNull();
    expect(await redeemImpersonationTicket('abc', admin.id)).toBeNull();

    await db().collection('support_impersonations').updateOne({ _id: new ObjectId(ticketId) }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await redeemImpersonationTicket(ticketId, admin.id)).toBeNull();
  });

  it('refuse si l’admin a perdu ses droits entre-temps', async () => {
    const admin = await seedUser(['ADMIN']);
    const target = await seedUser();
    const { ticketId } = (await ticketFor(admin, target)).body.data;
    await db().collection('users').updateOne({ _id: new ObjectId(admin.id) }, { $set: { roles: ['CUSTOMER'] } });
    expect(await redeemImpersonationTicket(ticketId, admin.id)).toBeNull();
  });

  it('refuse un motif trop court, un compte admin, un compte suspendu, soi-même', async () => {
    const admin = await seedUser(['ADMIN']);
    expect((await ticketFor(admin, await seedUser(), 'abc')).body.code).toBe('REASON_REQUIRED');
    expect((await ticketFor(admin, await seedUser(['SUPERADMIN']))).body.code).toBe('TARGET_PROTECTED');
    expect((await ticketFor(admin, await seedUser(['CUSTOMER'], { status: 'SUSPENDED' }))).body.code).toBe('TARGET_SUSPENDED');
    expect((await ticketFor(admin, admin)).body.code).toBe('SELF_ACTION');
    signIn(await seedUser(['CUSTOMER']));
    const target = await seedUser();
    const res = await read(
      await impersonationRoute.POST(
        request('/x', { method: 'POST', body: { reason: 'ticket 123' } }),
        routeParams({ id: target.id }) as never,
      ),
    );
    expect(res.status).toBe(403);
  });

  it('une consultation expirée s’arrête d’elle-même, une seule fois au journal', async () => {
    const admin = await seedUser(['ADMIN']);
    const target = await seedUser();
    const { ticketId } = (await ticketFor(admin, target)).body.data;
    const state = (await redeemImpersonationTicket(ticketId, admin.id))!;
    expect(state.expiresAt).toBeGreaterThan(Date.now() + IMPERSONATION_TTL_MS - 60_000);

    const token = await applyImpersonationToToken({ userId: admin.id, impersonation: { ...state, expiresAt: Date.now() - 1 } }, undefined, undefined);
    expect(token['impersonation']).toBeUndefined();
    await endImpersonation(state, 'manual'); // déjà close : sans effet
    const ended = (await supportLogs(target.id)).filter((l) => l['action'] === 'SUPPORT_IMPERSONATION_ENDED');
    expect(ended).toHaveLength(1);
    expect(ended[0]?.['details']).toMatchObject({ cause: 'expired' });
  });

  it('une session ouverte se ferme quand le compte est suspendu (relecture périodique du statut)', async () => {
    const target = await seedUser();
    const token = { userId: target.id, email: target.email, roles: ['CUSTOMER'], statusCheckedAt: Date.now() };
    expect(await jwt({ token: { ...token } })).toMatchObject({ userId: target.id });

    await db().collection('users').updateOne({ _id: new ObjectId(target.id) }, { $set: { status: 'SUSPENDED' } });
    // Vérifié il y a moins de 5 min : pas de relecture
    expect(await jwt({ token: { ...token } })).toMatchObject({ userId: target.id });
    // Vérification échue : la session est vidée
    expect(await jwt({ token: { ...token, statusCheckedAt: Date.now() - 6 * 60 * 1000 } })).toEqual({});
    expect(await jwt({ token: { userId: target.id, email: target.email } })).toEqual({});
  });

  it('une nouvelle connexion repart sans consultation ; un ticket ne remplace pas une consultation en cours', async () => {
    const admin = await seedUser(['ADMIN']);
    const target = await seedUser();
    const other = await seedUser();
    const first = (await ticketFor(admin, target)).body.data.ticketId;
    const second = (await ticketFor(admin, other)).body.data.ticketId;

    let token = await jwt({ token: adminToken(admin), trigger: 'update', session: { impersonationTicket: first } });
    token = await jwt({ token, trigger: 'update', session: { impersonationTicket: second } });
    expect(token['impersonation'].targetId).toBe(target.id);

    const fresh = await jwt({ token, user: { id: admin.id, email: admin.email, roles: ['ADMIN'] }, account: { provider: 'credentials' } });
    expect(fresh['impersonation']).toBeUndefined();
  });
});
