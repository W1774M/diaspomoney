/**
 * PUT/DELETE /api/beneficiaries/[id]
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuth, findByEmail, updateBeneficiary, deleteBeneficiary } = vi.hoisted(
  () => ({
    mockAuth: vi.fn(),
    findByEmail: vi.fn(),
    updateBeneficiary: vi.fn(),
    deleteBeneficiary: vi.fn(),
  }),
);

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/repositories', () => ({
  getUserRepository: () => ({ findByEmail }),
}));
vi.mock('@/facades', () => ({
  beneficiaryFacade: { updateBeneficiary, deleteBeneficiary },
}));

import { PUT, DELETE } from '@/app/api/beneficiaries/[id]/route';

const BEN_ID = '507f1f77bcf86cd799439011';
const USER_ID = '507f1f77bcf86cd799439099';

function params(id = BEN_ID) {
  return { params: { id } };
}

function put(body: unknown, id = BEN_ID) {
  return PUT(
    new NextRequest(`http://localhost/api/beneficiaries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    params(id),
  );
}

function del(id = BEN_ID) {
  return DELETE(
    new NextRequest(`http://localhost/api/beneficiaries/${id}`, {
      method: 'DELETE',
    }),
    params(id),
  );
}

describe('/api/beneficiaries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { email: 'client@example.com' } });
    findByEmail.mockResolvedValue({ id: USER_ID, email: 'client@example.com' });
    updateBeneficiary.mockResolvedValue({
      success: true,
      beneficiary: {
        id: BEN_ID,
        firstName: 'Awa',
        lastName: 'Diallo',
        email: 'awa@example.com',
        phone: '+221',
        relationship: 'CHILD',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    deleteBeneficiary.mockResolvedValue({ success: true });
  });

  it('PUT refuse sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await put({ firstName: 'Awa' })).status).toBe(401);
  });

  it('PUT répond 404 si user inconnu', async () => {
    findByEmail.mockResolvedValue(null);
    expect((await put({ firstName: 'Awa' })).status).toBe(404);
  });

  it('PUT met à jour et mappe le bénéficiaire', async () => {
    const res = await put({ firstName: 'Awa', lastName: 'Diallo' });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.beneficiary.name).toBe('Awa Diallo');
    expect(updateBeneficiary).toHaveBeenCalledWith(
      USER_ID,
      BEN_ID,
      expect.objectContaining({ firstName: 'Awa', lastName: 'Diallo' }),
    );
  });

  it('PUT dérive userId depuis _id', async () => {
    findByEmail.mockResolvedValue({
      _id: { toString: () => USER_ID },
      email: 'client@example.com',
    });
    await put({ firstName: 'Awa' });
    expect(updateBeneficiary).toHaveBeenCalledWith(
      USER_ID,
      BEN_ID,
      expect.any(Object),
    );
  });

  it('DELETE refuse sans session', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await del()).status).toBe(401);
  });

  it('DELETE propage une erreur facade', async () => {
    deleteBeneficiary.mockResolvedValue({ success: false, error: 'Introuvable' });
    expect((await del()).status).toBe(400);
  });

  it('DELETE réussit', async () => {
    const res = await del();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message).toMatch(/supprimé/i);
    expect(deleteBeneficiary).toHaveBeenCalledWith(USER_ID, BEN_ID);
  });
});
