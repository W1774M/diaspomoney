/**
 * GET/POST /api/promotion-codes
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiErrors } from '@/lib/api/error-handler';
import { ROLES } from '@/lib/constants';

const { requireApiRoles, find, findOne, create, lean } = vi.hoisted(() => {
  const lean = vi.fn();
  const sort = vi.fn(() => ({ lean }));
  const find = vi.fn(() => ({ sort }));
  return {
    requireApiRoles: vi.fn(),
    find,
    findOne: vi.fn(),
    create: vi.fn(),
    lean,
  };
});

vi.mock('@/lib/api/auth', () => ({ requireApiRoles }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/models/PromotionCode', () => ({
  default: { find, findOne, create },
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { GET, POST } from '@/app/api/promotion-codes/route';

const adminSession = {
  user: { id: 'admin-1', roles: [ROLES.ADMIN] },
  roles: [ROLES.ADMIN],
};

const future = new Date(Date.now() + 7 * 86_400_000).toISOString();
const past = new Date(Date.now() - 7 * 86_400_000).toISOString();

function getRequest(status?: string) {
  const url = status
    ? `http://localhost/api/promotion-codes?status=${status}`
    : 'http://localhost/api/promotion-codes';
  return new NextRequest(url);
}

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/promotion-codes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/promotion-codes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiRoles.mockResolvedValue(adminSession);
    lean.mockResolvedValue([]);
  });

  it('refuse sans rôle admin', async () => {
    requireApiRoles.mockRejectedValue(ApiErrors.FORBIDDEN);
    const res = await GET(getRequest());
    expect(res.status).toBe(403);
    expect(find).not.toHaveBeenCalled();
  });

  it('liste les codes et calcule expired / isValid', async () => {
    lean.mockResolvedValue([
      {
        _id: 'c1',
        label: 'OK10',
        status: 'valid',
        validFrom: past,
        validUntil: future,
        usageCount: 0,
        maxUsage: null,
      },
      {
        _id: 'c2',
        label: 'OLD',
        status: 'valid',
        validFrom: past,
        validUntil: past,
        usageCount: 0,
        maxUsage: null,
      },
      {
        _id: 'c3',
        label: 'FULL',
        status: 'valid',
        validFrom: past,
        validUntil: future,
        usageCount: 5,
        maxUsage: 5,
      },
    ]);

    const res = await GET(getRequest('valid'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(requireApiRoles).toHaveBeenCalledWith([ROLES.ADMIN, ROLES.SUPERADMIN]);
    expect(find).toHaveBeenCalledWith({ status: 'valid' });
    expect(body.codes[0].isValid).toBe(true);
    expect(body.codes[0].calculatedStatus).toBe('valid');
    expect(body.codes[1].calculatedStatus).toBe('expired');
    expect(body.codes[1].isValid).toBe(false);
    expect(body.codes[2].calculatedStatus).toBe('expired');
  });
});

describe('POST /api/promotion-codes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiRoles.mockResolvedValue(adminSession);
    findOne.mockResolvedValue(null);
    create.mockResolvedValue({
      _id: { toString: () => 'new-id' },
      label: 'PROMO20',
      percentage: 20,
      validFrom: new Date(),
      validUntil: new Date(future),
      status: 'valid',
      usageCount: 0,
      maxUsage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('crée un code avec label fourni', async () => {
    const res = await POST(
      postRequest({
        label: 'promo20',
        percentage: 20,
        validUntil: future,
        maxUsage: 10,
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'PROMO20',
        percentage: 20,
        maxUsage: 10,
        status: 'valid',
        createdBy: 'admin-1',
      }),
    );
  });

  it('génère un label si absent', async () => {
    findOne.mockResolvedValueOnce(null);
    const res = await POST(
      postRequest({
        percentage: 15,
        validUntil: future,
      }),
    );
    expect(res.status).toBe(201);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        percentage: 15,
        label: expect.stringMatching(/^[A-Z0-9]{8}$/),
      }),
    );
  });

  it('répond 409 si le label existe déjà', async () => {
    findOne.mockResolvedValue({ _id: 'existing' });
    const res = await POST(
      postRequest({
        label: 'TAKEN',
        percentage: 10,
        validUntil: future,
      }),
    );
    expect(res.status).toBe(409);
    expect(create).not.toHaveBeenCalled();
  });

  it('répond 400 si validUntil <= validFrom', async () => {
    const res = await POST(
      postRequest({
        label: 'BAD',
        percentage: 10,
        validFrom: future,
        validUntil: past,
      }),
    );
    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('répond 400 si le corps est invalide', async () => {
    const res = await POST(postRequest({ percentage: 150, validUntil: future }));
    expect(res.status).toBe(400);
  });
});
