import { describe, expect, it } from 'vitest';

import * as b from '@/lib/bookings/utils';

const DAY = 86_400_000;
const booking = (over: Record<string, any> = {}) =>
  ({
    id: 'b1',
    requesterId: 'client-1',
    providerId: 'prov-1',
    serviceType: 'HEALTH',
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
    appointmentDate: new Date(Date.now() + 5 * DAY).toISOString(),
    metadata: {},
    ...over,
  }) as any;

describe('statuts de réservation', () => {
  it('donne une couleur et un libellé par statut, insensibles à la casse', () => {
    expect(b.getStatusColor('confirmed')).toContain('green');
    expect(b.getStatusColor('PENDING')).toContain('yellow');
    expect(b.getStatusColor('CANCELLED')).toContain('red');
    expect(b.getStatusColor('FINISHED')).toContain('blue');
    expect(b.getStatusColor('DRAFT')).toContain('gray');
    expect(b.getStatusColor('???')).toContain('gray');

    expect(b.getStatusDisplay('confirmed')).toBe('Confirmé');
    expect(b.getStatusDisplay('FINISHED')).toBe('Terminé');
    expect(b.getStatusDisplay('INCONNU')).toBe('INCONNU');
  });

  it('gère les statuts de paiement, y compris les valeurs stockées en minuscules', () => {
    expect(b.getPaymentStatusColor('')).toContain('gray');
    expect(b.getPaymentStatusColor('COMPLETED')).toContain('green');
    expect(b.getPaymentStatusColor('confirmed')).toContain('green');
    expect(b.getPaymentStatusColor('REFUNDED')).toContain('purple');
    expect(b.getPaymentStatusColor('processing')).toContain('blue');
    expect(b.getPaymentStatusColor('failed')).toContain('red');

    expect(b.getPaymentStatusDisplay('')).toBe('Inconnu');
    expect(b.getPaymentStatusDisplay('PENDING')).toBe('En attente');
    expect(b.getPaymentStatusDisplay('confirmed')).toBe('Complété');
    expect(b.getPaymentStatusDisplay('autre')).toBe('autre');
  });
});

describe('montant d’une réservation', () => {
  it('prend le total, sinon le montant, en acceptant les chaînes « 19,50 € »', () => {
    expect(b.formatBookingAmount(booking({ metadata: { totalAmount: 49 } }))).toBe('49.00 €');
    expect(b.formatBookingAmount(booking({ metadata: { totalAmount: '19,50 €' } }))).toBe('19.50 €');
    expect(b.formatBookingAmount(booking({ metadata: { amount: 29 } }))).toBe('29.00 €');
    expect(b.formatBookingAmount(booking({ metadata: { amount: '12.5' } }))).toBe('12.50 €');
  });

  it('sinon calcule prix de base + options − remise', () => {
    expect(
      b.formatBookingAmount(
        booking({ metadata: { basePrice: 19, additionalOptions: [{ price: 5 }, { price: '3' }], discountAmount: 2 } }),
      ),
    ).toBe('25.00 €');
    expect(
      b.formatBookingAmount(booking({ metadata: { servicePrice: '30', additionalOptions: '[{"price":10}]', discountAmount: '5' } })),
    ).toBe('35.00 €');
    expect(b.formatBookingAmount(booking({ metadata: { basePrice: '20', optionsPrice: 4 } }))).toBe('24.00 €');
    expect(b.formatBookingAmount(booking({ metadata: { additionalOptions: '{json cassé' } }))).toBe('0.00 €');
  });
});

describe('noms et dates', () => {
  it('affiche le demandeur, le prestataire et la spécialité', () => {
    expect(b.getRequesterName(booking({ metadata: { requesterInfo: { firstName: 'Awa', lastName: 'Diallo' } } }))).toBe('Awa Diallo');
    expect(b.getRequesterName(booking())).toBe('client-1');
    expect(b.getRequesterName(booking({ requesterId: '' }))).toBe('N/A');
    expect(b.getProviderName(booking({ providerId: '' }))).toBe('N/A');
    expect(b.getProviderSpecialties(booking())).toBe('HEALTH');
  });

  it('formate la date et l’heure, avec repli sur la date de création', () => {
    const at = new Date(2026, 10, 21, 9, 30);
    expect(b.formatBookingDate(booking({ appointmentDate: at.toISOString() }))).toBe('21/11/2026');
    expect(b.formatBookingTime(booking({ appointmentDate: at.toISOString() }))).toBe('09:30');
    expect(b.formatBookingDate(booking({ appointmentDate: undefined, createdAt: at.toISOString() }))).toBe('21/11/2026');
  });

  it('situe une réservation dans le temps et en mesure l’urgence', () => {
    expect(b.isUpcoming(booking())).toBe(true);
    expect(b.isUpcoming(booking({ status: 'PENDING' }))).toBe(false);
    expect(b.isPast(booking({ appointmentDate: new Date(Date.now() - DAY).toISOString() }))).toBe(true);
    expect(b.isToday(booking({ appointmentDate: new Date().toISOString() }))).toBe(true);

    expect(b.getUrgencyLevel(booking({ appointmentDate: new Date(Date.now() + 3_600_000).toISOString() }))).toBe('high');
    expect(b.getUrgencyLevel(booking({ appointmentDate: new Date(Date.now() + 2 * DAY).toISOString() }))).toBe('medium');
    expect(b.getUrgencyLevel(booking())).toBe('low');
  });
});
