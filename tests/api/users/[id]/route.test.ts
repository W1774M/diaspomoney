/**
 * Tests unitaires pour PUT /api/users/[id] : contrôle des rôles et du statut.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT } from '@/app/api/users/[id]/route';

const { mockAuth, mockGetUserProfile, mockUpdateUserProfile } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetUserProfile: vi.fn(),
  mockUpdateUserProfile: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/services/user/user.service', () => ({
  userService: {
    getUserProfile: mockGetUserProfile,
    updateUserProfile: mockUpdateUserProfile,
  },
}));

const CALLER_ID = '507f1f77bcf86cd799439011';
const TARGET_ID = '507f1f77bcf86cd799439012';

type Profile = { roles: string[]; status: string };
let profiles: Record<string, Profile>;

const loginAs = (roles: string[], status = 'ACTIVE') => {
  profiles[CALLER_ID] = { roles, status };
  mockAuth.mockResolvedValue({ user: { id: CALLER_ID, roles } });
};

const put = (id: string, body: Record<string, unknown>) =>
  PUT(
    new NextRequest(`http://localhost:3000/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
    { params: { id } },
  );

beforeEach(() => {
  vi.clearAllMocks();
  profiles = {
    [TARGET_ID]: { roles: ['CUSTOMER'], status: 'ACTIVE' },
  };
  mockGetUserProfile.mockImplementation(async (id: string) => {
    const profile = profiles[id];
    if (!profile) throw new Error('Utilisateur non trouvé');
    return { id, email: `${id}@example.com`, ...profile };
  });
  mockUpdateUserProfile.mockImplementation(async (id: string, update: Record<string, unknown>) => ({
    id,
    email: `${id}@example.com`,
    ...profiles[id],
    ...update,
  }));
});

describe('PUT /api/users/[id] — modification de son propre compte', () => {
  it.each([['CUSTOMER'], ['PROVIDER'], ['CSM'], ['BENEFICIARY']])(
    'un %s ne peut pas se donner le rôle SUPERADMIN',
    async role => {
      loginAs([role]);

      const response = await put(CALLER_ID, { roles: [role, 'SUPERADMIN'] });

      expect(response.status).toBe(403);
      expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    },
  );

  it('un client ne peut pas changer ses propres rôles ni son statut', async () => {
    loginAs(['CUSTOMER'], 'SUSPENDED');

    expect((await put(CALLER_ID, { roles: ['PROVIDER'] })).status).toBe(403);
    expect((await put(CALLER_ID, { status: 'ACTIVE' })).status).toBe(403);
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });

  it('un prestataire ne peut pas se marquer « recommandé »', async () => {
    loginAs(['PROVIDER']);

    const response = await put(CALLER_ID, { recommended: true });

    expect(response.status).toBe(403);
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });

  it('un client peut modifier son nom en renvoyant ses rôles et statut inchangés', async () => {
    loginAs(['CUSTOMER']);

    const response = await put(CALLER_ID, {
      firstName: 'Awa',
      roles: ['CUSTOMER'],
      status: 'ACTIVE',
    });

    expect(response.status).toBe(200);
    expect(mockUpdateUserProfile).toHaveBeenCalledWith(
      CALLER_ID,
      expect.objectContaining({ firstName: 'Awa' }),
    );
  });

  it('un ADMIN ne peut pas se promouvoir SUPERADMIN', async () => {
    loginAs(['ADMIN']);

    const response = await put(CALLER_ID, { roles: ['ADMIN', 'SUPERADMIN'] });

    expect(response.status).toBe(403);
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });
});

describe('PUT /api/users/[id] — modification d’un autre compte', () => {
  it('retourne 401 sans session', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await put(TARGET_ID, { firstName: 'X' });

    expect(response.status).toBe(401);
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });

  it('retourne 403 pour un non-admin', async () => {
    loginAs(['CSM']);

    const response = await put(TARGET_ID, { firstName: 'X' });

    expect(response.status).toBe(403);
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });

  it.each([['ADMIN'], ['SUPERADMIN']])(
    'un ADMIN ne peut pas attribuer le rôle %s',
    async role => {
      loginAs(['ADMIN']);

      const response = await put(TARGET_ID, { roles: ['CUSTOMER', role] });

      expect(response.status).toBe(403);
      expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    },
  );

  it('un ADMIN ne peut pas retirer le rôle ADMIN à un autre admin', async () => {
    loginAs(['ADMIN']);
    profiles[TARGET_ID] = { roles: ['ADMIN'], status: 'ACTIVE' };

    const response = await put(TARGET_ID, { roles: ['CUSTOMER'] });

    expect(response.status).toBe(403);
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });

  it('un ADMIN ne peut pas suspendre un SUPERADMIN', async () => {
    loginAs(['ADMIN']);
    profiles[TARGET_ID] = { roles: ['SUPERADMIN'], status: 'ACTIVE' };

    const response = await put(TARGET_ID, { roles: ['SUPERADMIN'], status: 'SUSPENDED' });

    expect(response.status).toBe(403);
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });

  it('un ADMIN peut modifier un autre ADMIN sans toucher à ses rôles', async () => {
    loginAs(['ADMIN']);
    profiles[TARGET_ID] = { roles: ['ADMIN'], status: 'ACTIVE' };

    const response = await put(TARGET_ID, { phone: '0600000000', roles: ['ADMIN'], status: 'ACTIVE' });

    expect(response.status).toBe(200);
    expect(mockUpdateUserProfile).toHaveBeenCalled();
  });

  it('un ADMIN peut faire d’un client un prestataire et changer son statut', async () => {
    loginAs(['ADMIN']);

    const response = await put(TARGET_ID, { roles: ['CUSTOMER', 'PROVIDER'], status: 'SUSPENDED' });

    expect(response.status).toBe(200);
    expect(mockUpdateUserProfile).toHaveBeenCalledWith(
      TARGET_ID,
      expect.objectContaining({ roles: ['CUSTOMER', 'PROVIDER'], status: 'SUSPENDED' }),
    );
  });

  it('un SUPERADMIN peut nommer un ADMIN', async () => {
    loginAs(['SUPERADMIN']);

    const response = await put(TARGET_ID, { roles: ['ADMIN'] });

    expect(response.status).toBe(200);
    expect(mockUpdateUserProfile).toHaveBeenCalledWith(
      TARGET_ID,
      expect.objectContaining({ roles: ['ADMIN'] }),
    );
  });

  it('retourne 400 (et non 500) pour un rôle ou un statut inconnu', async () => {
    loginAs(['SUPERADMIN']);

    expect((await put(TARGET_ID, { roles: ['ROOT'] })).status).toBe(400);
    expect((await put(TARGET_ID, { status: 'VERIFIED' })).status).toBe(400);
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });
});
