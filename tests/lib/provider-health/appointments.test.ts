import { describe, expect, it } from 'vitest';

import {
  buildPatients,
  consultationModeLabel,
  getPatient,
  matchesPatientQuery,
  splitAppointments,
} from '@/lib/provider-health/appointments';

const NOW = new Date(2026, 10, 26, 12, 0, 0); // 26/11/2026 12:00 locale
const at = (day: number, hour = 10) =>
  new Date(2026, 10, day, hour, 0, 0).toISOString();

let seq = 0;
const booking = (over: Record<string, any> = {}) =>
  ({
    id: `b${++seq}`,
    _id: `b${seq}`,
    reservationNumber: `R${seq}`,
    requesterId: 'client-1',
    providerId: 'prov-1',
    serviceId: 's1',
    serviceType: 'HEALTH',
    status: 'CONFIRMED',
    createdAt: at(1),
    updatedAt: at(1),
    recipient: { firstName: 'Awa', lastName: 'Diallo', phone: '+221 77 000 00 00' },
    ...over,
  }) as any;

describe('getPatient', () => {
  it('prend le recipient, sinon le beneficiary', () => {
    expect(getPatient(booking())?.fullName).toBe('Awa Diallo');
    const b = booking({
      recipient: undefined,
      beneficiary: { firstName: 'Moussa', lastName: 'Ba', phone: '1' },
    });
    expect(getPatient(b)?.fullName).toBe('Moussa Ba');
  });

  it('renvoie null sans identité exploitable', () => {
    expect(getPatient(booking({ recipient: undefined }))).toBeNull();
    expect(
      getPatient(booking({ recipient: { firstName: '', lastName: '', phone: '' } })),
    ).toBeNull();
  });

  it('regroupe malgré casse, accents et format du téléphone', () => {
    const a = getPatient(booking());
    const b = getPatient(
      booking({ recipient: { firstName: 'AWA', lastName: ' diallo ', phone: '+22177 0000000' } }),
    );
    expect(a?.key).toBe(b?.key);
  });
});

describe('splitAppointments', () => {
  it('sépare à venir (asc) et passés (desc), ignore les brouillons', () => {
    const future2 = booking({ appointmentDate: at(30) });
    const future1 = booking({ appointmentDate: at(28), status: 'PENDING' });
    const todayMorning = booking({ appointmentDate: at(26, 8) });
    const past = booking({ appointmentDate: at(20), status: 'FINISHED' });
    const cancelledFuture = booking({ appointmentDate: at(29), status: 'CANCELLED' });
    const draft = booking({ appointmentDate: at(27), status: 'DRAFT' });
    const undated = booking({ appointmentDate: undefined });

    const { upcoming, past: done } = splitAppointments(
      [future2, past, future1, cancelledFuture, draft, todayMorning, undated],
      NOW,
    );

    expect(upcoming).toEqual([todayMorning, future1, future2, undated]);
    expect(done).toEqual([cancelledFuture, past]);
  });

  it('un rendez-vous confirmé mais daté d’hier est passé', () => {
    const yesterday = booking({ appointmentDate: at(25) });
    expect(splitAppointments([yesterday], NOW).past).toEqual([yesterday]);
  });
});

describe('buildPatients', () => {
  it('agrège les rendez-vous par patient avec dernière visite et prochain RDV', () => {
    const awa = { firstName: 'Awa', lastName: 'Diallo', phone: '+221770000000' };
    const ba = { firstName: 'Élodie', lastName: 'Ba', phone: '06 00', email: 'e@x.fr' };
    const patients = buildPatients(
      [
        booking({ recipient: awa, appointmentDate: at(10), status: 'FINISHED' }),
        booking({ recipient: awa, appointmentDate: at(20), status: 'FINISHED' }),
        booking({ recipient: awa, appointmentDate: at(29) }),
        booking({ recipient: awa, appointmentDate: at(27), status: 'PENDING' }),
        booking({ recipient: awa, appointmentDate: at(28), status: 'CANCELLED' }),
        booking({ recipient: awa, appointmentDate: at(5), status: 'DRAFT' }),
        booking({ recipient: ba, appointmentDate: at(15), status: 'FINISHED' }),
        booking({ recipient: undefined }),
      ],
      NOW,
    );

    expect(patients.map((p) => p.fullName)).toEqual(['Awa Diallo', 'Élodie Ba']);
    const [a, e] = patients;
    expect(a?.appointmentCount).toBe(4);
    expect(a?.bookings).toHaveLength(5); // brouillon exclu, annulé gardé
    expect(a?.lastVisit).toBe(at(20));
    expect(a?.nextAppointment).toBe(at(27));
    expect(e?.email).toBe('e@x.fr');
    expect(e?.nextAppointment).toBeUndefined();
  });
});

describe('matchesPatientQuery', () => {
  const p = getPatient(
    booking({ recipient: { firstName: 'Élodie', lastName: 'Ba', phone: '+33 6 12 34', email: 'elo@x.fr' } }),
  )!;

  it('cherche sur nom (sans accents), e-mail et téléphone', () => {
    expect(matchesPatientQuery(p, '')).toBe(true);
    expect(matchesPatientQuery(p, 'elodie')).toBe(true);
    expect(matchesPatientQuery(p, 'ELO@')).toBe(true);
    expect(matchesPatientQuery(p, '61234')).toBe(true);
    expect(matchesPatientQuery(p, 'diallo')).toBe(false);
  });
});

describe('consultationModeLabel', () => {
  it('traduit les modes connus', () => {
    expect(consultationModeLabel('video')).toBe('Téléconsultation');
    expect(consultationModeLabel('IN_PERSON')).toBe('Au cabinet');
    expect(consultationModeLabel(undefined)).toBeNull();
  });
});
