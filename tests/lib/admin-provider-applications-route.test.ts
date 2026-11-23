import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireApiRoles, toArray, findOneAndUpdate, collection } = vi.hoisted(() => {
  const toArray = vi.fn();
  const findOneAndUpdate = vi.fn();
  const cursor = { sort: vi.fn(), limit: vi.fn(), toArray };
  cursor.sort.mockReturnValue(cursor);
  cursor.limit.mockReturnValue(cursor);
  return {
    requireApiRoles: vi.fn(),
    toArray,
    findOneAndUpdate,
    collection: vi.fn(() => ({ find: vi.fn(() => cursor), findOneAndUpdate })),
  };
});

vi.mock('@/lib/api/auth', () => ({ requireApiRoles }));
vi.mock('@/lib/mongodb', () => ({
  getMongoClient: vi.fn(async () => ({ db: () => ({ collection }) })),
}));

import { GET } from '@/app/api/admin/provider-applications/route';
import { PATCH } from '@/app/api/admin/provider-applications/[id]/route';
import { ApiErrors } from '@/lib/api/error-handler';
import { ROLES } from '@/lib/constants';

const ID = '665f1c2b9b1e8a0012345678';

const patch = (id: string, body: unknown) =>
  PATCH(
    new NextRequest(`http://localhost/api/admin/provider-applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );

describe('/api/admin/provider-applications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiRoles.mockResolvedValue({ user: { id: 'admin-1', roles: [ROLES.ADMIN] }, roles: [ROLES.ADMIN] });
  });

  it('liste les candidatures, statut « nouvelle » par défaut pour les anciennes', async () => {
    toArray.mockResolvedValue([
      {
        _id: ID,
        name: 'Awa Diallo',
        email: 'awa@example.com',
        phone: '+33 6 00 00 00 00',
        submittedAt: new Date('2026-11-01T10:00:00Z'),
      },
    ]);

    const res = await GET(new NextRequest('http://localhost/api/admin/provider-applications'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(requireApiRoles).toHaveBeenCalledWith([ROLES.ADMIN, ROLES.SUPERADMIN]);
    expect(collection).toHaveBeenCalledWith('roadmap_provider_interest');
    expect(body.applications).toEqual([
      expect.objectContaining({
        id: ID,
        name: 'Awa Diallo',
        status: 'new',
        note: '',
        submittedAt: '2026-11-01T10:00:00.000Z',
      }),
    ]);
  });

  it('refuse un utilisateur sans rôle admin', async () => {
    requireApiRoles.mockRejectedValue(ApiErrors.FORBIDDEN);
    const res = await GET(new NextRequest('http://localhost/api/admin/provider-applications'));
    expect(res.status).toBe(403);
    expect(toArray).not.toHaveBeenCalled();
  });

  it('met à jour le statut et trace l’admin', async () => {
    findOneAndUpdate.mockResolvedValue({ _id: ID, name: 'Awa', email: 'a@x.fr', phone: '', status: 'contacted' });

    const res = await patch(ID, { status: 'contacted' });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.application.status).toBe('contacted');
    const [, update] = findOneAndUpdate.mock.calls[0]!;
    expect(update.$set).toMatchObject({ status: 'contacted', updatedBy: 'admin-1' });
    expect(update.$set).not.toHaveProperty('note');
  });

  it('rejette un statut inconnu ou un corps vide', async () => {
    expect((await patch(ID, { status: 'hired' })).status).toBe(400);
    expect((await patch(ID, {})).status).toBe(400);
    expect(findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('renvoie 404 pour un identifiant invalide ou inexistant', async () => {
    expect((await patch('pas-un-id', { status: 'accepted' })).status).toBe(404);
    findOneAndUpdate.mockResolvedValue(null);
    expect((await patch(ID, { status: 'accepted' })).status).toBe(404);
  });
});
