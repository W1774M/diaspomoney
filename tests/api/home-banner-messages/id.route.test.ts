/**
 * PATCH/DELETE /api/home-banner-messages/[id]
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiErrors } from '@/lib/api/error-handler';
import { ROLES } from '@/lib/constants';

const ID = '507f1f77bcf86cd799439011';

const {
  requireApiRoles,
  invalidateHomeContent,
  toBannerMessage,
  findByIdAndUpdate,
  findByIdAndDelete,
  dbConnect,
} = vi.hoisted(() => ({
  requireApiRoles: vi.fn(),
  invalidateHomeContent: vi.fn(),
  toBannerMessage: vi.fn((doc: unknown) => doc),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
  dbConnect: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({ requireApiRoles }));
vi.mock('@/lib/home-content.server', () => ({
  invalidateHomeContent,
  toBannerMessage,
}));
vi.mock('@/lib/mongodb', () => ({ default: dbConnect }));
vi.mock('@/models/HomeContent', () => ({
  HomeBannerMessageModel: { findByIdAndUpdate, findByIdAndDelete },
}));

import { PATCH, DELETE } from '@/app/api/home-banner-messages/[id]/route';

const adminSession = { user: { id: 'admin-1', roles: [ROLES.ADMIN] } };
const params = { params: { id: ID } };

function patch(body: unknown) {
  return PATCH(
    new NextRequest(`http://localhost/api/home-banner-messages/${ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    params,
  );
}

describe('/api/home-banner-messages/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiRoles.mockResolvedValue(adminSession);
    dbConnect.mockResolvedValue(undefined);
    findByIdAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: ID,
        textBefore: 'Hello',
        isActive: true,
      }),
    });
    findByIdAndDelete.mockResolvedValue({ _id: ID });
  });

  it('PATCH refuse sans admin', async () => {
    requireApiRoles.mockRejectedValue(ApiErrors.FORBIDDEN);
    expect((await patch({ textBefore: 'X' })).status).toBe(403);
  });

  it('PATCH répond 404 pour id invalide', async () => {
    const res = await PATCH(
      new NextRequest('http://localhost/api/home-banner-messages/bad', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textBefore: 'X' }),
      }),
      { params: { id: 'bad' } },
    );
    expect(res.status).toBe(404);
  });

  it('PATCH met à jour et invalide le cache', async () => {
    const res = await patch({ textBefore: 'Promo', isActive: true });
    expect(res.status).toBe(200);
    expect(invalidateHomeContent).toHaveBeenCalled();
  });

  it('DELETE supprime le message', async () => {
    const res = await DELETE(
      new NextRequest(`http://localhost/api/home-banner-messages/${ID}`, {
        method: 'DELETE',
      }),
      params,
    );
    expect(res.status).toBe(200);
    expect(invalidateHomeContent).toHaveBeenCalled();
  });
});
