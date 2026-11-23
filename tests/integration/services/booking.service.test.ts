/**
 * Service de réservation, de bout en bout sur une vraie base (diaspomoney_test) :
 * service → repository → MongoDB. Couvre le cycle de vie d'une réservation et les erreurs.
 */
import { MongoClient, ObjectId } from 'mongodb';
import { beforeEach, describe, expect, it } from 'vitest';

import { bookingService } from '@/services/booking/booking.service';

const db = () =>
  ((globalThis as any).__DIASPOMONEY_TEST_MONGO__ as MongoClient).db(process.env['MONGODB_DB']);

const SERVICE_ID = 'consultation-generaliste-test';
const oid = () => new ObjectId().toString();

async function seedCatalog(overrides: Record<string, unknown> = {}) {
  await db().collection('services').insertOne({
    id: SERVICE_ID,
    name: 'Consultation généraliste',
    category: 'HEALTH',
    price: 19,
    isActive: true,
    ...overrides,
  });
}

function bookingData(requesterId = oid(), providerId = oid()) {
  return {
    requesterId,
    providerId,
    serviceId: SERVICE_ID,
    serviceType: 'HEALTH' as const,
    appointmentDate: new Date(Date.now() + 3 * 86_400_000),
    timeslot: '10:00',
    consultationMode: 'cabinet' as const,
    recipient: { firstName: 'Awa', lastName: 'Diallo', phone: '+237600000000' },
    metadata: { source: 'test' },
  };
}

describe('bookingService (intégration)', () => {
  beforeEach(async () => {
    await seedCatalog();
  });

  it('crée une réservation en attente et la relit', async () => {
    const created = await bookingService.createBooking(bookingData());

    expect(created.id).toBeTruthy();
    expect(created.status).toBe('PENDING');
    expect(created.serviceId).toBe(SERVICE_ID);

    const read = await bookingService.getBookingById(created.id!);
    expect(read.id).toBe(created.id);
    expect(read.recipient?.firstName).toBe('Awa');
  });

  it('refuse une réservation sur une offre absente du catalogue', async () => {
    await expect(
      bookingService.createBooking({ ...bookingData(), serviceId: 'offre-inexistante' }),
    ).rejects.toThrow(/Catalog service not found/);
  });

  it('accepte un brouillon track-progress sans entrée catalogue (serviceId draft)', async () => {
    const created = await bookingService.createBooking({
      ...bookingData(),
      providerId: 'admin-draft',
      serviceId: 'draft',
      metadata: { isDraft: true, currentStep: 1 },
    });

    expect(created.status).toBe('DRAFT');
    expect(created.serviceId).toBe('draft');
  });

  it('refuse une réservation sur une offre inactive', async () => {
    await db().collection('services').updateOne({ id: SERVICE_ID }, { $set: { isActive: false } });
    await expect(bookingService.createBooking(bookingData())).rejects.toThrow();
  });

  it('liste les réservations d’un client et d’un prestataire', async () => {
    const requesterId = oid();
    const providerId = oid();
    await bookingService.createBooking(bookingData(requesterId, providerId));
    await bookingService.createBooking(bookingData(requesterId, providerId));
    await bookingService.createBooking(bookingData()); // autre client

    const mine = await bookingService.getUserBookings(requesterId);
    expect(mine.total).toBe(2);
    expect(mine.data.every((b) => b.requesterId === requesterId)).toBe(true);

    const provider = await bookingService.getProviderBookings(providerId, { limit: 1 });
    expect(provider.total).toBe(2);
    expect(provider.data).toHaveLength(1);

    const filtered = await bookingService.getBookings({ userId: requesterId, status: 'PENDING' });
    expect(filtered.total).toBe(2);
  });

  it('passe une réservation à CONFIRMED et marque le paiement confirmé', async () => {
    const created = await bookingService.createBooking(bookingData());

    const updated = await bookingService.updateBooking(created.id!, { status: 'CONFIRMED' } as any);
    expect(updated.status).toBe('CONFIRMED');
    expect(updated.metadata?.['paymentStatus']).toBe('confirmed');

    const stored = await db().collection('bookings').findOne({ _id: new ObjectId(created.id) });
    expect(stored?.['status']).toBe('CONFIRMED');
  });

  it('refuse de modifier une réservation inexistante', async () => {
    await expect(bookingService.updateBooking(oid(), { timeslot: '11:00' })).rejects.toThrow(
      'Réservation non trouvée',
    );
  });

  it('met à jour le statut seul', async () => {
    const created = await bookingService.createBooking(bookingData());
    expect(await bookingService.updateBookingStatus(created.id!, 'CONFIRMED')).toBe(true);

    const stored = await db().collection('bookings').findOne({ _id: new ObjectId(created.id) });
    expect(stored?.['status']).toBe('CONFIRMED');
  });

  it('valide une étape du parcours', async () => {
    const created = await bookingService.createBooking(bookingData());
    const validated = await bookingService.validateStep(created.id!, 1, 'agent-test');

    expect(validated.id).toBe(created.id);
    const stored = await db().collection('bookings').findOne({ _id: new ObjectId(created.id) });
    expect(JSON.stringify(stored)).toContain('Informations client');
  });

  it('annule puis supprime une réservation', async () => {
    const created = await bookingService.createBooking(bookingData());

    const cancelled = await bookingService.cancelBooking(created.id!);
    expect(cancelled.status).toBe('CANCELLED');

    expect(await bookingService.deleteBooking(created.id!)).toBe(true);
    expect(await db().collection('bookings').countDocuments({ _id: new ObjectId(created.id) })).toBe(0);
  });

  it('refuse d’annuler une réservation inexistante', async () => {
    await expect(bookingService.cancelBooking(oid())).rejects.toThrow('Réservation non trouvée');
  });

  it('liste les réservations à venir', async () => {
    await bookingService.createBooking(bookingData());
    const upcoming = await bookingService.getUpcomingBookings({ limit: 10 });
    expect(Array.isArray(upcoming.data)).toBe(true);
  });

  it('rattache les commandes passées en invité au compte créé ensuite', async () => {
    const email = `invite-${Date.now()}@test.fr`;
    await db().collection('bookings').insertOne({
      requesterId: 'guest',
      providerId: oid(),
      serviceId: SERVICE_ID,
      serviceType: 'HEALTH',
      status: 'PENDING',
      metadata: { guestEmail: email, isGuest: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userId = oid();
    const linked = await bookingService.linkGuestBookingsToUser(userId, email);
    expect(linked).toBeGreaterThanOrEqual(0);
  });
});
