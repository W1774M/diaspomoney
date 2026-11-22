import { describe, expect, it } from 'vitest';

import {
  BannerMessageCreateSchema,
  isSafeHref,
  isScheduledNow,
  pickCurrentAnnouncement,
  type HomeAnnouncement,
} from '../../lib/home-content';

const base = { isActive: true, startsAt: null, endsAt: null };

describe('isSafeHref', () => {
  it('accepte les liens internes et https', () => {
    expect(isSafeHref('/services/health')).toBe(true);
    expect(isSafeHref('https://example.com')).toBe(true);
  });

  it('refuse javascript:, http et les liens protocol-relative', () => {
    expect(isSafeHref('javascript:alert(1)')).toBe(false);
    expect(isSafeHref('http://example.com')).toBe(false);
    expect(isSafeHref('//evil.com')).toBe(false);
  });
});

describe('isScheduledNow', () => {
  const now = Date.parse('2026-06-15T12:00:00Z');

  it('respecte l’activation et la période de diffusion', () => {
    expect(isScheduledNow(base, now)).toBe(true);
    expect(isScheduledNow({ ...base, isActive: false }, now)).toBe(false);
    expect(isScheduledNow({ ...base, startsAt: '2026-06-16T00:00:00Z' }, now)).toBe(false);
    expect(isScheduledNow({ ...base, endsAt: '2026-06-15T11:00:00Z' }, now)).toBe(false);
  });
});

describe('pickCurrentAnnouncement', () => {
  const make = (id: string, extra: Partial<HomeAnnouncement>): HomeAnnouncement => ({
    id,
    title: id,
    message: '',
    imageUrl: '/a.png',
    imageAlt: id,
    href: '',
    ctaLabel: '',
    frequencyHours: 1,
    version: id,
    ...base,
    ...extra,
  });

  it('choisit l’annonce en cours la plus récemment démarrée', () => {
    const now = Date.parse('2026-06-15T12:00:00Z');
    const result = pickCurrentAnnouncement(
      [
        make('old', { startsAt: '2026-06-01T00:00:00Z' }),
        make('new', { startsAt: '2026-06-10T00:00:00Z' }),
        make('future', { startsAt: '2026-07-01T00:00:00Z' }),
        make('off', { isActive: false, startsAt: '2026-06-14T00:00:00Z' }),
      ],
      now,
    );
    expect(result?.id).toBe('new');
  });
});

describe('BannerMessageCreateSchema', () => {
  it('exige une adresse pour un lien classique', () => {
    const result = BannerMessageCreateSchema.safeParse({
      textBefore: 'Promo',
      linkType: 'url',
      linkLabel: 'voir',
    });
    expect(result.success).toBe(false);
  });

  it('accepte un lien vers l’annonce sans adresse', () => {
    const result = BannerMessageCreateSchema.safeParse({
      textBefore: 'Promo',
      linkType: 'announcement',
      linkLabel: 'voir',
    });
    expect(result.success).toBe(true);
  });
});
