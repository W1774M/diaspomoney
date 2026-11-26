/**
 * PATCH/DELETE /api/promotion-codes/[id]
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiErrors } from '@/lib/api/error-handler';
import { ROLES } from '@/lib/constants';

const { requireApiRoles, findById, findOne, findByIdAndDelete } = vi.hoisted(() => ({
  requireApiRoles: vi.fn(),
  findById: vi.fn(),
  findOne: vi.fn(),
  findByIdAndDelete: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({ requireApiRoles }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/models/PromotionCode', () => ({
  default: { findById, findOne, findByIdAndDelete },
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { PATCH, DELETE } from '@/app/api/promotion-codes/[id]/route';

const ID = '665f1c2b9b1e8a0012345678';
const future = new Date(Date.now() + 7 * 86_400_000);
const past = new Date(Date.now() - 7 * 86_400_000);

const adminSession = {
  user: { id: 'admin-1', roles: [ROLES.ADMIN] },
  roles: [ROLES.ADMIN],
};

function makeCode(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => ID },
    label: 'OLD10',
    percentage: 10,
    validFrom: past,
    validUntil: future,
    status: 'valid',
    usageCount: 0,
    maxUsage: null,
    createdAt: past,
    updatedAt: past,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function patch(id: string, body: unknown) {
  return PATCH(
    new NextRequest(`http://localhost/api/promotion-codes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

function del(id: string) {
  return DELETE(
    new NextRequest(`http://localhost/api/promotion-codes/${id}`, { method: 'DELETE' }),
    { params: Promise.resolve({ id }) },
  );
}

describe('PATCH /api/promotion-codes/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiRoles.mockResolvedValue(adminSession);
    findOne.mockResolvedValue(null);
  });

  it('refuse sans rôle admin', async () => {
    requireApiRoles.mockRejectedValue(ApiErrors.FORBIDDEN);
    expect((await patch(ID, { percentage: 20 })).status).toBe(403);
  });

  it('répond 404 si le code est introuvable', async () => {
    findById.mockResolvedValue(null);
    expect((await patch(ID, { percentage: 20 })).status).toBe(404);
  });

  it('met à jour pourcentage, statut et maxUsage', async () => {
    const code = makeCode();
    findById.mockResolvedValue(code);

    const res = await patch(ID, {
      percentage: 25,
      status: 'invalid',
      maxUsage: 3,
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(code.percentage).toBe(25);
    expect(code.status).toBe('invalid');
    expect(code.maxUsage).toBe(3);
    expect(code.save).toHaveBeenCalled();
    expect(body.code.percentage).toBe(25);
  });

  it('répond 409 si le nouveau label existe déjà', async () => {
    const code = makeCode();
    findById.mockResolvedValue(code);
    findOne.mockResolvedValue({ _id: 'other' });

    const res = await patch(ID, { label: 'taken' });
    expect(res.status).toBe(409);
    expect(code.save).not.toHaveBeenCalled();
  });

  it('répond 400 si validUntil <= validFrom après update', async () => {
    const code = makeCode();
    findById.mockResolvedValue(code);

    const res = await patch(ID, {
      validFrom: future.toISOString(),
      validUntil: past.toISOString(),
    });
    expect(res.status).toBe(400);
    expect(code.save).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/promotion-codes/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiRoles.mockResolvedValue(adminSession);
  });

  it('supprime un code existant', async () => {
    findByIdAndDelete.mockResolvedValue({ _id: ID });
    const res = await del(ID);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(findByIdAndDelete).toHaveBeenCalledWith(ID);
  });

  it('répond 404 si le code n’existe pas', async () => {
    findByIdAndDelete.mockResolvedValue(null);
    expect((await del(ID)).status).toBe(404);
  });
});
