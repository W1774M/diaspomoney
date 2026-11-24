/**
 * GET /api/stripe/check-config
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiErrors } from '@/lib/api/error-handler';
import { ROLES } from '@/lib/constants';

const { requireApiRoles, isStripeConfigured, getStripeMode, getStripeInstance } = vi.hoisted(() => ({
  requireApiRoles: vi.fn(),
  isStripeConfigured: vi.fn(),
  getStripeMode: vi.fn(),
  getStripeInstance: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({ requireApiRoles }));
vi.mock('@/lib/stripe-config', () => ({
  isStripeConfigured,
  getStripeMode,
  getStripeInstance,
}));

import { GET } from '@/app/api/stripe/check-config/route';

describe('GET /api/stripe/check-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiRoles.mockResolvedValue({
      user: { id: 'admin-1', roles: [ROLES.ADMIN] },
    });
    isStripeConfigured.mockReturnValue(false);
    getStripeMode.mockReturnValue('test');
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', '');
  });

  it('refuse sans rôle admin', async () => {
    requireApiRoles.mockRejectedValue(ApiErrors.FORBIDDEN);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('signale les clés absentes', async () => {
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.config.secretKey.defined).toBe(false);
    expect(body.recommendations.some((r: string) => r.includes('STRIPE_SECRET_KEY'))).toBe(true);
  });

  it('teste la connexion Stripe en mode test', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_abcdefghij');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_abcdefghij');
    isStripeConfigured.mockReturnValue(true);
    getStripeMode.mockReturnValue('test');
    getStripeInstance.mockReturnValue({
      paymentIntents: { list: vi.fn().mockResolvedValue({ data: [] }) },
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.config.configured).toBe(true);
    expect(body.config.modesMatch).toBe(true);
    expect(body.connectionTest.success).toBe(true);
    expect(body.config.secretKey.prefix).toMatch(/^sk_test_ab/);
  });

  it('remonte un échec de connexion Stripe', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_abcdefghij');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_abcdefghij');
    isStripeConfigured.mockReturnValue(true);
    getStripeMode.mockReturnValue('test');
    getStripeInstance.mockReturnValue({
      paymentIntents: {
        list: vi.fn().mockRejectedValue(Object.assign(new Error('bad key'), { type: 'StripeAuthenticationError' })),
      },
    });

    const body = await (await GET()).json();
    expect(body.connectionTest.success).toBe(false);
    expect(body.connectionTest.type).toBe('StripeAuthenticationError');
  });
});
