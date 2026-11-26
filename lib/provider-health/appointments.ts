/**
 * Vues « Mes patients » / « Mes rendez-vous » d'un prestataire santé.
 *
 * Il n'existe pas de collection « patients » : un patient est la personne
 * soignée d'une réservation (recipient, sinon beneficiary). On les dérive donc
 * des réservations attribuées au prestataire. Fonctions pures, testées sans
 * réseau ni base.
 */

import { BOOKING_STATUSES } from '@/lib/constants';
import type { BookingResponse } from '@/lib/mappers/booking.mapper';

export interface PatientIdentity {
  /** Clé de regroupement stable (nom + téléphone normalisés). */
  key: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email?: string;
}

export interface PatientSummary extends PatientIdentity {
  /** Rendez-vous non annulés (passés et à venir). */
  appointmentCount: number;
  /** Dernier rendez-vous passé non annulé (ISO). */
  lastVisit?: string;
  /** Prochain rendez-vous à venir en attente ou confirmé (ISO). */
  nextAppointment?: string;
  /** Toutes les réservations du patient, plus récentes d'abord. */
  bookings: BookingResponse[];
}

export interface AppointmentBuckets {
  /** Aujourd'hui et plus tard, en attente ou confirmés — du plus proche au plus lointain. */
  upcoming: BookingResponse[];
  /** Passés, terminés ou annulés — du plus récent au plus ancien. */
  past: BookingResponse[];
}

const ACTIVE_STATUSES: ReadonlySet<string> = new Set([
  BOOKING_STATUSES.PENDING,
  BOOKING_STATUSES.CONFIRMED,
]);

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const normalizePhone = (value: string): string => value.replace(/[^\d+]/g, '');

/** Un brouillon n'est pas encore un rendez-vous : il est ignoré partout. */
export function isRealAppointment(booking: BookingResponse): boolean {
  return booking.status !== BOOKING_STATUSES.DRAFT;
}

/** Date du rendez-vous en ms, ou null si absente / invalide. */
export function appointmentTime(booking: BookingResponse): number | null {
  if (!booking.appointmentDate) return null;
  const t = new Date(booking.appointmentDate).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Identité du patient d'une réservation, ou null si aucune n'est renseignée. */
export function getPatient(booking: BookingResponse): PatientIdentity | null {
  const person = booking.recipient ?? booking.beneficiary;
  if (!person) return null;

  const firstName = person.firstName?.trim() ?? '';
  const lastName = person.lastName?.trim() ?? '';
  const phone = person.phone?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  if (!fullName && !phone) return null;

  const email = person.email?.trim();
  return {
    key: `${normalize(fullName)}|${normalizePhone(phone)}`,
    firstName,
    lastName,
    fullName: fullName || phone,
    phone,
    ...(email ? { email } : {}),
  };
}

const startOfDay = (now: Date): number =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

/**
 * Répartit les rendez-vous entre « à venir » et « passés ».
 * Un rendez-vous du jour reste « à venir » toute la journée ; sans date, il
 * est à venir s'il est encore actif (à planifier).
 */
export function splitAppointments(
  bookings: BookingResponse[],
  now: Date = new Date(),
): AppointmentBuckets {
  const dayStart = startOfDay(now);
  const upcoming: BookingResponse[] = [];
  const past: BookingResponse[] = [];

  for (const booking of bookings) {
    if (!isRealAppointment(booking)) continue;
    const t = appointmentTime(booking);
    const active = ACTIVE_STATUSES.has(booking.status);
    if (active && (t === null || t >= dayStart)) upcoming.push(booking);
    else past.push(booking);
  }

  const asc = (a: BookingResponse, b: BookingResponse) =>
    (appointmentTime(a) ?? Infinity) - (appointmentTime(b) ?? Infinity);
  upcoming.sort(asc);
  past.sort((a, b) => (appointmentTime(b) ?? 0) - (appointmentTime(a) ?? 0));

  return { upcoming, past };
}

/** Regroupe les réservations par patient, triés par nom. */
export function buildPatients(
  bookings: BookingResponse[],
  now: Date = new Date(),
): PatientSummary[] {
  const nowMs = now.getTime();
  const byKey = new Map<string, PatientSummary>();

  for (const booking of bookings) {
    if (!isRealAppointment(booking)) continue;
    const identity = getPatient(booking);
    if (!identity) continue;

    let patient = byKey.get(identity.key);
    if (!patient) {
      patient = { ...identity, appointmentCount: 0, bookings: [] };
      byKey.set(identity.key, patient);
    } else if (!patient.email && identity.email) {
      patient.email = identity.email;
    }
    patient.bookings.push(booking);

    if (booking.status === BOOKING_STATUSES.CANCELLED) continue;
    patient.appointmentCount += 1;

    const t = appointmentTime(booking);
    if (t === null || !booking.appointmentDate) continue;
    if (t < nowMs) {
      if (!patient.lastVisit || t > new Date(patient.lastVisit).getTime()) {
        patient.lastVisit = booking.appointmentDate;
      }
    } else if (ACTIVE_STATUSES.has(booking.status)) {
      if (
        !patient.nextAppointment ||
        t < new Date(patient.nextAppointment).getTime()
      ) {
        patient.nextAppointment = booking.appointmentDate;
      }
    }
  }

  const patients = [...byKey.values()];
  for (const p of patients) {
    p.bookings.sort(
      (a, b) => (appointmentTime(b) ?? 0) - (appointmentTime(a) ?? 0),
    );
  }
  return patients.sort((a, b) =>
    a.fullName.localeCompare(b.fullName, 'fr', { sensitivity: 'base' }),
  );
}

/** Filtre plein texte (nom, téléphone, e-mail), insensible aux accents. */
export function matchesPatientQuery(
  patient: PatientIdentity,
  query: string,
): boolean {
  const q = normalize(query);
  if (!q) return true;
  const qPhone = normalizePhone(query);
  return (
    normalize(patient.fullName).includes(q) ||
    normalize(patient.email ?? '').includes(q) ||
    (qPhone.length >= 3 && normalizePhone(patient.phone).includes(qPhone))
  );
}

/** Libellé du mode de consultation. */
export function consultationModeLabel(
  mode: BookingResponse['consultationMode'] | string | undefined,
): string | null {
  switch (String(mode ?? '').toLowerCase()) {
    case 'video':
    case 'telemedicine':
      return 'Téléconsultation';
    case 'cabinet':
    case 'in_person':
      return 'Au cabinet';
    case 'hybrid':
      return 'Hybride';
    default:
      return null;
  }
}
