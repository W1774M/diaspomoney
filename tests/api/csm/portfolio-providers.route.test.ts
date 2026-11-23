// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const h = vi.hoisted(() => ({
  auth: vi.fn(),
  findOne: vi.fn(),
  updateOne: vi.fn(),
  propose: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: h.auth }));
vi.mock('@/lib/database/mongodb', () => ({
  getMongoClient: vi.fn(async () => ({
    db: () => ({ collection: () => ({ findOne: h.findOne, updateOne: h.updateOne }) }),
  })),
}));
vi.mock('@/lib/cache/redis', () => ({ invalidateAppCache: vi.fn() }));
vi.mock('@/services/csm/propose-provider.use-case', () => ({
  proposeProviderForCsm: h.propose,
}));

import { POST } from '@/app/api/csm/portfolio/providers/route';

const CSM_ID = '64d2f9c3e6a1b2c3d4e5f678';
const PROVIDER_ID = '650000000000000000000001';

const post = (body: unknown) =>
  POST(
    new NextRequest('http://localhost:3000/api/csm/portfolio/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  h.auth.mockResolvedValue({ user: { id: CSM_ID, name: 'Camille', roles: ['CSM'] } });
});

describe('POST /api/csm/portfolio/providers', () => {
  it('refuse un non-CSM', async () => {
    h.auth.mockResolvedValueOnce({ user: { id: CSM_ID, roles: ['CUSTOMER'] } });
    const res = await post({ providerId: PROVIDER_ID });
    expect(res.status).toBe(403);
  });

  it('accepte un identifiant contenant des chiffres (ancienne regex [a-f\\\\d] cassée)', async () => {
    h.findOne.mockResolvedValueOnce({ _id: PROVIDER_ID });
    const res = await post({ providerId: PROVIDER_ID });
    expect(res.status).toBe(200);
    expect(h.updateOne).toHaveBeenCalledWith(
      expect.anything(),
      { $addToSet: { csmPortfolioProviderIds: PROVIDER_ID } },
    );
  });

  it('refuse (404) un identifiant qui n’est pas un prestataire', async () => {
    h.findOne.mockResolvedValueOnce(null);
    const res = await post({ providerId: PROVIDER_ID });
    expect(res.status).toBe(404);
    expect(h.updateOne).not.toHaveBeenCalled();
  });

  it('ajoute par coordonnées via le cas d’usage (prestataire sans compte)', async () => {
    h.propose.mockResolvedValueOnce({
      status: 'created',
      providerId: 'newprov1',
      providerName: 'Sow',
      missingInfo: ['e-mail'],
    });
    const res = await post({ provider: { lastName: 'Sow', phone: '0601020304' } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(JSON.stringify(data)).toContain('"status":"created"');
    expect(h.propose).toHaveBeenCalledWith(
      expect.objectContaining({ lastName: 'Sow', phone: '0601020304', type: 'INDIVIDUAL' }),
      expect.objectContaining({ csmId: CSM_ID, csmName: 'Camille' }),
    );
  });

  it('refuse (400) des coordonnées sans e-mail ni téléphone', async () => {
    const res = await post({ provider: { lastName: 'Sow' } });
    expect(res.status).toBe(400);
    expect(h.propose).not.toHaveBeenCalled();
  });

  it('renvoie 409 si l’e-mail appartient à un compte non prestataire', async () => {
    h.propose.mockResolvedValueOnce({ status: 'conflict', message: 'Un compte non prestataire existe déjà' });
    const res = await post({ provider: { lastName: 'Sow', email: 'awa@exemple.fr' } });
    expect(res.status).toBe(409);
  });
});
