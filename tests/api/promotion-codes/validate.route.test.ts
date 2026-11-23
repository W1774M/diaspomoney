/**
 * POST /api/promotion-codes/validate
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuth, findOne } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  findOne: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/models/PromotionCode', () => ({
  default: { findOne },
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { POST } from '@/app/api/promotion-codes/validate/route';

const past = new Date(Date.now() - 86_400_000);
const future = new Date(Date.now() + 7 * 86_400_000);
const farPast = new Date(Date.now() - 30 * 86_400_000);

function makeCode(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'promo-1' },
    label: 'SAVE20',
    percentage: 20,
    status: 'valid',
    validFrom: past,
    validUntil: future,
    usageCount: 0,
    maxUsage: null,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/promotion-codes/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/promotion-codes/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
  });

  it('répond success:false si le code est introuvable', async () => {
    findOne.mockResolvedValue(null);
    const res = await post({ label: 'UNKNOWN' });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: false, valid: false });
  });

  it('refuse un code au statut invalide', async () => {
    findOne.mockResolvedValue(makeCode({ status: 'invalid' }));
    const res = await post({ label: 'save20' });
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.error).toMatch(/plus valide/i);
  });

  it('refuse un code pas encore actif', async () => {
    findOne.mockResolvedValue(
      makeCode({
        validFrom: future,
        validUntil: new Date(Date.now() + 14 * 86_400_000),
      }),
    );
    const body = await (await post({ label: 'SAVE20' })).json();
    expect(body.valid).toBe(false);
    expect(body.error).toMatch(/pas encore actif/i);
  });

  it('marque comme expired un code dépassé et le persiste', async () => {
    const code = makeCode({ validFrom: farPast, validUntil: past });
    findOne.mockResolvedValue(code);

    const body = await (await post({ label: 'SAVE20' })).json();
    expect(body.valid).toBe(false);
    expect(code.status).toBe('expired');
    expect(code.save).toHaveBeenCalled();
    expect(body.code.status).toBe('expired');
  });

  it('refuse un code à usage maximum atteint', async () => {
    findOne.mockResolvedValue(makeCode({ maxUsage: 2, usageCount: 2 }));
    const body = await (await post({ label: 'SAVE20' })).json();
    expect(body.valid).toBe(false);
    expect(body.error).toMatch(/maximum/i);
  });

  it('valide un code et calcule la remise', async () => {
    findOne.mockResolvedValue(makeCode());
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });

    const res = await post({ label: ' save20 ', amount: 100 });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(findOne).toHaveBeenCalledWith({ label: 'SAVE20' });
    expect(body).toMatchObject({
      success: true,
      valid: true,
      discount: { percentage: 20, amount: 20, finalAmount: 80 },
    });
  });

  it('répond 400 si le corps est invalide', async () => {
    const res = await post({ label: 'ab' });
    expect(res.status).toBe(400);
  });
});
