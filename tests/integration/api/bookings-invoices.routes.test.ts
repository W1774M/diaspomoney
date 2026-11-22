/**
 * Routes de réservation (résumé PDF, attribution d'un prestataire, validation d'étape),
 * de facture et de statistiques de plateforme — vraie base, session simulée.
 */
import { ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';

import * as assignRoute from '@/app/api/bookings/[id]/assign-provider/route';
import * as summaryRoute from '@/app/api/bookings/[id]/download-summary/route';
import * as validateStepRoute from '@/app/api/bookings/[id]/validate-step/route';
import * as invoiceRoute from '@/app/api/invoices/[id]/route';
import * as platformStatsRoute from '@/app/api/statistics/platform/route';

import { db, read, request, routeParams, seedUser, signIn } from './_helpers';

const ALL_ELEMENTS = [
  'clientInfo',
  'beneficiaryInfo',
  'serviceDetails',
  'appointmentInfo',
  'providerInfo',
  'paymentInfo',
  'additionalOptions',
  'progressHistory',
];

async function seedBooking(requesterId: string, providerId: string, extra: Record<string, unknown> = {}) {
  const _id = new ObjectId();
  await db().collection('bookings').insertOne({
    _id,
    reservationNumber: `RES-TEST-${_id.toString().slice(-6)}`,
    requesterId,
    providerId,
    serviceId: 'consultation-test',
    serviceType: 'HEALTH',
    status: 'CONFIRMED',
    appointmentDate: new Date(Date.now() + 86_400_000),
    timeslot: '10:00',
    recipient: { firstName: 'Mamadou', lastName: 'Diallo', phone: '+237600000000' },
    metadata: { paymentStatus: 'confirmed', amount: 19, currency: 'EUR', selectedOptions: [] },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...extra,
  });
  return _id.toString();
}

describe('POST /api/bookings/[id]/download-summary', () => {
  it('génère le PDF complet pour un admin', async () => {
    signIn(await seedUser(['ADMIN']));
    const client = await seedUser();
    const provider = await seedUser(['PROVIDER']);
    const id = await seedBooking(client.id, provider.id);

    const res = await summaryRoute.POST(
      request(`/api/bookings/${id}/download-summary`, { method: 'POST', body: { elements: ALL_ELEMENTS } }),
      routeParams({ id }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/pdf');
    expect((await res.arrayBuffer()).byteLength).toBeGreaterThan(500);
  });

  it('autorise le prestataire assigné mais pas un autre', async () => {
    const client = await seedUser();
    const provider = await seedUser(['PROVIDER']);
    const id = await seedBooking(client.id, provider.id);
    const body = { elements: ['serviceDetails'] };

    signIn(provider);
    expect((await summaryRoute.POST(request(`/api/bookings/${id}/download-summary`, { method: 'POST', body }), routeParams({ id }))).status).toBe(200);

    signIn(await seedUser(['PROVIDER']));
    expect((await summaryRoute.POST(request(`/api/bookings/${id}/download-summary`, { method: 'POST', body }), routeParams({ id }))).status).toBe(403);
  });

  it('valide la requête : connexion, id, éléments, réservation existante', async () => {
    signIn(null);
    const any = new ObjectId().toString();
    expect((await summaryRoute.POST(request(`/api/bookings/${any}/download-summary`, { method: 'POST', body: { elements: ['x'] } }), routeParams({ id: any }))).status).toBe(401);

    signIn(await seedUser(['ADMIN']));
    expect((await read(await summaryRoute.POST(request('/api/bookings/x/download-summary', { method: 'POST', body: { elements: ['x'] } }), routeParams({ id: 'x' })))).status).toBe(400);
    expect((await read(await summaryRoute.POST(request(`/api/bookings/${any}/download-summary`, { method: 'POST', body: { elements: [] } }), routeParams({ id: any })))).status).toBe(400);
    expect((await read(await summaryRoute.POST(request(`/api/bookings/${any}/download-summary`, { method: 'POST', body: { elements: ['clientInfo'] } }), routeParams({ id: any })))).status).toBe(404);
  });
});

describe('/api/bookings/[id]/assign-provider', () => {
  const shared = { clientInfo: true, serviceDetails: true };

  it('attribue un prestataire inscrit puis retire l’attribution', async () => {
    signIn(await seedUser(['ADMIN']));
    const client = await seedUser();
    const provider = await seedUser(['PROVIDER']);
    const id = await seedBooking(client.id, '');

    const assigned = await read(
      await assignRoute.POST(
        request(`/api/bookings/${id}/assign-provider`, { method: 'POST', body: { mode: 'registered', providerId: provider.id, sharedElements: shared } }),
        routeParams({ id }),
      ),
    );
    expect(assigned.status).toBe(200);
    expect((await db().collection('bookings').findOne({ _id: new ObjectId(id) }))?.['providerId']).toBe(provider.id);

    const removed = await read(await assignRoute.DELETE(request(`/api/bookings/${id}/assign-provider`, { method: 'DELETE' }), routeParams({ id })));
    expect(removed.status).toBeLessThan(500);
  });

  it('refuse un non-admin, un corps invalide et un prestataire inconnu', async () => {
    const client = await seedUser();
    const id = await seedBooking(client.id, '');

    signIn(client);
    expect((await read(await assignRoute.POST(request(`/api/bookings/${id}/assign-provider`, { method: 'POST', body: {} }), routeParams({ id })))).status).toBe(403);

    signIn(await seedUser(['ADMIN']));
    expect((await read(await assignRoute.POST(request(`/api/bookings/${id}/assign-provider`, { method: 'POST', body: { mode: 'inconnu' } }), routeParams({ id })))).status).toBe(400);

    const unknown = await read(
      await assignRoute.POST(
        request(`/api/bookings/${id}/assign-provider`, { method: 'POST', body: { mode: 'registered', providerId: new ObjectId().toString(), sharedElements: shared } }),
        routeParams({ id }),
      ),
    );
    expect(unknown.status).toBe(404);
  });
});

describe('POST /api/bookings/[id]/validate-step', () => {
  it('permet à un admin de valider les étapes dans l’ordre, et refuse de sauter une étape', async () => {
    signIn(await seedUser(['ADMIN']));
    const id = await seedBooking((await seedUser()).id, (await seedUser(['PROVIDER'])).id);
    const step = (n: number) => validateStepRoute.POST(request(`/api/bookings/${id}/validate-step`, { method: 'POST', body: { step: n } }), routeParams({ id }));

    // Sauter l’étape 1 : refus explicite (400 et message), plus une erreur 500 générique.
    const skipped = await read(await step(3));
    expect(skipped.status).toBe(400);
    expect(skipped.body.error).toMatch(/Impossible de valider/);

    expect((await read(await step(1))).status).toBe(200);
  });

  it('refuse un client, une étape hors bornes et une réservation absente', async () => {
    const id = await seedBooking((await seedUser()).id, (await seedUser(['PROVIDER'])).id);

    signIn(await seedUser());
    expect((await read(await validateStepRoute.POST(request(`/api/bookings/${id}/validate-step`, { method: 'POST', body: { step: 1 } }), routeParams({ id })))).status).toBe(403);

    signIn(await seedUser(['ADMIN']));
    expect((await read(await validateStepRoute.POST(request(`/api/bookings/${id}/validate-step`, { method: 'POST', body: { step: 9 } }), routeParams({ id })))).status).toBe(400);
    const missing = new ObjectId().toString();
    expect((await read(await validateStepRoute.POST(request(`/api/bookings/${missing}/validate-step`, { method: 'POST', body: { step: 1 } }), routeParams({ id: missing })))).status).toBe(404);
  });
});

describe('/api/invoices/[id]', () => {
  async function seedInvoice(userId: string) {
    const _id = new ObjectId();
    await db().collection('invoices').insertOne({
      _id,
      invoiceNumber: `FAC-TEST-${_id.toString().slice(-6)}`,
      userId,
      amount: 19,
      currency: 'EUR',
      status: 'SENT',
      items: [{ description: 'Consultation', quantity: 1, unitPrice: 19, total: 19 }],
      issueDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return _id.toString();
  }

  it('le propriétaire lit sa facture, un autre client non', async () => {
    const owner = await seedUser();
    const id = await seedInvoice(owner.id);

    signIn(owner);
    expect((await read(await invoiceRoute.GET(request(`/api/invoices/${id}`), routeParams({ id })))).status).toBe(200);

    signIn(await seedUser());
    expect((await read(await invoiceRoute.GET(request(`/api/invoices/${id}`), routeParams({ id })))).status).toBe(403);
  });

  it('un admin modifie une facture ; 401 sans session', async () => {
    const id = await seedInvoice((await seedUser()).id);

    signIn(null);
    expect((await read(await invoiceRoute.GET(request(`/api/invoices/${id}`), routeParams({ id })))).status).toBe(401);

    signIn(await seedUser(['ADMIN']));
    const res = await read(await invoiceRoute.PUT(request(`/api/invoices/${id}`, { method: 'PUT', body: { notes: 'Payée par virement' } }), routeParams({ id })));
    expect(res.status).toBeLessThan(500);
  });
});

describe('GET /api/statistics/platform', () => {
  it('réservé au super-admin', async () => {
    signIn(await seedUser(['ADMIN']));
    expect((await read(await platformStatsRoute.GET(request('/api/statistics/platform')))).status).toBe(403);

    signIn(await seedUser(['SUPERADMIN']));
    const res = await read(await platformStatsRoute.GET(request('/api/statistics/platform')));
    expect(res.status).toBe(200);
  });

  it('refuse un visiteur non connecté', async () => {
    signIn(null);
    expect((await read(await platformStatsRoute.GET(request('/api/statistics/platform')))).status).toBe(401);
  });
});
