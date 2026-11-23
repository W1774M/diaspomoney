/**
 * POC Scheduling santé : host + event type + slots + booking coss.
 * Host uid fixe ; event type optionnellement fixé via COSS_HEALTH_EVENT_TYPE_ID.
 */
import { getCossClient } from '@/lib/coss/client';
import { childLogger } from '@/lib/logger';

const log = childLogger({ component: 'coss-scheduling-health-poc' });

const DEFAULT_HOST_UID = 'diaspomoney_health_poc';
const EVENT_TITLE = 'Consultation santé POC';

export type HealthSlot = {
  start: string;
  end: string;
  /** Heure locale HH:mm (Europe/Paris) pour le wizard */
  time: string;
};

function hostUid(): string {
  return process.env['COSS_HEALTH_HOST_UID'] || DEFAULT_HOST_UID;
}

function parisTimeFromIso(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export async function ensureHealthPocEventTypeId(): Promise<string> {
  const fromEnv = process.env['COSS_HEALTH_EVENT_TYPE_ID']?.trim();
  if (fromEnv) return fromEnv;

  const coss = getCossClient();
  const uid = hostUid();

  const existingHost = await coss.scheduling.hosts.get(uid);
  if (existingHost.error || !existingHost.data) {
    const created = await coss.scheduling.hosts.create({
      uid,
      name: 'DiaspoMoney Santé POC',
      email: 'health-poc@example.com',
      time_zone: 'Europe/Paris',
    });
    if (created.error || !created.data) {
      throw new Error(created.error?.message || 'Impossible de créer le host coss');
    }
    await coss.scheduling.schedules.create(uid, {
      rules: [{ days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' }],
    });
  }

  const listed = await coss.scheduling.eventTypes.list({ limit: 50 });
  const items = (listed.data as { data?: Array<{ id: string; title?: string }> } | undefined)?.data
    ?? (Array.isArray(listed.data) ? listed.data : []);
  const found = items.find((e) => e.title === EVENT_TITLE);
  if (found?.id) return found.id;

  const createdEt = await coss.scheduling.eventTypes.create({
    title: EVENT_TITLE,
    duration_minutes: 30,
    buffer_after_minutes: 10,
    hosts: [{ host: uid }],
    metadata: { poc: 'health' },
  });
  if (createdEt.error || !createdEt.data) {
    throw new Error(createdEt.error?.message || "Impossible de créer l'event type coss");
  }
  return createdEt.data.id;
}

/** Créneaux du jour (date YYYY-MM-DD, fuseau Europe/Paris). */
export async function listHealthSlotsForDate(date: string): Promise<HealthSlot[]> {
  const eventTypeId = await ensureHealthPocEventTypeId();
  const coss = getCossClient();

  // Jour civil Paris → fenêtre UTC large
  const start = new Date(`${date}T00:00:00+01:00`);
  const end = new Date(`${date}T23:59:59+01:00`);
  // En été +02:00 : on élargit d’une heure de chaque côté pour ne rien rater
  start.setUTCHours(start.getUTCHours() - 2);
  end.setUTCHours(end.getUTCHours() + 2);

  const { data, error } = await coss.scheduling.slots.list(eventTypeId, {
    start: start.toISOString(),
    end: end.toISOString(),
  });
  if (error) {
    throw new Error(error.message || 'Erreur slots coss');
  }

  const raw = (data as { data?: Array<{ start: string; end: string }> } | undefined)?.data
    ?? (Array.isArray(data) ? data : []);

  return raw
    .filter((s) => parisDateFromIso(s.start) === date)
    .map((s) => ({
      start: s.start,
      end: s.end,
      time: parisTimeFromIso(s.start),
    }));
}

function parisDateFromIso(iso: string): string {
  // en-CA → YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

export async function createHealthCossBooking(params: {
  startIso: string;
  attendee: {
    uid: string;
    name: string;
    email: string;
    timeZone?: string;
  };
}): Promise<{ id: string } | null> {
  const eventTypeId = await ensureHealthPocEventTypeId();
  const coss = getCossClient();

  const { data, error } = await coss.scheduling.bookings.create({
    event_type: eventTypeId,
    start: params.startIso,
    attendee: {
      uid: params.attendee.uid,
      name: params.attendee.name,
      email: params.attendee.email,
      time_zone: params.attendee.timeZone || 'Europe/Paris',
    },
  });

  if (error) {
    log.warn(
      { code: error.code, message: error.message },
      'coss booking create failed (local booking already created)',
    );
    return null;
  }

  return { id: data!.id };
}

/** Construit un ISO à partir de date YYYY-MM-DD + heure HH:mm (Paris). */
export function parisLocalToIso(date: string, time: string): string {
  // Approximation: on tente +01:00 puis on normalise via formatter si besoin.
  // Pour le POC, les slots renvoient déjà un `start` ISO — préférer celui-là.
  const candidate = new Date(`${date}T${time}:00+01:00`);
  return candidate.toISOString();
}
