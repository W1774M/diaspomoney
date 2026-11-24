/**
 * PATCH/DELETE /api/presence-countries/[id]
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiErrors } from '@/lib/api/error-handler';
import { ROLES } from '@/lib/constants';

const ID = '507f1f77bcf86cd799439011';

const {
  requireApiRoles,
  toPresenceCountry,
  exists,
  findByIdAndUpdate,
  findByIdAndDelete,
  dbConnect,
} = vi.hoisted(() => ({
  requireApiRoles: vi.fn(),
  toPresenceCountry: vi.fn((doc: unknown) => doc),
  exists: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
  dbConnect: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({ requireApiRoles }));
vi.mock('@/lib/presence-countries.server', () => ({ toPresenceCountry }));
vi.mock('@/lib/mongodb', () => ({ default: dbConnect }));
vi.mock('@/models/PresenceCountry', () => ({
  default: { exists, findByIdAndUpdate, findByIdAndDelete },
}));

import { PATCH, DELETE } from '@/app/api/presence-countries/[id]/route';

const adminSession = { user: { id: 'admin-1', roles: [ROLES.ADMIN] } };
const params = { params: { id: ID } };

function patch(body: unknown) {
  return PATCH(
    new NextRequest(`http://localhost/api/presence-countries/${ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    params,
  );
}

describe('/api/presence-countries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiRoles.mockResolvedValue(adminSession);
    dbConnect.mockResolvedValue(undefined);
    exists.mockResolvedValue(null);
    findByIdAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: ID,
        iso: 'SN',
        name: 'Sénégal',
        status: 'present',
      }),
    });
    findByIdAndDelete.mockResolvedValue({ _id: ID, iso: 'SN' });
  });

  it('PATCH refuse sans admin', async () => {
    requireApiRoles.mockRejectedValue(ApiErrors.FORBIDDEN);
    expect((await patch({ status: 'present' })).status).toBe(403);
  });

  it('PATCH répond 409 si ISO déjà pris', async () => {
    exists.mockResolvedValue({ _id: 'other' });
    const res = await patch({ iso: 'CM' });
    expect(res.status).toBe(409);
  });

  it('PATCH met à jour le pays', async () => {
    const res = await patch({ status: 'present', name: 'Sénégal' });
    expect(res.status).toBe(200);
    expect(toPresenceCountry).toHaveBeenCalled();
  });

  it('DELETE retire le pays', async () => {
    const res = await DELETE(
      new NextRequest(`http://localhost/api/presence-countries/${ID}`, {
        method: 'DELETE',
      }),
      params,
    );
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });
});
