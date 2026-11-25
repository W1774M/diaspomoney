import { describe, expect, it } from 'vitest';

import { isProviderUserId } from '@/lib/bookings/provider-id';

describe('isProviderUserId', () => {
  it('seul un ObjectId désigne un prestataire', () => {
    expect(isProviderUserId('6b0300000000000000000001')).toBe(true);
    expect(isProviderUserId('6B0300000000000000000001')).toBe(true);
    for (const v of ['', 'consultation-medical', 'admin-draft', '6b03', 'g'.repeat(24), null, undefined, 42]) {
      expect(isProviderUserId(v)).toBe(false);
    }
  });
});
