/**
 * GET /api/auth/user-profile — profil de démonstration, mis en cache 1 s
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  childLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { GET } from '@/app/api/auth/user-profile/route';

describe('GET /api/auth/user-profile', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sert le profil puis une réponse courte pendant une seconde', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00.000Z'));

    const first = await GET();
    const profile = await first.json();
    expect(first.status).toBe(200);
    expect(profile.email).toBe('test@diaspomoney.com');
    expect(profile.roles).toEqual(['CUSTOMER']);
    expect(profile.preferences.language).toBeTruthy();

    const cached = await GET();
    expect(await cached.json()).toEqual({ cached: true });

    vi.setSystemTime(new Date('2026-06-01T12:00:01.100Z'));
    const again = await GET();
    expect((await again.json()).email).toBe('test@diaspomoney.com');
  });
});
