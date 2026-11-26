import { describe, expect, it } from 'vitest';
import { mergeSelfServiceProviderInfo } from '@/lib/users/provider-info-self-edit';

describe('mergeSelfServiceProviderInfo', () => {
  it('conserve isVerified, rating, reviewCount et recommended existants', () => {
    const merged = mergeSelfServiceProviderInfo(
      {
        type: 'INDIVIDUAL',
        isVerified: true,
        rating: 4.5,
        reviewCount: 12,
        recommended: true,
        description: 'Ancien',
      },
      {
        type: 'INDIVIDUAL',
        isVerified: false,
        rating: 5,
        reviewCount: 999,
        recommended: false,
        description: 'Nouveau',
      },
    );

    expect(merged).toMatchObject({
      type: 'INDIVIDUAL',
      description: 'Nouveau',
      isVerified: true,
      rating: 4.5,
      reviewCount: 12,
      recommended: true,
    });
  });

  it('refuse d’inventer une vérification sur un compte sans providerInfo', () => {
    const merged = mergeSelfServiceProviderInfo(undefined, {
      type: 'INSTITUTION',
      isVerified: true,
      rating: 5,
      recommended: true,
    });

    expect(merged['isVerified']).toBe(false);
    expect(merged['rating']).toBe(0);
    expect(merged['reviewCount']).toBe(0);
    expect(merged).not.toHaveProperty('recommended');
    expect(merged['type']).toBe('INSTITUTION');
  });
});
