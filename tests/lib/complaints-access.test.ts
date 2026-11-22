import { describe, expect, it } from 'vitest';

import {
  canAccessComplaints,
  getComplaintsScope,
  isComplaintsAdmin,
} from '@/lib/complaints/access';

describe('règles d’accès aux réclamations', () => {
  it.each([
    [['CUSTOMER'], true],
    [['PROVIDER'], true],
    [['CSM'], true],
    [['ADMIN'], true],
    [['SUPERADMIN'], true],
    [['BENEFICIARY'], false],
    [[], false],
  ])('canAccessComplaints(%j) = %s', (roles, expected) => {
    expect(canAccessComplaints(roles)).toBe(expected);
  });

  it('ADMIN et SUPERADMIN voient toutes les réclamations, même s’ils sont aussi CSM', () => {
    expect(getComplaintsScope(['ADMIN'])).toBe('all');
    expect(getComplaintsScope(['SUPERADMIN'])).toBe('all');
    expect(getComplaintsScope(['CUSTOMER', 'ADMIN', 'CSM'])).toBe('all');
    expect(isComplaintsAdmin(['CUSTOMER', 'ADMIN'])).toBe(true);
  });

  it('CSM : portefeuille ; client et prestataire : leurs réclamations', () => {
    expect(getComplaintsScope(['CSM'])).toBe('csm-portfolio');
    expect(getComplaintsScope(['CUSTOMER'])).toBe('own');
    expect(getComplaintsScope(['PROVIDER'])).toBe('own');
  });
});
