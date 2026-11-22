/**
 * Utilitaires d'affichage : réservations (libellés, numéro, progression), utilisateurs
 * (couleurs, icônes, dates) et cliniques partenaires.
 */
import { isValidElement } from 'react';
import { describe, expect, it } from 'vitest';

import { getHealthClinicById, HEALTH_CLINICS } from '@/lib/clinics';
import { calculateIsProgressComplete, formatReservationNumber, getServiceTypeLabel } from '@/lib/utils/booking.utils';
import { formatUserDate, getRoleColor, getRoleIcon, getStatusColor } from '@/lib/utils/user-utils';

describe('booking.utils', () => {
  it('traduit les types de service', () => {
    expect(['HEALTH', 'BTP', 'EDUCATION', 'LEGAL', 'FINANCE', 'TECHNOLOGY'].map((t) => getServiceTypeLabel(t as never)))
      .toEqual(['Santé', 'Immobilier', 'Éducation', 'Juridique', 'Finance', 'Technologie']);
    expect(getServiceTypeLabel('AUTRE' as never)).toBe('AUTRE');
  });

  it('affiche le numéro de réservation enregistré tel quel (celui des e-mails)', () => {
    const date = new Date('2026-11-22T10:00:00Z');
    for (const n of ['RES-2026-0007', 'RES-2026-123456-ABCD', 'RES-2026-11-0042', 'RES-1795360000000-X1Y2Z3']) {
      expect(formatReservationNumber(n, date, '6b03aaaa0000000000001234')).toBe(n);
    }
    expect(formatReservationNumber('  RES-2026-0007 ', date, 'x')).toBe('RES-2026-0007');
  });

  it('dérive un numéro de la date et de l’identifiant à défaut', () => {
    const date = new Date(2026, 10, 22);
    expect(formatReservationNumber(undefined, date, '6b03aaaa00000000000ab12c')).toBe('RES-2026-11-B12C');
    expect(formatReservationNumber('  ', date, 'abcd')).toBe('RES-2026-11-ABCD');
  });

  it('considère la progression complète si le paiement est confirmé ou les 4 étapes faites', () => {
    const b = (metadata: Record<string, unknown>) => ({ metadata }) as never;
    expect(calculateIsProgressComplete(null)).toBe(false);
    expect(calculateIsProgressComplete({} as never)).toBe(false);
    for (const s of ['confirmed', 'completed', 'succeeded']) expect(calculateIsProgressComplete(b({ paymentStatus: s }))).toBe(true);
    expect(calculateIsProgressComplete(b({ currentStep: 3 }))).toBe(false);
    expect(calculateIsProgressComplete(b({ currentStep: 4, progressHistory: [{ step: 4, completed: true }] }))).toBe(true);
    expect(calculateIsProgressComplete(b({ currentStep: 4, progressHistory: [1, 2, 3, 4].map((step) => ({ step, completed: step !== 4 })) }))).toBe(false);
    expect(calculateIsProgressComplete(b({ currentStep: 4 }))).toBe(false);
  });
});

describe('user-utils', () => {
  it('donne une couleur par rôle et par statut', () => {
    expect(getRoleColor('ADMIN')).toContain('red');
    expect(getRoleColor('SUPERADMIN')).toContain('red');
    expect(getRoleColor('CSM')).toContain('purple');
    expect(getRoleColor('PROVIDER')).toContain('hsl(25,100%,53%)');
    expect(getRoleColor('CUSTOMER')).toContain('blue');
    expect(getRoleColor('X')).toContain('gray');
    expect(['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'X'].map(getStatusColor))
      .toEqual(['bg-green-100 text-green-800', 'bg-red-100 text-red-800', 'bg-yellow-100 text-yellow-800', 'bg-gray-100 text-gray-800', 'bg-gray-100 text-gray-800']);
  });

  it('donne une icône par rôle', () => {
    const name = (role: string) => {
      const el = getRoleIcon(role) as { type: { displayName?: string; render?: { displayName?: string } } };
      expect(isValidElement(el)).toBe(true);
      return el.type;
    };
    expect(name('PROVIDER')).not.toBe(name('CUSTOMER'));
    expect(name('ADMIN')).toBe(name('CUSTOMER'));
    expect(name('X')).toBe(name('CUSTOMER'));
  });

  it('formate une date en français, depuis un objet ou une chaîne', () => {
    const d = new Date(2026, 10, 22, 9, 5);
    expect(formatUserDate(d)).toMatch(/^22\/11\/2026\D+09:05$/);
    expect(formatUserDate(d.toISOString())).toBe(formatUserDate(d));
  });
});

describe('clinics', () => {
  it('retrouve une clinique par identifiant', () => {
    expect(getHealthClinicById('clinique-de-deido')).toMatchObject({ name: 'Clinique de Deido', country: 'CM' });
    expect(getHealthClinicById('inconnue')).toBeNull();
    expect(getHealthClinicById(null)).toBeNull();
    expect(getHealthClinicById(undefined)).toBeNull();
  });

  it('a des identifiants uniques et des données complètes', () => {
    expect(new Set(HEALTH_CLINICS.map((c) => c.id)).size).toBe(HEALTH_CLINICS.length);
    for (const c of HEALTH_CLINICS) {
      expect(c.image).toMatch(/^\/img\//);
      expect(c.country).toMatch(/^[A-Z]{2}$/);
      expect(c.specialties.length).toBeGreaterThan(0);
    }
  });
});
