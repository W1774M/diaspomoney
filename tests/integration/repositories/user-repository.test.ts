/**
 * MongoUserRepository sur la base de test : mots de passe, 2FA, vérifications, recherches
 * filtrées et pagination ; et la liste admin (userFacade.getUsers) qui s'appuie dessus.
 * (Le CRUD commun est couvert par crud.test.ts.)
 */
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { beforeAll, describe, expect, it } from 'vitest';

import { userFacade } from '@/facades/user.facade';
import dbConnect from '@/lib/mongodb';
import { MongoUserRepository } from '@/repositories/implementations/MongoUserRepository';

const repo = new MongoUserRepository();

// createWithPassword et verifyPassword passent par le modèle Mongoose
beforeAll(async () => {
  await dbConnect();
});
const uniq = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const make = (extra: Record<string, unknown> = {}) =>
  repo.create({
    email: `user-${uniq()}@test.fr`,
    firstName: 'Awa',
    lastName: 'Diallo',
    roles: ['CUSTOMER'],
    status: 'ACTIVE',
    ...extra,
  } as never);

describe('MongoUserRepository : création et lecture', () => {
  it('normalise l’e-mail, refuse les doublons et mappe les champs dérivés', async () => {
    const u = await make({ email: '  Moussa.Bah@Test.FR ', countryOfResidence: 'SN', emailVerified: true });
    expect(u).toMatchObject({ email: 'moussa.bah@test.fr', name: 'Awa Diallo', country: 'SN', isActive: true, isEmailVerified: true, kycStatus: 'PENDING' });
    await expect(make({ email: 'moussa.bah@test.fr' })).rejects.toThrow('existe déjà');
    expect(await repo.findByEmail('MOUSSA.BAH@test.fr')).toMatchObject({ id: u.id });
    expect(await repo.findByEmail('')).toBeNull();
  });

  it('accepte un _id fourni et ignore un _id invalide', async () => {
    const id = new ObjectId();
    expect((await make({ _id: id })).id).toBe(id.toString());
    expect(ObjectId.isValid((await make({ _id: 'pas-un-id' })).id)).toBe(true);
  });

  it('crée avec mot de passe via le modèle (haché) et le vérifie', async () => {
    const email = `mdp-${uniq()}@test.fr`;
    const u = await repo.createWithPassword({ email, firstName: 'A', lastName: 'B', password: 'Secret-123!' } as never);
    expect(u).toMatchObject({ email, status: 'PENDING', roles: ['CUSTOMER'], name: 'A B' });
    expect(await repo.verifyPassword(u.id, 'Secret-123!')).toBe(true);
    expect(await repo.verifyPassword(u.id, 'mauvais')).toBe(false);
    await expect(repo.createWithPassword({ email: email.toUpperCase(), password: 'x' } as never)).rejects.toThrow('existe déjà');
  });

  it('vérifie un mot de passe : compte sans mot de passe, inconnu ou id invalide', async () => {
    const u = await make();
    expect(await repo.verifyPassword(u.id, 'x')).toBe(false);
    expect(await repo.verifyPassword(new ObjectId().toString(), 'x')).toBe(false);
    expect(await repo.verifyPassword('invalide', 'x')).toBe(false);
  });

  it('renvoie null pour un identifiant invalide ou inconnu', async () => {
    expect(await repo.findById('invalide')).toBeNull();
    expect(await repo.update('invalide', { firstName: 'X' })).toBeNull();
    expect(await repo.update(new ObjectId().toString(), { firstName: 'X' })).toBeNull();
  });
});

