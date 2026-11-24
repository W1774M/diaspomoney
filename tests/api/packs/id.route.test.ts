/**
 * PATCH/DELETE /api/packs/[id]
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES } from '@/lib/constants';

const { mockAuth, findOne, findById, deleteOne } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  findOne: vi.fn(),
  findById: vi.fn(),
  deleteOne: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/mongodb', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/models/Pack', () => ({
  default: { findOne, findById, deleteOne },
}));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { PATCH, DELETE } from '@/app/api/packs/[id]/route';

const PACK_ID = 'essentiel-sante';

function packDoc() {
  return {
    _id: 'oid1',
    id: PACK_ID,
    label: 'Essentiel',
    category: 'HEALTH',
    serviceIds: ['svc-1'],
    isActive: true,
    save: vi.fn().mockResolvedValue(undefined),
  };
}

function params(id = PACK_ID) {
  return { params: { id } };
}

function patch(body: unknown, id = PACK_ID) {
  return PATCH(
    new NextRequest(`http://localhost/api/packs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    params(id),
  );
}

function del(id = PACK_ID) {
  return DELETE(
    new NextRequest(`http://localhost/api/packs/${id}`, { method: 'DELETE' }),
    params(id),
  );
}

describe('/api/packs/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'a1', roles: [ROLES.ADMIN] },
    });
    findOne.mockResolvedValue(packDoc());
    findById.mockResolvedValue(null);
    deleteOne.mockResolvedValue({ deletedCount: 1 });
  });

  it('PATCH refuse sans auth', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await patch({ label: 'Nouveau' })).status).toBe(401);
  });

  it('PATCH refuse non-admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', roles: [ROLES.PROVIDER] } });
    expect((await patch({ label: 'Nouveau' })).status).toBe(403);
  });

  it('PATCH 404 si pack absent', async () => {
    findOne.mockResolvedValue(null);
    expect((await patch({ label: 'Nouveau' })).status).toBe(404);
  });

  it('PATCH met à jour un pack', async () => {
    const doc = packDoc();
    findOne.mockResolvedValue(doc);
    const res = await patch({ label: 'Premium Santé', isActive: false });
    expect(res.status).toBe(200);
    expect(doc.label).toBe('Premium Santé');
    expect(doc.isActive).toBe(false);
    expect(doc.save).toHaveBeenCalled();
  });

  it('DELETE réussit', async () => {
    const res = await del();
    expect(res.status).toBe(200);
    expect(deleteOne).toHaveBeenCalledWith({ _id: 'oid1' });
  });

  it('DELETE 404 si absent', async () => {
    findOne.mockResolvedValue(null);
    expect((await del()).status).toBe(404);
  });
});
