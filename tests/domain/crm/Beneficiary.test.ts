import { describe, expect, it } from 'vitest';
import { Beneficiary, Complaint, Quote } from '@/domain/crm';

describe('CRM domain', () => {
  it('Beneficiary ownership', () => {
    const b = Beneficiary.create({
      ownerClientId: 'client-1',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+33600000000',
    });
    expect(() => b.assertOwnedBy('other')).toThrow();
    expect(() => b.assertOwnedBy('client-1')).not.toThrow();
  });

  it('Complaint exige bookingId', () => {
    expect(() =>
      Complaint.open({
        clientId: 'c1',
        bookingId: '',
        type: 'QUALITY',
      }),
    ).toThrow(/bookingId/);

    const c = Complaint.open({
      clientId: 'c1',
      bookingId: 'booking-1',
      type: 'QUALITY',
    });
    c.transitionTo('IN_PROGRESS');
    expect(c.currentStatus).toBe('IN_PROGRESS');
  });

  it('Complaint.rehydrate mappe statuts lowercase + transitionTo', () => {
    const c = Complaint.rehydrate({
      clientId: 'c1',
      bookingId: 'booking-1',
      type: 'QUALITY',
      status: 'open',
    });
    expect(c.currentStatus).toBe('OPEN');
    c.transitionTo('IN_PROGRESS');
    expect(c.currentStatus).toBe('IN_PROGRESS');

    expect(Complaint.mapPersistenceStatus('in_progress')).toBe('IN_PROGRESS');
    expect(Complaint.mapPersistenceStatus('resolved')).toBe('RESOLVED');
  });

  it('Quote BTP PENDING → APPROVED', () => {
    const q = Quote.create({
      kind: 'BTP',
      contactEmail: 'a@b.com',
    });
    q.transitionTo('APPROVED');
    expect(q.currentStatus).toBe('APPROVED');
  });
});