describe('MongoUserRepository : mot de passe, e-mail, KYC et 2FA', () => {
  it('change le mot de passe (avec ou sans date de changement)', async () => {
    const u = await make();
    const hash = await bcrypt.hash('Nouveau-1!', 4);
    expect(await repo.updatePassword(u.id, hash)).toBe(true);
    const after = (await repo.findById(u.id)) as Record<string, unknown>;
    expect(after['password']).toBe(hash);
    expect(after['passwordChangedAt']).toBeInstanceOf(Date);
    expect(await repo.verifyPassword(u.id, 'Nouveau-1!')).toBe(true);

    const other = await make();
    expect(await repo.updatePassword(other.id, hash, false)).toBe(true);
    expect((await repo.findById(other.id) as Record<string, unknown>)['passwordChangedAt']).toBeUndefined();
    expect(await repo.updatePassword('', hash)).toBe(false);
    expect(await repo.updatePassword(new ObjectId().toString(), hash)).toBe(false);
  });

  it('vérifie l’e-mail et met à jour le statut KYC', async () => {
    const u = await make();
    expect(await repo.verifyEmail(u.id)).toBe(true);
    expect(await repo.updateKYCStatus(u.id, 'APPROVED')).toBe(true);
    expect(await repo.findById(u.id)).toMatchObject({ isEmailVerified: true, kycStatus: 'APPROVED' });
    expect(await repo.verifyEmail(new ObjectId().toString())).toBe(false);
  });

  it('prépare, active, consomme et désactive la 2FA', async () => {
    const u = await make();
    expect(await repo.get2FAInfo(u.id)).toEqual({});
    expect(await repo.setup2FA(u.id, 'SECRET', ['A', 'B'])).toBe(true);
    expect(await repo.get2FAInfo(u.id)).toEqual({ twoFactorSecret: 'SECRET', twoFactorBackupCodes: ['A', 'B'], twoFactorEnabled: false });
    expect(await repo.enable2FA(u.id)).toBe(true);
    expect(await repo.update2FABackupCodes(u.id, ['B'])).toBe(true);
    expect(await repo.get2FAInfo(u.id)).toMatchObject({ twoFactorEnabled: true, twoFactorBackupCodes: ['B'] });
    expect(await repo.disable2FA(u.id)).toBe(true);
    expect(await repo.get2FAInfo(u.id)).toMatchObject({ twoFactorEnabled: false, twoFactorBackupCodes: [] });
    expect(await repo.get2FAInfo(new ObjectId().toString())).toBeNull();
  });
});

