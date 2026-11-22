/**
 * Routes /api/users/[id], /api/users/me, /api/specialities/[id], /api/availabilities/[id],
 * /api/health et /api/monitoring/metrics — sur une vraie base, session simulée.
 */
import { ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';

import * as availabilityRoute from '@/app/api/availabilities/[id]/route';
import * as healthRoute from '@/app/api/health/route';
import * as metricsRoute from '@/app/api/monitoring/metrics/route';
import * as specialityRoute from '@/app/api/specialities/[id]/route';
import * as userByIdRoute from '@/app/api/users/[id]/route';
import * as meRoute from '@/app/api/users/me/route';

import { db, read, request, routeParams, seedUser, signIn } from './_helpers';

const oid = () => new ObjectId().toString();

describe('/api/users/[id]', () => {
  it('refuse un visiteur non connecté', async () => {
    signIn(null);
    const target = await seedUser();
    const res = await read(await userByIdRoute.GET(request(`/api/users/${target.id}`), routeParams({ id: target.id })));
    expect(res.status).toBe(401);
  });

  it('permet à un admin de lire un utilisateur', async () => {
    signIn(await seedUser(['ADMIN']));
    const target = await seedUser();
    const res = await read(await userByIdRoute.GET(request(`/api/users/${target.id}`), routeParams({ id: target.id })));
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).toContain(target.email);
  });

  it('répond 400 pour un id invalide et 404 pour un utilisateur absent', async () => {
    signIn(await seedUser(['ADMIN']));
    expect((await read(await userByIdRoute.GET(request('/api/users/abc'), routeParams({ id: 'abc' })))).status).toBe(400);
    const missing = oid();
    expect((await read(await userByIdRoute.GET(request(`/api/users/${missing}`), routeParams({ id: missing })))).status).toBe(404);
  });

  it('empêche un client de modifier un autre compte', async () => {
    signIn(await seedUser(['CUSTOMER']));
    const target = await seedUser();
    const res = await read(
      await userByIdRoute.PUT(
        request(`/api/users/${target.id}`, { method: 'PUT', body: { firstName: 'Pirate' } }),
        routeParams({ id: target.id }),
      ),
    );
    expect(res.status).toBe(403);
  });

  it('permet à un admin de modifier puis supprimer un compte', async () => {
    signIn(await seedUser(['ADMIN']));
    const target = await seedUser();

    const updated = await read(
      await userByIdRoute.PUT(
        request(`/api/users/${target.id}`, { method: 'PUT', body: { firstName: 'Aminata' } }),
        routeParams({ id: target.id }),
      ),
    );
    expect(updated.status).toBe(200);
    expect((await db().collection('users').findOne({ _id: new ObjectId(target.id) }))?.['firstName']).toBe('Aminata');

    const deleted = await read(
      await userByIdRoute.DELETE(request(`/api/users/${target.id}`, { method: 'DELETE' }), routeParams({ id: target.id })),
    );
    expect([200, 204]).toContain(deleted.status);
  });
});

describe('/api/users/me', () => {
  it('renvoie et met à jour le profil connecté', async () => {
    const me = await seedUser();
    signIn(me);

    const profile = await read(await meRoute.GET(request('/api/users/me')));
    expect(profile.status).toBe(200);
    expect(JSON.stringify(profile.body)).toContain(me.email);

    const updated = await read(await meRoute.PUT(request('/api/users/me', { method: 'PUT', body: { firstName: 'Fatou' } })));
    expect(updated.status).toBeLessThan(500);
  });

  it('refuse un visiteur non connecté', async () => {
    signIn(null);
    expect((await read(await meRoute.GET(request('/api/users/me')))).status).toBe(401);
  });
});

describe('/api/specialities/[id]', () => {
  async function seedSpeciality() {
    const _id = new ObjectId();
    await db().collection('specialitytypes').insertOne({
      _id,
      name: `Spécialité ${_id.toString().slice(-6)}`,
      group: 'sante',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return _id.toString();
  }

  it('lit une spécialité, puis répond 404 pour une absente et 400 pour un id invalide', async () => {
    signIn(await seedUser());
    const id = await seedSpeciality();
    expect((await read(await specialityRoute.GET(request(`/api/specialities/${id}`), routeParams({ id })))).status).toBe(200);
    const missing = oid();
    expect((await read(await specialityRoute.GET(request(`/api/specialities/${missing}`), routeParams({ id: missing })))).status).toBe(404);
    expect((await read(await specialityRoute.GET(request('/api/specialities/x'), routeParams({ id: 'x' })))).status).toBe(400);
  });

  it('réserve la modification et la suppression aux admins', async () => {
    const id = await seedSpeciality();

    signIn(await seedUser(['CUSTOMER']));
    expect(
      (await read(await specialityRoute.PUT(request(`/api/specialities/${id}`, { method: 'PUT', body: { group: 'x' } }), routeParams({ id })))).status,
    ).toBe(403);

    signIn(await seedUser(['ADMIN']));
    const updated = await read(
      await specialityRoute.PUT(request(`/api/specialities/${id}`, { method: 'PUT', body: { group: 'medecine' } }), routeParams({ id })),
    );
    expect(updated.status).toBe(200);

    const deleted = await read(await specialityRoute.DELETE(request(`/api/specialities/${id}`, { method: 'DELETE' }), routeParams({ id })));
    expect([200, 204]).toContain(deleted.status);
  });
});

describe('/api/availabilities/[id]', () => {
  async function seedRule(userId: string) {
    const _id = new ObjectId();
    await db().collection('availabilityRules').insertOne({
      _id,
      userId,
      name: 'Semaine',
      type: 'weekly',
      isActive: true,
      timeSlots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return _id.toString();
  }

  it('lit, modifie et supprime une règle de son propriétaire', async () => {
    const provider = await seedUser(['PROVIDER']);
    signIn(provider);
    const id = await seedRule(provider.id);

    expect((await read(await availabilityRoute.GET(request(`/api/availabilities/${id}`), routeParams({ id })))).status).toBe(200);

    const updated = await read(
      await availabilityRoute.PUT(request(`/api/availabilities/${id}`, { method: 'PUT', body: { name: 'Matinées' } }), routeParams({ id })),
    );
    expect(updated.status).toBe(200);

    const deleted = await read(await availabilityRoute.DELETE(request(`/api/availabilities/${id}`, { method: 'DELETE' }), routeParams({ id })));
    expect(deleted.status).toBe(200);
  });

  it('interdit l’accès à la règle d’un autre prestataire', async () => {
    const owner = await seedUser(['PROVIDER']);
    const id = await seedRule(owner.id);
    signIn(await seedUser(['PROVIDER']));
    expect((await read(await availabilityRoute.GET(request(`/api/availabilities/${id}`), routeParams({ id })))).status).toBe(403);
  });

  it('refuse un visiteur non connecté', async () => {
    signIn(null);
    const id = oid();
    expect((await read(await availabilityRoute.GET(request(`/api/availabilities/${id}`), routeParams({ id })))).status).toBe(401);
  });
});

describe('/api/health et /api/monitoring/metrics', () => {
  it('le contrôle de santé répond', async () => {
    const res = await read(await healthRoute.GET(request('/api/health') as any));
    expect([200, 503]).toContain(res.status);
  });

  it('les métriques répondent en lecture', async () => {
    const res = await read(await metricsRoute.GET(request('/api/monitoring/metrics') as any));
    expect(res.status).toBeLessThan(500);
  });
});
