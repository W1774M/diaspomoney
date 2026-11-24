import { describe, expect, it } from 'vitest';
import { mapQuoteToResponse, quoteMapper } from '@/lib/mappers/quote.mapper';

describe('quoteMapper', () => {
  it('projette un devis complet et un devis minimal', () => {
    const full = mapQuoteToResponse({
      _id: { toString: () => 'q1' },
      type: 'EDUCATION',
      projectType: 'Maison',
      area: 80,
      features: ['piscine'],
      budget: 1000,
      timeline: '3 mois',
      location: { city: 'Dakar' },
      contact: { name: 'Awa', email: 'awa@example.com', phone: '+221' },
      description: 'Travaux',
      urgency: 'HIGH',
      costEstimate: 900,
      status: 'approved',
      providerId: 'p1',
      schoolId: 's1',
      studentType: 'CHILD',
      studentInfo: {
        firstName: 'Moussa',
        lastName: 'Diop',
        dateOfBirth: '2015-01-01',
        gender: 'MALE',
        nationality: 'SN',
      },
      academicInfo: { currentLevel: 'CM2', desiredProgram: 'Sciences' },
      preferences: { language: 'fr', urgency: 'LOW' },
      questions: 'Quand ?',
      metadata: { source: 'web' },
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
      updatedAt: '2026-01-03T00:00:00.000Z',
    });

    expect(full.id).toBe('q1');
    expect(full.status).toBe('APPROVED');
    expect(full.contact.phone).toBe('+221');
    expect(full.location?.country).toBe('');
    expect(full.studentInfo?.nationality).toBe('SN');
    expect(full.createdAt).toBe('2026-01-02T00:00:00.000Z');
    expect(full.updatedAt).toBe('2026-01-03T00:00:00.000Z');

    const minimal = quoteMapper.map({
      id: 'q2',
      features: [],
      studentInfo: { firstName: 'Seul' },
      status: 'UNKNOWN',
    });
    expect(minimal.type).toBe('BTP');
    expect(minimal.status).toBe('UNKNOWN');
    expect(minimal.features).toBeUndefined();
    expect(minimal.studentInfo).toBeUndefined();
    expect(minimal.contact.name).toBe('');

    const pending = mapQuoteToResponse({ status: 'pending' });
    expect(pending.status).toBe('PENDING');
    expect(pending.id).toBe('');

    const invalidDate = mapQuoteToResponse({
      createdAt: { toString: () => 'nope' } as unknown as Date,
    });
    expect(invalidDate.createdAt).toMatch(/^\d{4}-/);
  });

  it('mappe une liste', () => {
    const rows = quoteMapper.mapMany([{ id: 'a', status: 'rejected' }, { id: 'b', status: 'expired' }]);
    expect(rows.map((row) => row.status)).toEqual(['REJECTED', 'EXPIRED']);
  });
});