describe('MongoUserRepository : recherches', () => {
  const seed = async () => {
    const tag = uniq();
    const a = await make({ roles: ['CUSTOMER'], status: 'ACTIVE', countryOfResidence: `FR-${tag}`, targetCity: `Dakar-${tag}`, emailVerified: true, kycStatus: 'APPROVED', phone: `+33600${tag}` });
    const b = await make({ roles: ['PROVIDER'], status: 'PENDING', countryOfResidence: `FR-${tag}`, specialty: `cardio-${tag}` });
    const c = await make({ roles: ['ADMIN', 'CSM'], status: 'SUSPENDED', countryOfResidence: `SN-${tag}` });
    return { tag, a, b, c };
  };
  const ids = (r: { data: Array<{ id: string }> }) => r.data.map((u) => u.id).sort();

  it('cherche par rôle et par statut', async () => {
    const { b, c } = await seed();
    expect((await repo.findByRole('PROVIDER')).map((u) => u.id)).toContain(b.id);
    expect((await repo.findByStatus('SUSPENDED')).map((u) => u.id)).toContain(c.id);
  });

  it('applique chaque filtre de findUsersWithFilters', async () => {
    const { tag, a, b, c } = await seed();
    const scope = { country: `FR-${tag}` };
    expect(ids(await repo.findUsersWithFilters(scope))).toEqual([a.id, b.id].sort());
    expect(ids(await repo.findUsersWithFilters({ ...scope, role: 'PROVIDER' }))).toEqual([b.id]);
    expect(ids(await repo.findUsersWithFilters({ ...scope, roles: ['CUSTOMER'] } as never))).toEqual([a.id]);
    expect(ids(await repo.findUsersWithFilters({ ...scope, status: 'PENDING' } as never))).toEqual([b.id]);
    expect(ids(await repo.findUsersWithFilters({ ...scope, status: ['ACTIVE', 'PENDING'] } as never))).toEqual([a.id, b.id].sort());
    expect(ids(await repo.findUsersWithFilters({ ...scope, isActive: true } as never))).toEqual([a.id]);
    expect(ids(await repo.findUsersWithFilters({ ...scope, isActive: false } as never))).toEqual([b.id]);
    expect(ids(await repo.findUsersWithFilters({ ...scope, isEmailVerified: true } as never))).toEqual([a.id]);
    expect(ids(await repo.findUsersWithFilters({ ...scope, kycStatus: 'APPROVED' } as never))).toEqual([a.id]);
    expect(ids(await repo.findUsersWithFilters({ specialty: `cardio-${tag}` } as never))).toEqual([b.id]);
    expect(ids(await repo.findUsersWithFilters({ city: `Dakar-${tag}` } as never))).toEqual([a.id]);
    expect(ids(await repo.findUsersWithFilters({ email: a.email.toUpperCase() } as never))).toEqual([a.id]);
    expect(ids(await repo.findUsersWithFilters({ country: `SN-${tag}` }))).toEqual([c.id]);
  });

  it('filtre par téléphone (comptes des bénéficiaires)', async () => {
    const { tag, a } = await seed();
    expect(ids(await repo.findUsersWithFilters({ phone: `+33600${tag}` } as never, { limit: 1, page: 1, offset: 0 }))).toEqual([a.id]);
    expect((await repo.findUsersWithFilters({ phone: '+00000000000' } as never, { limit: 1, page: 1, offset: 0 })).total).toBe(0);
  });

  it('pagine et trie', async () => {
    const { tag } = await seed();
    const scope = { countryOfResidence: `FR-${tag}` };
    const p1 = await repo.findWithPagination(scope as never, { limit: 1, page: 1, sort: { createdAt: 1 } });
    expect(p1).toMatchObject({ total: 2, pagination: { page: 1, limit: 1, pages: 2, hasNext: true, hasPrev: false } });
    const p2 = await repo.findWithPagination(scope as never, { limit: 1, offset: 1, sort: { createdAt: 1 } } as never);
    expect(p2.pagination).toMatchObject({ page: 2, hasNext: false, hasPrev: true });
    expect(p2.data[0]!.id).not.toBe(p1.data[0]!.id);

    const viaFilters = await repo.findUsersWithFilters({ country: `FR-${tag}` }, { limit: 1, page: 2, sort: { createdAt: 1 } } as never);
    expect(viaFilters.data[0]!.id).toBe(p2.data[0]!.id);
  });
});

describe('userFacade.getUsers (liste admin)', () => {
  it('filtre par rôle, statut et recherche, et pagine', async () => {
    const tag = uniq().replace(/[^a-z0-9]/gi, '');
    const provider = await make({ roles: ['PROVIDER'], lastName: `Prestataire${tag}` });
    await make({ roles: ['CUSTOMER'], lastName: `Client${tag}` });
    await make({ roles: ['PROVIDER'], status: 'PENDING', lastName: `Attente${tag}` });

    const byRole = await userFacade.getUsers({ role: 'PROVIDER', status: ['ACTIVE'], search: tag } as never, { limit: 20, page: 1 });
    expect(byRole.success).toBe(true);
    expect(byRole.data!.map((u) => u.id)).toEqual([provider.id]);

    const bySearch = await userFacade.getUsers({ search: `client${tag}` } as never, { limit: 20, page: 1 });
    expect(bySearch.data!.map((u) => u.lastName)).toEqual([`Client${tag}`]);

    const page = await userFacade.getUsers({ search: tag } as never, { limit: 2, page: 2 });
    expect(page.total).toBe(3);
    expect(page.data).toHaveLength(1);
    expect(page.pagination).toMatchObject({ page: 2, limit: 2, total: 3 });
  });

  it('traite la recherche comme du texte, pas comme une expression régulière', async () => {
    const tag = uniq().replace(/[^a-z0-9]/gi, '');
    await make({ lastName: `Zed${tag}` });
    const res = await userFacade.getUsers({ search: `.*${tag}(` } as never, { limit: 20, page: 1 });
    expect(res.success).toBe(true);
    expect(res.data).toEqual([]);
  });
});
